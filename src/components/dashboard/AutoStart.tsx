import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
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
    return <div className="p-4 flex justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
    </div>;
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg transition-colors ${enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <Power className={`h-5 w-5 transition-colors ${enabled ? 'text-blue-600' : 'text-gray-400'}`} />
        </div>
        <div>
          <h3 className="text-lg font-medium">开机自动开启</h3>
          <p className="text-sm text-gray-500">
            {enabled ? '已开启开机自动开启' : '已关闭开机自动开启'}
          </p>
        </div>
      </div>
      
      <div 
        onClick={handleToggle}
        className="relative w-24 h-10 rounded-full cursor-pointer transition-colors duration-200 ease-in-out"
        style={{
          backgroundColor: enabled ? '#3b82f6' : '#e5e7eb',
          padding: '2px'
        }}
      >
        <div 
          className={`
            absolute top-1 h-8 w-8 rounded-full bg-white shadow-md
            transition-transform duration-200 ease-in-out
            flex items-center justify-center
            ${enabled ? 'translate-x-14' : 'translate-x-1'}
          `}
        >
          <Power className={`h-4 w-4 ${enabled ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
        <div className={`
          absolute inset-0 flex items-center
          text-xs font-medium text-white
          transition-opacity duration-200
        `}>
          <span className={`ml-3 ${enabled ? 'opacity-0' : 'opacity-100'}`}>关闭</span>
          <span className={`ml-auto mr-3 ${enabled ? 'opacity-100' : 'opacity-0'}`}>开启</span>
        </div>
      </div>
    </div>
  );
};

export default AutoStartSetting;