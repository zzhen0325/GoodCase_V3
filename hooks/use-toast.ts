"use client"

import { useState, useCallback, useRef } from 'react';
import { ToastProps } from '@/components/ui/toast';

export interface ToastOptions {
  type: 'loading' | 'success' | 'error' | 'info';
  title: string;
  description?: string;
  progress?: number;
  duration?: number; // 默认4000ms，0表示不自动关闭
}

export interface ToastInstance extends ToastOptions {
  id: string;
  createdAt: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const idCounter = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    
    // 清除对应的定时器
    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
  }, []);

  const addToast = useCallback((options: ToastOptions): string => {
    const id = `toast-${++idCounter.current}`;
    const toast: ToastInstance = {
      ...options,
      id,
      createdAt: Date.now(),
      duration: options.duration ?? (options.type === 'loading' ? 0 : 4000)
    };

    setToasts(prev => [...prev, toast]);

    // 设置自动关闭定时器（如果duration > 0）
    if (toast.duration > 0) {
      const timeoutId = setTimeout(() => {
        removeToast(id);
      }, toast.duration);
      timeoutRefs.current.set(id, timeoutId);
    }

    return id;
  }, [removeToast]);

  const updateToast = useCallback((id: string, updates: Partial<ToastOptions>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));

    // 如果更新了duration，重新设置定时器
    if (updates.duration !== undefined) {
      const existingTimeout = timeoutRefs.current.get(id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        timeoutRefs.current.delete(id);
      }

      if (updates.duration > 0) {
        const timeoutId = setTimeout(() => {
          removeToast(id);
        }, updates.duration);
        timeoutRefs.current.set(id, timeoutId);
      }
    }
  }, [removeToast]);

  const clearAllToasts = useCallback(() => {
    // 清除所有定时器
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
    setToasts([]);
  }, []);

  // 便捷方法
  const toast = {
    loading: (title: string, description?: string, progress?: number) => 
      addToast({ type: 'loading', title, description, progress }),
    
    success: (title: string, description?: string, duration?: number) => 
      addToast({ type: 'success', title, description, duration }),
    
    error: (title: string, description?: string, duration?: number) => 
      addToast({ type: 'error', title, description, duration }),
    
    info: (title: string, description?: string, duration?: number) => 
      addToast({ type: 'info', title, description, duration }),

    // 更新进度（主要用于loading状态）
    updateProgress: (id: string, progress: number) => 
      updateToast(id, { progress }),

    // 将loading toast转换为success/error
    resolve: (id: string, title?: string, description?: string) => {
      updateToast(id, { 
        type: 'success', 
        title: title || '操作成功', 
        description,
        progress: undefined,
        duration: 3000 
      });
    },

    reject: (id: string, title?: string, description?: string) => {
      updateToast(id, { 
        type: 'error', 
        title: title || '操作失败', 
        description,
        progress: undefined,
        duration: 5000 
      });
    },

    // 手动关闭
    dismiss: removeToast,
    
    // 清除所有
    clear: clearAllToasts
  };

  return {
    toasts,
    toast,
    removeToast
  };
}