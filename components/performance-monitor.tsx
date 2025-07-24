'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceMetrics {
  apiResponseTime: number;
  imageLoadTime: number;
  totalImages: number;
  loadedImages: number;
  failedImages: number;
  cacheHitRate: number;
  memoryUsage?: number;
}

interface PerformanceMonitorProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onClose?: () => void;
}

// 性能监控Hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiResponseTime: 0,
    imageLoadTime: 0,
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    cacheHitRate: 0,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  // 开始监控API响应时间
  const startApiTimer = useCallback(() => {
    return performance.now();
  }, []);

  // 结束API计时
  const endApiTimer = useCallback((startTime: number) => {
    const responseTime = performance.now() - startTime;
    setMetrics(prev => ({
      ...prev,
      apiResponseTime: responseTime
    }));
    return responseTime;
  }, []);

  // 监控图片加载
  const monitorImageLoad = useCallback((imageUrl: string) => {
    const startTime = performance.now();
    
    return new Promise<number>((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        setMetrics(prev => ({
          ...prev,
          imageLoadTime: (prev.imageLoadTime + loadTime) / 2, // 平均加载时间
          loadedImages: prev.loadedImages + 1
        }));
        resolve(loadTime);
      };
      
      img.onerror = () => {
        setMetrics(prev => ({
          ...prev,
          failedImages: prev.failedImages + 1
        }));
        resolve(-1);
      };
      
      img.src = imageUrl;
    });
  }, []);

  // 更新缓存命中率
  const updateCacheHitRate = useCallback((hits: number, total: number) => {
    const rate = total > 0 ? (hits / total) * 100 : 0;
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: rate
    }));
  }, []);

  // 更新总图片数
  const updateTotalImages = useCallback((total: number) => {
    setMetrics(prev => ({
      ...prev,
      totalImages: total
    }));
  }, []);

  // 获取内存使用情况
  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
      }));
    }
  }, []);

  // 重置指标
  const resetMetrics = useCallback(() => {
    setMetrics({
      apiResponseTime: 0,
      imageLoadTime: 0,
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      cacheHitRate: 0,
    });
  }, []);

  // 定期更新内存使用情况
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(updateMemoryUsage, 1000);
    return () => clearInterval(interval);
  }, [isMonitoring, updateMemoryUsage]);

  return {
    metrics,
    isMonitoring,
    setIsMonitoring,
    startApiTimer,
    endApiTimer,
    monitorImageLoad,
    updateCacheHitRate,
    updateTotalImages,
    updateMemoryUsage,
    resetMetrics
  };
}

// 性能监控显示组件
export function PerformanceMonitor({
  show = false,
  position = 'bottom-right',
  onClose
}: PerformanceMonitorProps) {
  const { metrics, isMonitoring, setIsMonitoring, resetMetrics } = usePerformanceMonitor();
  const [expanded, setExpanded] = useState(false);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatMemory = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(1)}MB`;
    return `${(mb / 1024).toFixed(1)}GB`;
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`fixed ${positionClasses[position]} z-50`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                性能监控
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className={`w-4 h-4 transform transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                className={`px-2 py-1 text-xs rounded ${isMonitoring ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
              >
                {isMonitoring ? '停止' : '开始'}
              </button>
              
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 简化视图 */}
          {!expanded && (
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">API响应</span>
                <span className={`text-xs font-mono ${getPerformanceColor(metrics.apiResponseTime, { good: 500, warning: 1000 })}`}>
                  {formatTime(metrics.apiResponseTime)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-400">图片加载</span>
                <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  {metrics.loadedImages}/{metrics.totalImages}
                </span>
              </div>
            </div>
          )}

          {/* 详细视图 */}
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3">
                {/* API性能 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API性能</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">响应时间</span>
                      <span className={`text-xs font-mono ${getPerformanceColor(metrics.apiResponseTime, { good: 500, warning: 1000 })}`}>
                        {formatTime(metrics.apiResponseTime)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">缓存命中率</span>
                      <span className={`text-xs font-mono ${getPerformanceColor(100 - metrics.cacheHitRate, { good: 20, warning: 50 })}`}>
                        {metrics.cacheHitRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 图片加载 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">图片加载</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">平均加载时间</span>
                      <span className={`text-xs font-mono ${getPerformanceColor(metrics.imageLoadTime, { good: 1000, warning: 3000 })}`}>
                        {formatTime(metrics.imageLoadTime)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">成功加载</span>
                      <span className="text-xs font-mono text-green-600">
                        {metrics.loadedImages}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">加载失败</span>
                      <span className="text-xs font-mono text-red-600">
                        {metrics.failedImages}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">总计</span>
                      <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                        {metrics.totalImages}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 内存使用 */}
                {metrics.memoryUsage && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">内存使用</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">JS堆内存</span>
                      <span className={`text-xs font-mono ${getPerformanceColor(metrics.memoryUsage, { good: 50, warning: 100 })}`}>
                        {formatMemory(metrics.memoryUsage)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={resetMetrics}
                    className="w-full px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
                  >
                    重置指标
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PerformanceMonitor;