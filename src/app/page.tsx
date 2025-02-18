"use client"

import { useState, useEffect } from 'react';
import { Clock, Zap, Hourglass, AlertCircle } from 'lucide-react';
import { StyledUsageChart } from '../components/dashboard/UsageChart';
import { StyledUsageTable } from '../components/dashboard/UsageTable';
import StyledAutoStart from '../components/dashboard/AutoStart';
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

// 优雅的加载状态组件
const LoadingState = ({ status, debug }: { status: string; debug: string[] }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
    <div className="max-w-lg w-full p-8">
      <div className="text-center mb-8">
        <div className="mb-6">
          <Hourglass className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
        </div>
        <h1 className="text-2xl font-serif text-gray-800 mb-4">{status}</h1>
        <div className="w-16 h-16 mx-auto relative">
          <div className="absolute inset-0 border-4 border-amber-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-amber-400 rounded-full animate-spin"></div>
        </div>
      </div>
      
      <div className="mt-8 backdrop-blur-sm bg-white/80 rounded-xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-sm font-serif text-gray-600 mb-3 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-amber-400" />
          调试信息
        </h2>
        <div className="text-xs text-gray-500 h-48 overflow-auto space-y-2 bg-gray-50/50 rounded-lg p-4">
          {debug.map((msg, index) => (
            <div 
              key={index} 
              className="flex items-start space-x-2 py-1 border-b border-gray-100 last:border-0"
            >
              <span className="text-amber-400 font-mono">#{index + 1}</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// 空状态组件
const EmptyState = () => (
  <div className="text-center py-16">
    <Hourglass className="w-16 h-16 text-amber-300 mx-auto mb-4" />
    <h3 className="text-xl font-serif text-gray-700 mb-2">时光静默中...</h3>
    <p className="text-gray-500 max-w-md mx-auto">
      暂无使用数据，让我们开始记录您的时间故事
    </p>
  </div>
);

export default function Home() {
  const [appUsage, setAppUsage] = useState<FormattedUsage[]>([]);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [status, setStatus] = useState<string>('正在开启时光之旅...');
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
        setDebug(prev => [...prev, '正在唤醒时间记录器...']);
        const data = await invoke<Record<string, AppUsage>>('get_app_usage');
        setAppUsage(formatUsageData(data));
        setDebug(prev => [...prev, '初始数据获取成功']);

        setDebug(prev => [...prev, '正在设置数据同步...']);
        const unlisten = await listen<Record<string, AppUsage>>('usage_updated', (event) => {
          const formattedData = formatUsageData(event.payload);
          setAppUsage(formattedData);
          setDebug(prev => [...prev, '收到数据更新']);
        });
        
        setDebug(prev => [...prev, '同步成功，准备就绪']);
        setStatus('ready');

        return () => {
          unlisten();
          setDebug(prev => [...prev, '正在安静地离开...']);
        };
      } catch (error) {
        const errorMessage = `遇到了一些小问题: ${error instanceof Error ? error.message : '未知错误'}`;
        setStatus(errorMessage);
        setDebug(prev => [...prev, `错误: ${errorMessage}`]);
        console.error('初始化错误:', error);
      }
    };

    init();
  }, []);

  if (status !== 'ready') {
    return <LoadingState status={status} debug={debug} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="sticky top-0 backdrop-blur-lg bg-white/70 border-b border-gray-200/50 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 
                            flex items-center justify-center shadow-inner">
                <Hourglass className="h-6 w-6 text-amber-600" />
              </div>
              <h1 className="text-2xl font-serif text-gray-800">时间低语</h1>
            </div>

            <div className="flex p-1 bg-gray-100/80 backdrop-blur rounded-full shadow-inner">
              <button
                onClick={() => setActiveTab('chart')}
                className={`
                  px-4 py-2 rounded-full transition-all duration-300
                  flex items-center space-x-2
                  ${activeTab === 'chart' 
                    ? 'bg-white text-amber-600 shadow-lg' 
                    : 'text-gray-600 hover:text-amber-500'
                  }
                `}
              >
                <Zap className="h-4 w-4" />
                <span>图表视图</span>
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`
                  px-4 py-2 rounded-full transition-all duration-300
                  flex items-center space-x-2
                  ${activeTab === 'table' 
                    ? 'bg-white text-amber-600 shadow-lg' 
                    : 'text-gray-600 hover:text-amber-500'
                  }
                `}
              >
                <Clock className="h-4 w-4" />
                <span>详细数据</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <StyledAutoStart />
        
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg border border-gray-100">
          {appUsage.length > 0 ? (
            activeTab === 'chart' ? (
              <StyledUsageChart data={appUsage} />
            ) : (
              <StyledUsageTable />
            )
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      {/* 品牌水印 */}
      <div className="fixed bottom-4 right-4 font-serif text-gray-200 text-sm rotate-12">
        记录你的时光
      </div>
    </div>
  );
}