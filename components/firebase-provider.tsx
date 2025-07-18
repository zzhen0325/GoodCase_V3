"use client";

import { useEffect, useState } from "react";
import { getFirebaseApp, getDb, getStorageInstance } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface FirebaseProviderProps {
  children: React.ReactNode;
}

/**
 * Firebase 初始化提供者组件
 * 确保 Firebase 在应用启动时正确初始化
 */
export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        console.log("🔥 开始初始化 Firebase...");
        
        // 初始化 Firebase App
        const app = getFirebaseApp();
        if (!app) {
          throw new Error("Firebase App 初始化失败");
        }
        console.log("✅ Firebase App 初始化成功");

        // 初始化 Firestore
        const db = getDb();
        if (!db) {
          throw new Error("Firestore 初始化失败");
        }
        console.log("✅ Firestore 初始化成功");

        // 初始化 Storage
        const storage = getStorageInstance();
        if (!storage) {
          throw new Error("Firebase Storage 初始化失败");
        }
        console.log("✅ Firebase Storage 初始化成功");

        // 测试 Firestore 连接
        try {
          console.log("🔍 测试 Firestore 连接...");
          // 尝试读取一个不存在的文档来测试连接
          const testDocRef = doc(db, "_test", "connection");
          await getDoc(testDocRef);
          console.log("✅ Firestore 连接测试成功");
        } catch (connectionError) {
          console.warn("⚠️ Firestore 连接测试失败，但继续运行:", connectionError);
        }

        console.log("🎉 Firebase 全部服务初始化完成");
        setIsInitialized(true);
      } catch (err) {
        console.error("❌ Firebase 初始化失败:", err);
        setError(err instanceof Error ? err.message : "未知错误");
        // 即使初始化失败，也允许应用继续运行（使用本地存储）
        setIsInitialized(true);
      }
    };

    initializeFirebase();
  }, []);

  // 显示加载状态
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">正在初始化 Firebase...</p>
        </div>
      </div>
    );
  }

  // 显示错误状态（但仍然渲染子组件）
  if (error) {
    console.warn("⚠️ Firebase 初始化有问题，但应用将继续运行:", error);
  }

  return <>{children}</>;
}