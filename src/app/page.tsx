'use client'

import { useState, useEffect } from 'react';
import { Clock, Leaf, AlertCircle, Sun } from 'lucide-react';
import { StyledUsageChart } from '../components/dashboard/UsageChart';
import { StyledUsageTable } from '../components/dashboard/UsageTable';
import StyledAutoStart from '../components/dashboard/AutoStart';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { formatProcessName } from '../lib/processName';

// 预定义的光影位置
const LIGHT_POSITIONS = [
  { left: '10%', top: '20%', rotate: '45deg' },
  { left: '30%', top: '40%', rotate: '90deg' },
  { left: '50%', top: '30%', rotate: '135deg' },
  { left: '70%', top: '60%', rotate: '180deg' },
  { left: '90%', top: '50%', rotate: '225deg' },
  { left: '20%', top: '80%', rotate: '270deg' },
  { left: '40%', top: '70%', rotate: '315deg' },
  { left: '60%', top: '90%', rotate: '0deg' },
];

// 客户端光影效果组件
const LightEffects = () => (
  <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-black to-transparent"></div>
    {LIGHT_POSITIONS.map((pos, i) => (
      <div
        key={i}
        className="absolute w-32 h-32 rounded-full bg-black/5"
        style={{
          left: pos.left,
          top: pos.top,
          transform: `rotate(${pos.rotate})`,
          animation: `lightDrift 20s infinite ease-in-out ${i * 0.5}s`,
        }}
      />
    ))}
  </div>
);

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

// 加载状态组件
const LoadingState = ({ status, debug }: { status: string; debug: string[] }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-white relative overflow-hidden">
    <LightEffects />
    <div className="max-w-lg w-full p-8 relative">
      <div className="text-center mb-8">
        <div className="mb-6 relative">
          <div className="w-16 h-16 mx-auto relative">
            <Sun className="w-full h-full text-yellow-600/30 animate-pulse" />
            <div className="absolute inset-0 animate-spin-slow">
              <Leaf className="w-6 h-6 text-yellow-700/20 absolute -top-2 left-5" />
              <Leaf className="w-6 h-6 text-yellow-700/20 absolute top-5 -right-2 rotate-90" />
              <Leaf className="w-6 h-6 text-yellow-700/20 absolute -bottom-2 left-5 rotate-180" />
              <Leaf className="w-6 h-6 text-yellow-700/20 absolute top-5 -left-2 -rotate-90" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl font-serif text-zinc-700 mb-4">{status}</h1>
        <div className="w-16 h-16 mx-auto relative">
          <div className="absolute inset-0 border-4 border-yellow-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-yellow-600/30 rounded-full animate-spin"></div>
        </div>
      </div>
      
      <div className="mt-8 backdrop-blur-sm bg-white/80 rounded-xl p-6 shadow-lg border border-yellow-100">
        <h2 className="text-sm font-serif text-zinc-600 mb-3 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-yellow-600/50" />
          时光追溯
        </h2>
        <div className="text-xs text-zinc-500 h-48 overflow-auto space-y-2 bg-yellow-50/30 rounded-lg p-4">
          {debug.map((msg, index) => (
            <div 
              key={index} 
              className="flex items-start space-x-2 py-1.5 border-b border-yellow-100/50 last:border-0"
            >
              <span className="text-yellow-600/50 font-serif">#{index + 1}</span>
              <span className="font-serif">{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// 空状态组件
const EmptyState = () => (
  <div className="text-center py-16 relative overflow-hidden">
    <div className="relative z-10">
      <div className="w-20 h-20 mx-auto mb-4 relative">
        <Sun className="w-full h-full text-yellow-600/30" />
        <div className="absolute inset-0 animate-spin-slow">
          <Leaf className="w-8 h-8 text-yellow-700/20 absolute -top-3 left-6" />
          <Leaf className="w-8 h-8 text-yellow-700/20 absolute top-6 -right-3 rotate-90" />
          <Leaf className="w-8 h-8 text-yellow-700/20 absolute -bottom-3 left-6 rotate-180" />
          <Leaf className="w-8 h-8 text-yellow-700/20 absolute top-6 -left-3 -rotate-90" />
        </div>
      </div>
      <h3 className="text-xl font-serif text-zinc-700 mb-2">时光静默中...</h3>
      <p className="text-zinc-500 max-w-md mx-auto font-serif">
        静待绿叶摇曳，记录时光的印记
      </p>
    </div>
  </div>
);

export default function Home() {
  const [appUsage, setAppUsage] = useState<FormattedUsage[]>([]);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const [status, setStatus] = useState<string>('静待时光绽放...');
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
        setDebug(prev => [...prev, '唤醒沉睡的时光...']);
        const data = await invoke<Record<string, AppUsage>>('get_app_usage');
        setAppUsage(formatUsageData(data));
        setDebug(prev => [...prev, '捕捉到第一片时光叶']);

        setDebug(prev => [...prev, '编织时光的网络...']);
        const unlisten = await listen<Record<string, AppUsage>>('usage_updated', (event) => {
          const formattedData = formatUsageData(event.payload);
          setAppUsage(formattedData);
          setDebug(prev => [...prev, '时光悄然流转']);
        });
        
        setDebug(prev => [...prev, '光影交织，准备就绪']);
        setStatus('ready');

        return () => {
          unlisten();
          setDebug(prev => [...prev, '轻轻阖上时光之书...']);
        };
      } catch (error) {
        const errorMessage = `时光迷失: ${error instanceof Error ? error.message : '未知的小故事'}`;
        setStatus(errorMessage);
        setDebug(prev => [...prev, `遗落的足迹: ${errorMessage}`]);
        console.error('初始化错误:', error);
      }
    };

    init();
  }, []);

  if (status !== 'ready') {
    return <LoadingState status={status} debug={debug} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white relative">
      <LightEffects />

      <header className="sticky top-0 backdrop-blur-lg bg-white/70 border-b border-yellow-100/50 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/80 
                           flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-px w-full bg-yellow-900/20"
                      style={{ top: `${i * 4}px` }}
                    />
                  ))}
                </div>
                <Clock className="h-6 w-6 text-yellow-700/50 relative z-10" />
              </div>
              <h1 className="text-2xl font-serif text-zinc-700">时间低语</h1>
            </div>

            <div className="flex p-1.5 bg-zinc-100/80 backdrop-blur rounded-full shadow-inner">
              <button
                onClick={() => setActiveTab('chart')}
                className={`
                  px-4 py-2 rounded-full transition-all duration-300
                  flex items-center space-x-2 font-serif
                  ${activeTab === 'chart' 
                    ? 'bg-white text-yellow-700/70 shadow-lg' 
                    : 'text-zinc-600 hover:text-yellow-700/50'
                  }
                `}
              >
                <Leaf className="h-4 w-4" />
                <span>韵律之图</span>
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`
                  px-4 py-2 rounded-full transition-all duration-300
                  flex items-center space-x-2 font-serif
                  ${activeTab === 'table' 
                    ? 'bg-white text-yellow-700/70 shadow-lg' 
                    : 'text-zinc-600 hover:text-yellow-700/50'
                  }
                `}
              >
                <Clock className="h-4 w-4" />
                <span>时光细读</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6 relative">
        <StyledAutoStart />
        
        <div className="bg-gradient-to-br from-zinc-50 to-white rounded-xl shadow-lg 
                     border border-yellow-100/50 relative overflow-hidden">
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
      <div className="fixed bottom-4 right-4 font-serif text-yellow-900/5 text-sm rotate-12">
        悄然记录，时光低语
      </div>
    </div>
  );
}