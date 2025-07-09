"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  type: 'loading' | 'success' | 'error' | 'info';
  title: string;
  description?: string;
  progress?: number; // 0-100
  duration?: number; // 毫秒，0表示不自动关闭
  onClose: (id: string) => void;
}

const toastVariants = {
  initial: { opacity: 0, x: 100, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 100, scale: 0.95 }
};

const iconMap = {
  loading: Loader2,
  success: CheckCircle,
  error: AlertCircle,
  info: Info
};

const colorMap = {
  loading: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-gray-200 bg-gray-50 text-gray-900'
};

const iconColorMap = {
  loading: 'text-blue-500',
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-gray-500'
};

const progressColorMap = {
  loading: 'bg-blue-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-gray-500'
};

export function Toast({ 
  id, 
  type, 
  title, 
  description, 
  progress, 
  onClose 
}: ToastProps) {
  const Icon = iconMap[type];
  
  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "relative w-80 rounded-lg border p-4 shadow-lg backdrop-blur-sm",
        colorMap[type]
      )}
    >
      {/* 关闭按钮 */}
      <button
        onClick={() => onClose(id)}
        className="absolute right-2 top-2 rounded-full p-1 hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {/* 内容区域 */}
      <div className="flex items-start gap-3 pr-6">
        {/* 图标 */}
        <div className={cn("flex-shrink-0 mt-0.5", iconColorMap[type])}>
          <Icon 
            className={cn(
              "h-5 w-5",
              type === 'loading' && "animate-spin"
            )} 
          />
        </div>

        {/* 文本内容 */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-5">
            {title}
          </h4>
          {description && (
            <p className="mt-1 text-xs opacity-80 leading-4">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* 进度条 */}
      {typeof progress === 'number' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="opacity-70">进度</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-black/10 rounded-full h-1.5">
            <motion.div
              className={cn("h-1.5 rounded-full", progressColorMap[type])}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </div>
  );
}