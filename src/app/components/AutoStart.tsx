'use client'

import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Power } from 'lucide-react';

const AutoStartSetting = () => {
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
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Power className={`h-5 w-5 ${enabled ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
        <div>
          <h3 className="text-lg font-medium">开机自启动</h3>
          <p className="text-sm text-gray-500">
            {enabled ? '已开启开机自启动' : '已关闭开机自启动'}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {/* 添加传统按钮作为备选 */}
        <Button 
          variant={enabled ? "default" : "outline"}
          onClick={handleToggle}
          className="min-w-[100px]"
        >
          {enabled ? '已开启' : '已关闭'}
        </Button>
        
        {/* 保留开关组件 */}
        <Switch 
          checked={enabled}
          onCheckedChange={handleToggle}
          className="h-6 w-11 data-[state=checked]:bg-blue-500"
        />
      </div>
    </div>
  );
};

export default AutoStartSetting;