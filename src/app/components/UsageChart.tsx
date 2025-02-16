// app/components/UsageChart.tsx
'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type UsageData = {
  name: string;
  minutes: number;
  hours: string;
}

export function UsageChart({ data }: { data: UsageData[] }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={({ x, y, payload }) => (
              <text 
                x={x} 
                y={y} 
                dy={16} 
                textAnchor="end" 
                transform={`rotate(-45 ${x},${y})`}
                fill="#666"
                fontSize={12}
              >
                {payload.value}
              </text>
            )}
          />
          <YAxis 
            label={{ 
              value: '使用时长(分钟)', 
              angle: -90, 
              position: 'insideLeft',
            }} 
          />
          <Tooltip 
            formatter={(value: number) => [`${value} 分钟`, '使用时长']}
          />
          <Legend />
          <Bar 
            dataKey="minutes" 
            name="使用时长" 
            fill="#60a5fa"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}