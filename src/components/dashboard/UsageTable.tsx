import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Clock, Moon, Sun } from 'lucide-react';
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
  { id: 'daily', label: '今日', icon: Sun },
  { id: '3days', label: '近三天', icon: Clock },
  { id: 'weekly', label: '本周', icon: Clock },
  { id: 'monthly', label: '本月', icon: Moon },
];

const TimeRangeBadge = ({ range }: { range: string }) => {
  const timeRange = TIME_RANGES.find(r => r.id === range);
  if (!timeRange) return null;
  
  const Icon = timeRange.icon;
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-sm">
      <Icon className="w-4 h-4 mr-1" />
      <span className="font-medium">{timeRange.label}</span>
    </div>
  );
};

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="w-16 h-16 relative">
      <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
    <p className="mt-4 text-gray-500 font-serif">数据加载中...</p>
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
      setError(err instanceof Error ? err.message : '获取数据失败');
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    fetchRangeData('daily');
  }, []);

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-50">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <span className="font-serif">使用时长详情</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
          <TabsList className="grid w-full grid-cols-4 p-1 bg-gray-100/80 backdrop-blur rounded-xl">
            {TIME_RANGES.map((range) => (
              <TabsTrigger 
                key={range.id} 
                value={range.id}
                className="data-[state=active]:bg-white data-[state=active]:text-amber-600 
                         data-[state=active]:shadow-md rounded-lg transition-all duration-200
                         py-2 px-4"
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
                <div className="text-red-500 text-center py-8 bg-red-50 rounded-lg">
                  {error}
                </div>
              ) : timeRangeData[range.id] ? (
                <div className="rounded-xl overflow-hidden border bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-white">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            应用名称
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            使用时长
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <TimeRangeBadge range={range.id} />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {timeRangeData[range.id]?.slice(0, 10).map((app, index) => (
                          <tr 
                            key={app.processName}
                            className={`
                              hover:bg-gray-50 transition-colors duration-150
                              ${index < 3 ? 'bg-amber-50/30' : 'bg-white'}
                            `}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className={`
                                  w-8 h-8 rounded-xl flex items-center justify-center
                                  ${index < 3 ? 'bg-gradient-to-br from-amber-100 to-amber-200' : 'bg-gray-100'}
                                `}>
                                  <span className="text-sm font-serif">
                                    {app.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-700">
                                    {app.name}
                                  </div>
                                  {index < 3 && (
                                    <div className="text-xs text-amber-600">
                                      Top {index + 1}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400">
                                    {app.processName}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {app.hours} 小时
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm text-gray-500">
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