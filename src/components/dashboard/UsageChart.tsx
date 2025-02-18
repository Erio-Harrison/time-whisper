import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Leaf, Sun } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

type UsageData = {
  name: string;
  minutes: number;
  hours: string;
  processName: string;
};

const generateNatureColor = (str: string) => {
  const hash = str.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const hue = 15 + (hash % 30);
  return {
    start: `hsl(${hue}, 40%, 90%)`,
    end: `hsl(${hue}, 35%, 80%)`
  };
};

const AppIcon = ({ name, rank }: { name: string; rank: number }) => {
  const firstChar = name.match(/^[\u4e00-\u9fa5]/) ? 
    name.charAt(0) : 
    name.charAt(0).toUpperCase();

  const gradientColors = generateNatureColor(name);
  
  return (
    <div className={`
      relative w-10 h-10 rounded-xl 
      flex items-center justify-center 
      bg-gradient-to-br from-yellow-50 to-yellow-100/80
      shadow-inner overflow-hidden
      transition-all duration-300
      ${rank <= 3 ? 'ring-2 ring-yellow-700/20' : ''}
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
        {firstChar}
      </span>
      
      {rank <= 3 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-100 to-yellow-200 
                       rounded-full flex items-center justify-center shadow-lg">
          <Leaf className="w-3 h-3 text-yellow-700/70" />
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
        <foreignObject x="-160" y="-20" width="140" height="40">
          <div className="flex items-center space-x-3 h-full group">
            <AppIcon name={app.name} rank={rank} />
            <div className="flex flex-col">
              <span className="text-sm font-serif text-zinc-600 truncate">{app.name}</span>
            </div>
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
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-4 relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-transparent"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3">
                <AppIcon name={app.name} rank={rank} />
                <div>
                  <p className="font-serif text-zinc-800">{app.name}</p>
                  <p className="text-sm text-zinc-500 font-serif">时光痕迹 #{rank}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-yellow-100">
                <div className="flex items-center space-x-2 text-sm text-zinc-600">
                  <Sun className="w-4 h-4 text-yellow-600/50" />
                  <span className="font-serif">{app.hours} 小时</span>
                  <span className="text-yellow-200">|</span>
                  <span className="font-serif">{app.minutes} 分钟</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-zinc-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-black to-transparent"></div>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-16 h-16 rounded-full bg-black/5"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `drift${i} 15s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-yellow-50 shadow-inner">
              <Sun className="h-5 w-5 text-yellow-700/50" />
            </div>
            <h2 className="text-xl font-serif text-zinc-700">时光印记</h2>
          </div>
        </div>

        <div className="rounded-xl p-6 bg-gradient-to-br from-zinc-50/50 to-white/50 border shadow-inner backdrop-blur-[1px]">
          <ResponsiveContainer width="100%" height={Math.max(400, data.length * 65)}>
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 160, bottom: 10 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d4b08c" />
                  <stop offset="100%" stopColor="#e2c4a8" />
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
                tick={{ fill: '#666', fontSize: 12, fontFamily: 'serif' }}
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
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}