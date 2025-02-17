'use client'

import { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { UsageChart } from '../components/dashboard/UsageChart';
import { UsageTable } from '../components/dashboard/UsageTable';
import AutoStartSetting from '../components/dashboard/AutoStart';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { formatProcessName } from '../lib/processName';

interface AppUsage {
  name: string;
  total_time: number;
  last_active: number;
  process_name?: string;
}

type FormattedUsage = {
  name: string;
  minutes: number;
  hours: string;
  processName: string;
}

export default function Home() {
  const [appUsage, setAppUsage] = useState<FormattedUsage[]>([]);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [status, setStatus] = useState<string>('正在加载数据...');
  const [debug, setDebug] = useState<string[]>([]);

  const formatUsageData = (data: Record<string, AppUsage>): FormattedUsage[] => {
    return Object.entries(data)
      .map(([key, app]) => {
        const processName = app.process_name || key;
        return {
          name: formatProcessName(processName),
          minutes: Math.round(app.total_time / 60),
          hours: (app.total_time / 3600).toFixed(1),
          processName: processName
        };
      })
      .sort((a, b) => b.minutes - a.minutes);
  };

  useEffect(() => {
    const init = async () => {
      try {
        setDebug(prev => [...prev, '正在获取初始数据...']);
        const data = await invoke<Record<string, AppUsage>>('get_app_usage');
        setAppUsage(formatUsageData(data));
        setDebug(prev => [...prev, '初始数据获取成功']);

        setDebug(prev => [...prev, '正在设置数据更新监听器...']);
        const unlisten = await listen<Record<string, AppUsage>>('usage_updated', (event) => {
          const formattedData = formatUsageData(event.payload);
          setAppUsage(formattedData);
          setDebug(prev => [...prev, '收到数据更新']);
        });
        
        setDebug(prev => [...prev, '监听器设置成功']);
        setStatus('ready');

        return () => {
          unlisten();
          setDebug(prev => [...prev, '清理监听器']);
        };
      } catch (error) {
        const errorMessage = `加载失败: ${error instanceof Error ? error.message : '未知错误'}`;
        setStatus(errorMessage);
        setDebug(prev => [...prev, `错误: ${errorMessage}`]);
        console.error('初始化错误:', error);
      }
    };

    init();
  }, []);

  if (status !== 'ready') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-lg w-full p-6">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{status}</h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
          
          <div className="mt-8 bg-gray-100 rounded-lg p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">调试信息:</h2>
            <div className="text-xs text-gray-600 h-48 overflow-auto">
              {debug.map((msg, index) => (
                <div key={index} className="mb-1">{msg}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">软件使用时长统计</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'chart' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Zap className="inline-block mr-2 h-4 w-4" />
                图表视图
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'table' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Clock className="inline-block mr-2 h-4 w-4" />
                详细数据
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <AutoStartSetting />
        
        <div className="bg-white rounded-lg shadow p-6">
          {appUsage.length > 0 ? (
            activeTab === 'chart' ? (
              <UsageChart data={appUsage} />
            ) : (
              <UsageTable />
            )
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无使用数据
            </div>
          )}
        </div>
      </main>
    </div>
  );
}