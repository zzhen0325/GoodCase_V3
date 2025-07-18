'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// 进度状态类型
export type ProgressStatus =
  | 'idle'
  | 'reading'
  | 'parsing'
  | 'uploading'
  | 'processing'
  | 'downloading'
  | 'preparing'
  | 'success'
  | 'error'
  | 'cancelled';

// 进度信息接口
export interface ProgressInfo {
  status: ProgressStatus;
  progress: number; // 0-100
  message: string;
  details?: string;
  error?: string;
}

// 进度弹窗组件属性
interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  progressInfo: ProgressInfo;
  title: string;
  allowCancel?: boolean;
}

// 状态配置
const statusConfig = {
  idle: { icon: Loader2, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  reading: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  parsing: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  uploading: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  processing: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  downloading: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  preparing: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  success: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  error: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-100' },
  cancelled: {
    icon: AlertCircle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
  },
};

export function ProgressModal({
  isOpen,
  onClose,
  onCancel,
  progressInfo,
  title,
  allowCancel = true,
}: ProgressModalProps) {
  const { status, progress, message, details, error } = progressInfo;
  const config = statusConfig[status];
  const Icon = config.icon;

  const isCompleted =
    status === 'success' || status === 'error' || status === 'cancelled';
  const isLoading = !isCompleted && status !== 'idle';

  return (
    <Dialog open={isOpen} onOpenChange={isCompleted ? onClose : undefined}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon
              className={`w-5 h-5 ${config.color} ${isLoading ? 'animate-spin' : ''}`}
            />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{message}</span>
              <span className="text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>

            <Progress value={progress} className="w-full" />
          </div>

          {/* 详细信息 */}
          {details && (
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {details}
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            {!isCompleted && allowCancel && onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={status === 'idle'}
              >
                取消
              </Button>
            )}

            {isCompleted && (
              <Button onClick={onClose}>
                {status === 'success' ? '完成' : '关闭'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 进度管理 Hook
export function useProgress() {
  const [progressInfo, setProgressInfo] = React.useState<ProgressInfo>({
    status: 'idle',
    progress: 0,
    message: '准备中...',
  });

  const updateProgress = React.useCallback((updates: Partial<ProgressInfo>) => {
    setProgressInfo((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetProgress = React.useCallback(() => {
    setProgressInfo({
      status: 'idle',
      progress: 0,
      message: '准备中...',
    });
  }, []);

  return {
    progressInfo,
    updateProgress,
    resetProgress,
  };
}
