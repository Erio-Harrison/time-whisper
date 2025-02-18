"use client"

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Star, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type UsageData = {
  name: string;
  minutes: number;
  hours: string;
  processName: string;
};

// 生成渐变色
const generateGradientColor = (str: string) => {
  const hash = str.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const hue = hash % 360;
  return {
    start: `hsl(${hue}, 70%, 85%)`,
    end: `hsl(${hue}, 70%, 65%)`
  };
};

const AppIcon = ({ name, rank }: { name: string; rank: number }) => {
  const firstChar = name.match(/^[\u4e00-\u9fa5]/) ? 
    name.charAt(0) : 
    name.charAt(0).toUpperCase();

  const gradientColors = generateGradientColor(name);
  
  return (
    <div className={`
      relative w-8 h-8 rounded-xl 
      flex items-center justify-center 
      bg-gradient-to-br from-amber-100 to-amber-200
      shadow-lg
      ${rank <= 3 ? 'ring-2 ring-amber-200 ring-opacity-50' : ''}
    `}>
      <span className="text-sm font-serif text-gray-700">{firstChar}</span>
      {rank <= 3 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
          <Star className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};

export function StyledUsageChart({ data }: { data: UsageData[] }) {
  const sortedData = [...data].sort((a, b) => b.minutes - a.minutes);

  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const app = sortedData.find(item => item.name === payload.value);
    const rank = sortedData.findIndex(item => item.name === payload.value) + 1;
    if (!app) return null;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x="-160" y="-16" width="140" height="32">
          <div className="flex items-center space-x-3 h-full">
            <AppIcon name={app.name} rank={rank} />
            <span className="text-sm font-medium text-gray-600 truncate">{app.name}</span>
          </div>
        </foreignObject>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const app = payload[0].payload;
      const rank = sortedData.findIndex(item => item.name === app.name) + 1;
      
      return (
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AppIcon name={app.name} rank={rank} />
              <div>
                <p className="font-medium text-gray-900">{app.name}</p>
                <p className="text-sm text-gray-500">排名 #{rank}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{app.hours} 小时</span>
                <span className="text-gray-300">|</span>
                <span>{app.minutes} 分钟</span>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-50">
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <h2 className="text-xl font-serif text-gray-800">使用时长排行</h2>
          </div>
        </div>

        <div className="rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white border shadow-inner">
          <ResponsiveContainer width="100%" height={Math.max(400, data.length * 60)}>
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 160, bottom: 10 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d6b392" />
                  <stop offset="100%" stopColor="#eac7a8" />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                horizontal={false} 
                stroke="#f0f0f0" 
              />
              <XAxis
                type="number"
                tickFormatter={(value) => `${(value / 60).toFixed(1)}h`}
                tick={{ fill: '#666', fontSize: 12 }}
                stroke="#e5e7eb"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={<CustomYAxisTick />}
                width={160}
                stroke="#e5e7eb"
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: '#f8fafc', opacity: 0.5 }}
              />
              <Bar
                dataKey="minutes"
                radius={[4, 4, 4, 4]}
                fill="url(#barGradient)"
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}