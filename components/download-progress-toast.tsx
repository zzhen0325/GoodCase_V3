'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface DownloadProgressToastProps {
  isVisible: boolean;
  progress: number;
  onClose: () => void;
}

export function DownloadProgressToast({
  isVisible,
  progress,
  onClose,
}: DownloadProgressToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border p-4 min-w-[300px]"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">
                下载进度
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-gray-500 text-right">
              {Math.round(progress)}%
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 下载进度 hook
export function useDownloadProgress() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const showProgress = useCallback(() => {
    setIsVisible(true);
    setProgress(0);
  }, []);

  const updateProgress = useCallback((value: number) => {
    setProgress(Math.min(100, Math.max(0, value)));
  }, []);

  const hideProgress = useCallback(() => {
    setIsVisible(false);
    setProgress(0);
  }, []);

  return {
    progress,
    isVisible,
    showProgress,
    updateProgress,
    hideProgress,
  };
}
