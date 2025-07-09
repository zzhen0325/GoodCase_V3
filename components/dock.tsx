"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Upload, Settings, Bot, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Dock导航项接口
interface DockItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

// Dock组件属性
interface DockProps {
  onUpload: () => void;
  onImport: () => void;
  onExport: () => void;
  onSettings: () => void;
  onFavorites: () => void;
  onLarkDoc: () => void;
  activeView?: string;
}

// Dock导航组件
export function Dock({ 
  onUpload, 
  onImport, 
  onExport, 
  onSettings, 
  onFavorites,
  onLarkDoc,
  activeView = 'grid'
}: DockProps) {
  // 导航项配置
  const dockItems: DockItem[] = [
    {
      id: 'import',
      icon: <Upload className="w-5 h-5" />,
      label: '导入数据',
      onClick: onImport,
      isActive: activeView === 'import'
    },
    {
      id: 'export',
      icon: <Download className="w-5 h-5" />,
      label: '导出数据',
      onClick: onExport,
      isActive: activeView === 'export'
    },
    {
      id: 'upload',
      icon: <Plus className="w-5 h-5" />,
      label: '上传图片',
      onClick: onUpload
    },
    {
      id: 'lark-doc',
      icon: <ExternalLink className="w-5 h-5" />,
      label: '飞书文档',
      onClick: onLarkDoc,
      isActive: activeView === 'lark-doc'
    },
    
    {
      id: 'favorites',
      icon: <Bot className="w-5 h-5" />,
      label: 'AI助手',
      onClick: () => window.open('https://www.coze.cn/store/agent/7517149263135670299?bot_id=true&bid=6gr8nq8so6013', '_blank'),
      isActive: activeView === 'favorites'
    }
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ 
          y: -8,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
      <div className="bg-black border border-gray-700 rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-black/50 p-2 transition-shadow duration-200">
        <div className="flex items-center gap-6">
          {dockItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.2, 
                delay: index * 0.05,
                ease: "easeOut"
              }}
            >
              <Button
                variant={item.isActive ? "default" : "ghost"}
                size="sm"
                onClick={item.onClick}
                className={`
                  relative h-12 w-12 rounded-xl transition-all duration-200
                  hover:scale-110 hover:bg-white hover:text-black group text-white
                  ${item.isActive ? 'bg-white text-black shadow-md' : ''}
                `}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  {item.icon}
                </motion.div>
                
                {/* 悬浮文字提示 */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap border border-gray-600">
                    {item.label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
                
                {/* 活跃状态指示器 */}
                {item.isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* 悬浮提示 */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow-md whitespace-nowrap">
          快速导航
        </div>
      </div>
      </motion.div>
    </div>
  );
}

// Dock项组件（可选的独立组件）
interface DockItemComponentProps {
  item: DockItem;
  index: number;
}

export function DockItemComponent({ item, index }: DockItemComponentProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        duration: 0.2, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant={item.isActive ? "default" : "ghost"}
        size="sm"
        onClick={item.onClick}
        className={`
          relative h-12 w-12 rounded-xl transition-all duration-200
          hover:bg-white hover:text-black group text-white
          ${item.isActive ? 'bg-white text-black shadow-md' : ''}
        `}
      >
        {item.icon}
        
        {/* 悬浮标签 */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-md whitespace-nowrap border border-gray-600">
            {item.label}
          </div>
        </div>
        
        {/* 活跃状态指示器 */}
        {item.isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        )}
      </Button>
    </motion.div>
  );
}