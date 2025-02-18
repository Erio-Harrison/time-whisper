import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Power, Settings } from 'lucide-react';
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
      <Card className="bg-gradient-to-br from-gray-50 to-white">
        <CardContent className="p-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 relative">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-amber-400 rounded-full animate-spin"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6 relative">
        {/* 时光涟漪效果 */}
        <div className={`
          absolute inset-0 -z-10 pointer-events-none rounded-xl transition-opacity duration-300
          ${enabled ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/20 to-transparent animate-pulse rounded-xl"></div>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-start space-x-4">
            <div className={`
              p-3 rounded-xl transition-all duration-300 
              ${enabled 
                ? 'bg-gradient-to-br from-amber-50 to-amber-100 shadow-inner' 
                : 'bg-gray-100'
              }
            `}>
              <Settings className={`
                h-5 w-5 transition-colors duration-300 
                ${enabled ? 'text-amber-600' : 'text-gray-400'}
              `} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-serif text-gray-800">开机自动启动</h3>
              <p className="text-sm text-gray-500">
                {enabled ? '已开启自动启动' : '已关闭自动启动'}
              </p>
            </div>
          </div>

          {/* 优化后的机械风格开关 */}
          <div 
            onClick={handleToggle}
            className={`
              group relative w-24 h-10 rounded-xl cursor-pointer 
              transition-all duration-300 shadow-inner
              ${enabled 
                ? 'bg-gradient-to-r from-amber-100 to-amber-200' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200'
              }
            `}
          >
            {/* 状态文字指示器 - 重新设计 */}
            <div className="absolute -top-6 left-0 right-0 text-center pointer-events-none">
              <span className={`
                text-xs font-serif tracking-wide
                transition-all duration-300
                ${enabled 
                  ? 'text-amber-600 opacity-100' 
                  : 'text-gray-400 opacity-0'
                }
              `}>
                已启用
              </span>
            </div>

            {/* 装饰性齿轮 */}
            <div className="absolute inset-y-0 left-2 flex items-center opacity-20 pointer-events-none 
                          group-hover:opacity-30 transition-opacity duration-300">
              <Settings className="w-4 h-4" />
            </div>
            <div className="absolute inset-y-0 right-2 flex items-center opacity-20 pointer-events-none
                          group-hover:opacity-30 transition-opacity duration-300">
              <Settings className="w-4 h-4" />
            </div>

            {/* 开关滑块 */}
            <div className={`
              absolute top-1 h-8 w-8 
              rounded-lg bg-white shadow-lg
              transition-all duration-300 
              flex items-center justify-center pointer-events-none
              ${enabled 
                ? 'translate-x-14 ring-2 ring-amber-200 ring-opacity-50' 
                : 'translate-x-1'
              }
            `}>
              <Power className={`
                h-4 w-4 transition-colors duration-300
                ${enabled ? 'text-amber-500' : 'text-gray-400'}
              `} />
            </div>

            {/* 刻度线装饰 */}
            <div className="absolute inset-y-2 inset-x-4 flex justify-between pointer-events-none">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className={`
                    w-px h-full bg-black/5 transition-opacity duration-300
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