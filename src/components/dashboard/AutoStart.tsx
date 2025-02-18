import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Power, Settings, Leaf } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const StyledAutoStart = () => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke('get_auto_start_status')
      .then((status) => setEnabled(status as boolean))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    try {
      await invoke('toggle_auto_start', { enable: !enabled });
      setEnabled(!enabled);
    } catch (error) {
      console.error('Failed to toggle auto start:', error);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-zinc-50 to-white">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 relative">
              <div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-yellow-700/30 rounded-full animate-spin"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-50 to-white hover:shadow-lg transition-all duration-500">
      {/* 自然光影效果 - 模拟树叶投影 */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-black to-transparent"></div>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-12 h-12 rounded-full bg-black/5"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
              animation: `drift${i} 10s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      <CardContent className="p-6 relative backdrop-blur-[2px]">
        {/* 时光涟漪效果 */}
        <div className={`
          absolute inset-0 -z-10 pointer-events-none rounded-xl transition-all duration-500
          ${enabled ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-700/5 to-transparent animate-pulse rounded-xl"></div>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-start space-x-4">
            <div className={`
              p-3 rounded-xl transition-all duration-500 relative overflow-hidden
              ${enabled 
                ? 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 shadow-inner' 
                : 'bg-zinc-100/80'
              }
            `}>
              <Settings className={`
                h-5 w-5 transition-colors duration-500 relative z-10
                ${enabled ? 'text-yellow-700/70' : 'text-zinc-400'}
              `} />
              {/* 内部光晕效果 */}
              <div className={`
                absolute inset-0 bg-gradient-to-br from-white/40 to-transparent transition-opacity duration-500
                ${enabled ? 'opacity-100' : 'opacity-0'}
              `}></div>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-serif text-zinc-700">开机自动启动</h3>
              <p className="text-sm text-zinc-500 font-serif">
                {enabled ? '悄然启动，伴你左右' : '静待唤醒的时刻'}
              </p>
            </div>
          </div>

          {/* 木质感开关 */}
          <div 
            onClick={handleToggle}
            className={`
              group relative w-24 h-10 rounded-xl cursor-pointer 
              transition-all duration-500 shadow-inner overflow-hidden
              ${enabled 
                ? 'bg-gradient-to-r from-yellow-100/80 to-yellow-50/80' 
                : 'bg-gradient-to-r from-zinc-100/80 to-zinc-50/80'
              }
            `}
          >
            {/* 木纹纹理效果 */}
            <div className="absolute inset-0 opacity-5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-px w-full bg-yellow-900/10"
                  style={{ top: `${i * 5}px` }}
                />
              ))}
            </div>

            {/* 状态提示 */}
            <div className="absolute -top-6 left-0 right-0 text-center pointer-events-none">
              <span className={`
                text-xs font-serif tracking-wide
                transition-all duration-500
                ${enabled 
                  ? 'text-yellow-700/70 opacity-100' 
                  : 'text-zinc-400 opacity-0'
                }
              `}>
                已启用
              </span>
            </div>

            {/* 装饰性叶片 */}
            <div className="absolute inset-y-0 left-2 flex items-center opacity-20 pointer-events-none 
                          group-hover:opacity-30 transition-opacity duration-500">
              <Leaf className="w-4 h-4" />
            </div>
            <div className="absolute inset-y-0 right-2 flex items-center opacity-20 pointer-events-none
                          group-hover:opacity-30 transition-opacity duration-500">
              <Leaf className="w-4 h-4" />
            </div>

            {/* 开关滑块 */}
            <div className={`
              absolute top-1 h-8 w-8 
              rounded-lg bg-white/90 shadow-lg
              transition-all duration-500 
              flex items-center justify-center pointer-events-none
              backdrop-blur-sm
              ${enabled 
                ? 'translate-x-14 ring-2 ring-yellow-700/20' 
                : 'translate-x-1'
              }
            `}>
              <Power className={`
                h-4 w-4 transition-colors duration-500
                ${enabled ? 'text-yellow-700/70' : 'text-zinc-400'}
              `} />
              {/* 滑块内光效 */}
              <div className={`
                absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-lg
                transition-opacity duration-500
                ${enabled ? 'opacity-100' : 'opacity-50'}
              `}></div>
            </div>

            {/* 刻度线装饰 */}
            <div className="absolute inset-y-2 inset-x-4 flex justify-between pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`
                    w-px h-full bg-yellow-900/5 transition-opacity duration-500
                    ${enabled ? 'opacity-0' : 'opacity-100'}
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StyledAutoStart;