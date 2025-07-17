"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wifi, WifiOff, RotateCcw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectionStatusProps {
  status: "connected" | "disconnected" | "reconnecting";
  onRefresh?: () => void;
}

export function ConnectionStatus({ status, onRefresh }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-200 dark:border-green-800",
          text: "实时同步",
          description: "数据实时同步中",
        };
      case "disconnected":
        return {
          icon: WifiOff,
          color: "text-red-500",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800",
          text: "连接断开",
          description: "网络连接已断开",
        };
      case "reconnecting":
        return {
          icon: RotateCcw,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800",
          text: "重新连接",
          description: "正在重新连接...",
        };
      default:
        return {
          icon: Wifi,
          color: "text-gray-500",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800",
          text: "未知状态",
          description: "连接状态未知",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // 连接正常时不显示
  if (status === "connected") {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <div
        className={`
        fixed top-4 right-4 z-50 
        ${config.bgColor} ${config.borderColor}
        border rounded-lg p-3 shadow-lg backdrop-blur-sm
        max-w-xs
      `}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={status === "reconnecting" ? { rotate: 360 } : {}}
            transition={{
              duration: 1,
              repeat: status === "reconnecting" ? Infinity : 0,
            }}
          >
            <Icon className={`w-4 h-4 ${config.color}`} />
          </motion.div>

          <div className="flex-1">
            <div className={`text-sm font-medium ${config.color}`}>
              {config.text}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {config.description}
            </div>
          </div>

          {status === "disconnected" && onRefresh && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              className="h-6 px-2 text-xs"
            >
              重试
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// 简化版连接状态指示器
export function SimpleConnectionStatus({
  status,
}: {
  status: "connected" | "disconnected" | "reconnecting";
}) {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return { color: "bg-green-500", text: "已连接" };
      case "disconnected":
        return { color: "bg-red-500", text: "已断开" };
      case "reconnecting":
        return { color: "bg-yellow-500", text: "连接中" };
      default:
        return { color: "bg-gray-500", text: "未知" };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
      <motion.div
        className={`w-2 h-2 rounded-full ${config.color}`}
        animate={status === "reconnecting" ? { scale: [1, 1.2, 1] } : {}}
        transition={{
          duration: 1,
          repeat: status === "reconnecting" ? Infinity : 0,
        }}
      />
      <span>{config.text}</span>
    </div>
  );
}
