// src/components/dashboard/UsageChart.tsx
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';

type UsageData = {
  name: string;
  minutes: number;
  hours: string;
  processName: string;
};

const generateColorFromString = (str: string) => {
  const hash = str.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return `hsl(${hash % 360}, 70%, 50%)`;
};

const LetterIcon = ({ name, color }: { name: string; color: string }) => {
  // 对于中文名称，使用第一个字；对于英文名称，使用第一个字母
  const firstChar = name.match(/^[\u4e00-\u9fa5]/) ? 
    name.charAt(0) : 
    name.charAt(0).toUpperCase();

  return (
    <div 
      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium"
      style={{ backgroundColor: color }}
    >
      {firstChar}
    </div>
  );
};

export function UsageChart({ data }: { data: UsageData[] }) {
  const sortedData = [...data].sort((a, b) => b.minutes - a.minutes);

  const iconColors = useMemo(() => {
    return sortedData.reduce((acc, app) => {
      acc[app.name] = generateColorFromString(app.name);
      return acc;
    }, {} as Record<string, string>);
  }, [sortedData]);

  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const app = sortedData.find(item => item.name === payload.value);
    if (!app) return null;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <foreignObject x="-140" y="-12" width="120" height="24">
          <div className="flex items-center space-x-2 h-full">
            <LetterIcon name={app.name} color={iconColors[app.name]} />
            <span className="text-sm text-gray-700 truncate">{app.name}</span>
          </div>
        </foreignObject>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const app = payload[0].payload;
      return (
        <div className="bg-white border shadow-lg rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <LetterIcon name={app.name} color={iconColors[app.name]} />
            <p className="font-medium text-gray-900">{app.name}</p>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <p className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {`${app.hours} 小时 (${app.minutes} 分钟)`}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="h-6 w-6 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-800">应用使用时长统计</h2>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <ResponsiveContainer width="100%" height={Math.max(400, data.length * 50)}>
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 150, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(value) => `${(value / 60).toFixed(1)}h`}
              tick={{ fill: '#666', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={<CustomYAxisTick />}
              width={140}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="minutes"
              radius={[0, 4, 4, 0]}
              fill="url(#colorGradient)"
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>

        <svg style={{ height: 0 }}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}