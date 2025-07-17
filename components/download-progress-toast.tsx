"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// 下载状态类型
export type DownloadStatus = "idle" | "downloading" | "completed" | "error";

// 下载进度数据接口
export interface DownloadProgress {
  current: number;
  total: number;
  status: DownloadStatus;
  message?: string;
  error?: string;
}

// 组件属性接口
interface DownloadProgressToastProps {
  isVisible: boolean;
  progress: DownloadProgress;
  onClose: () => void;
  onCancel?: () => void;
}

// 下载进度Toast组件
export function DownloadProgressToast({
  isVisible,
  progress,
  onClose,
  onCancel,
}: DownloadProgressToastProps) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
    } else {
      // 延迟隐藏，让动画完成
      const timer = setTimeout(() => setShouldShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  // 计算进度百分比
  const percentage =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  // 获取状态图标
  const getStatusIcon = () => {
    switch (progress.status) {
      case "downloading":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Download className="w-5 h-5 text-blue-500" />
          </motion.div>
        );
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Download className="w-5 h-5 text-gray-500" />;
    }
  };

  // 获取状态文本
  const getStatusText = () => {
    switch (progress.status) {
      case "downloading":
        return `正在下载... ${progress.current}/${progress.total}`;
      case "completed":
        return "下载完成！";
      case "error":
        return progress.error || "下载失败";
      default:
        return "准备下载...";
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    switch (progress.status) {
      case "downloading":
        return "border-blue-500";
      case "completed":
        return "border-green-500";
      case "error":
        return "border-red-500";
      default:
        return "border-gray-300";
    }
  };

  if (!shouldShow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div
            className={`
            bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${getStatusColor()}
            p-4 min-w-[320px] max-w-[400px]
          `}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  下载
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 状态文本 */}
            <div className="mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {getStatusText()}
              </p>
              {progress.message && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {progress.message}
                </p>
              )}
            </div>

            {/* 进度条 */}
            {progress.status === "downloading" && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>进度</span>
                  <span>{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 justify-end">
              {progress.status === "downloading" && onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="text-xs"
                >
                  取消
                </Button>
              )}

              {(progress.status === "completed" ||
                progress.status === "error") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs"
                >
                  关闭
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 简化版本的Hook，用于管理下载进度状态
export function useDownloadProgress() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress>({
    current: 0,
    total: 0,
    status: "idle",
  });

  const startDownload = (total: number, message?: string) => {
    setProgress({
      current: 0,
      total,
      status: "downloading",
      message,
    });
    setIsVisible(true);
  };

  const updateProgress = (current: number, message?: string) => {
    setProgress((prev) => ({
      ...prev,
      current,
      message: message || prev.message,
    }));
  };

  const completeDownload = (message?: string) => {
    setProgress((prev) => ({
      ...prev,
      status: "completed",
      message: message || "下载完成！",
    }));

    // 3秒后自动隐藏
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  const errorDownload = (error: string) => {
    setProgress((prev) => ({
      ...prev,
      status: "error",
      error,
    }));
  };

  const hideToast = () => {
    setIsVisible(false);
  };

  const resetProgress = () => {
    setProgress({
      current: 0,
      total: 0,
      status: "idle",
    });
    setIsVisible(false);
  };

  return {
    isVisible,
    progress,
    startDownload,
    updateProgress,
    completeDownload,
    errorDownload,
    hideToast,
    resetProgress,
  };
}
