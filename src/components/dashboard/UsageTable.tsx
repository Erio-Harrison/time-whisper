import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Clock, Moon, Sun, Leaf, Activity } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatProcessName } from '../../lib/processName';

interface AppUsageStats {
  name: string;
  total_time: number;
  daily_usage: {
    date: string;
    duration: number;
  }[];
}

type UsageData = {
  name: string;
  minutes: number;
  hours: string;
  processName: string;
}

const TIME_RANGES = [
  { id: 'daily', label: '今日', icon: Sun, desc: '晨光熹微' },
  { id: '3days', label: '近三天', icon: Activity, desc: '光影瞬息' },
  { id: 'weekly', label: '本周', icon: Leaf, desc: '叶落知时' },
  { id: 'monthly', label: '本月', icon: Moon, desc: '月光如水' },
];

const TimeRangeBadge = ({ range }: { range: string }) => {
  const timeRange = TIME_RANGES.find(r => r.id === range);
  if (!timeRange) return null;
  
  const Icon = timeRange.icon;
  return (
    <div className="inline-flex items-center px-3 py-1.5 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/80 
                    text-yellow-700/70 text-sm shadow-inner">
      <Icon className="w-4 h-4 mr-2" />
      <div className="flex flex-col items-start">
        <span className="font-serif">{timeRange.label}</span>
        <span className="text-xs opacity-70">{timeRange.desc}</span>
      </div>
    </div>
  );
};

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-16">
    <div className="w-20 h-20 relative">
      <div className="absolute inset-0 border-4 border-yellow-100 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-yellow-700/30 rounded-full animate-spin 
                    shadow-lg"></div>
      <div className="absolute -top-2 -right-2">
        <Leaf className="w-6 h-6 text-yellow-700/30 animate-pulse" />
      </div>
    </div>
    <p className="mt-6 text-zinc-500 font-serif">正在寻觅时光的痕迹...</p>
  </div>
);

export function StyledUsageTable() {
  const [timeRangeData, setTimeRangeData] = useState<Record<string, UsageData[]>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState('daily');

  const formatUsageData = (stats: AppUsageStats[]): UsageData[] => {
    return stats.map(stat => ({
      name: formatProcessName(stat.name),
      minutes: Math.round(stat.total_time / 60),
      hours: (stat.total_time / 3600).toFixed(1),
      processName: stat.name
    }));
  };

  const fetchRangeData = async (range: string) => {
    setLoading(range);
    setError(null);
    try {
      const stats = await invoke<AppUsageStats[]>('get_app_usage_stats', { range });
      const formattedData = formatUsageData(stats);
      setTimeRangeData(prev => ({
        ...prev,
        [range]: formattedData
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '时光追寻迷失了方向...');
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    fetchRangeData('daily');
  }, []);

  return (
    <Card className="bg-gradient-to-br from-zinc-50 to-white relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-3">
          <div className="p-2 rounded-full bg-yellow-50 shadow-inner">
            <Activity className="h-5 w-5 text-yellow-700/50" />
          </div>
          <span className="font-serif text-zinc-700">时光痕迹详录</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        <Tabs 
          value={activeRange} 
          className="w-full"
          onValueChange={(range) => {
            setActiveRange(range);
            if (!timeRangeData[range]) {
              fetchRangeData(range);
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-4 p-1.5 bg-zinc-100/80 backdrop-blur-sm rounded-full shadow-inner">
            {TIME_RANGES.map((range) => (
              <TabsTrigger 
                key={range.id} 
                value={range.id}
                className={`
                  data-[state=active]:bg-white 
                  data-[state=active]:text-yellow-700/70 
                  data-[state=active]:shadow-md 
                  rounded-full 
                  transition-all 
                  duration-300
                  py-2.5 
                  px-4 
                  font-serif
                  text-zinc-600 
                  hover:text-yellow-700/50
                  focus:outline-none
                  focus:ring-0
                `}
              >
                <range.icon className="w-4 h-4 mr-2" />
                {range.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TIME_RANGES.map((range) => (
            <TabsContent key={range.id} value={range.id} className="mt-6">
              {loading === range.id ? (
                <LoadingState />
              ) : error ? (
                <div className="text-yellow-700/70 text-center py-12 bg-yellow-50/50 rounded-xl 
                              border border-yellow-100 font-serif">
                  {error}
                </div>
              ) : timeRangeData[range.id] ? (
                <div className="rounded-xl overflow-hidden border border-yellow-100/50 bg-white/80 
                              backdrop-blur-sm shadow-inner">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-yellow-100">
                      <thead className="bg-gradient-to-r from-yellow-50/50 to-white/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-serif text-zinc-500 
                                     uppercase tracking-wider">
                            应用映像
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-serif text-zinc-500 
                                     uppercase tracking-wider">
                            驻留时光
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-serif text-zinc-500 
                                     uppercase tracking-wider">
                            <TimeRangeBadge range={range.id} />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-100/50">
                        {timeRangeData[range.id]?.slice(0, 10).map((app, index) => (
                          <tr 
                            key={app.processName}
                            className={`
                              group hover:bg-yellow-50/30 transition-all duration-300
                              ${index < 3 ? 'bg-yellow-50/20' : 'bg-white/80'}
                            `}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className={`
                                  w-10 h-10 rounded-xl flex items-center justify-center
                                  relative overflow-hidden transition-all duration-300
                                  ${index < 3 
                                    ? 'bg-gradient-to-br from-yellow-100/80 to-yellow-200/60 shadow-inner' 
                                    : 'bg-zinc-100/80'
                                  }
                                `}>
                                  <div className="absolute inset-0 opacity-5">
                                    {[...Array(5)].map((_, i) => (
                                      <div
                                        key={i}
                                        className="absolute h-px w-full bg-yellow-900/20"
                                        style={{ top: `${i * 4}px` }}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-serif text-yellow-800/70 relative z-10">
                                    {app.name.charAt(0)}
                                  </span>
                                  {index < 3 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 
                                                  bg-gradient-to-br from-yellow-100 to-yellow-200
                                                  rounded-full flex items-center justify-center shadow-lg">
                                      <Leaf className="w-3 h-3 text-yellow-700/70" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-serif text-zinc-700">
                                    {app.name}
                                  </div>
                                  {index < 3 && (
                                    <div className="text-xs text-yellow-700/70 font-serif">
                                      时光印记 #{index + 1}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <Sun className="w-4 h-4 text-yellow-600/40" />
                                <span className="text-sm text-zinc-600 font-serif">
                                  {app.hours} 小时
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm text-zinc-500 font-serif">
                                {app.minutes} 分钟
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}