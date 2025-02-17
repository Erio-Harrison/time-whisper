'use client'

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { formatProcessName } from '../../lib/processName';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
}

const TIME_RANGES = [
  { id: 'daily', label: '今日' },
  { id: '3days', label: '近三天' },
  { id: 'weekly', label: '本周' },
  { id: 'monthly', label: '本月' },
];

const UsageTable = () => {
  const [timeRangeData, setTimeRangeData] = useState<Record<string, UsageData[]>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeRange, setActiveRange] = useState('daily');

  const formatUsageData = (stats: AppUsageStats[]): UsageData[] => {
    return stats.map(stat => ({
      name: formatProcessName(stat.name),
      minutes: Math.round(stat.total_time / 60),
      hours: (stat.total_time / 3600).toFixed(1)
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

  const handleTabChange = (range: string) => {
    setActiveRange(range);
    if (!timeRangeData[range]) {
      fetchRangeData(range);
    }
  };

  useEffect(() => {
    fetchRangeData('daily');
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>应用使用时长统计</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeRange} className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            {TIME_RANGES.map((range) => (
              <TabsTrigger 
                key={range.id} 
                value={range.id}
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                {range.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TIME_RANGES.map((range) => (
            <TabsContent key={range.id} value={range.id}>
              {loading === range.id ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-4">{error}</div>
              ) : timeRangeData[range.id] ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        应用名称
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        使用时长(小时)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        使用时长(分钟)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeRangeData[range.id]?.slice(0, 10).map((app) => (
                      <tr key={app.name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {app.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{app.hours}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{app.minutes}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export { UsageTable };