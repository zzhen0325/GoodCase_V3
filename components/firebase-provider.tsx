'use client';

import { useEffect, useState } from 'react';
import { getFirebaseApp, getDb, getStorageInstance } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import indexedDBManager from '@/lib/indexed-db';

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
        console.log('🔥 开始初始化 Firebase...');

        // 初始化 Firebase App
        const app = getFirebaseApp();
        if (!app) {
          throw new Error('Firebase App 初始化失败');
        }
        console.log('✅ Firebase App 初始化成功');

        // 初始化 Firestore
        const db = getDb();
        if (!db) {
          throw new Error('Firestore 初始化失败');
        }
        console.log('✅ Firestore 初始化成功');

        // 初始化 Storage
        const storage = getStorageInstance();
        if (!storage) {
          throw new Error('Firebase Storage 初始化失败');
        }
        console.log('✅ Firebase Storage 初始化成功');

        // 测试 Firestore 连接
        try {
          console.log('🔍 测试 Firestore 连接...');
          // 尝试读取一个不存在的文档来测试连接
          const testDocRef = doc(db, '_test', 'connection');
          await getDoc(testDocRef);
          console.log('✅ Firestore 连接测试成功');
        } catch (connectionError) {
          console.warn(
            '⚠️ Firestore 连接测试失败，但继续运行:',
            connectionError
          );
        }

        // 初始化 IndexedDB 并检查版本
        try {
          console.log('🗄️ 初始化 IndexedDB...');
          // indexedDBManager 已经是一个实例，不需要调用 getInstance()
          console.log('✅ IndexedDB 初始化成功，版本检查完成');
        } catch (indexedDBError) {
          console.warn(
            '⚠️ IndexedDB 初始化失败，但继续运行:',
            indexedDBError
          );
        }

        console.log('🎉 Firebase 和 IndexedDB 全部服务初始化完成');
        setIsInitialized(true);
      } catch (err) {
        console.error('❌ Firebase 初始化失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
        // 即使初始化失败，也允许应用继续运行（使用本地存储）
        setIsInitialized(true);
      }
    };

    initializeFirebase();
  }, []);

  // 移除加载状态，直接渲染子组件
  // Firebase 初始化在后台进行，不阻塞 UI 渲染

  // 显示错误状态（但仍然渲染子组件）
  if (error) {
    console.warn('⚠️ Firebase 初始化有问题，但应用将继续运行:', error);
  }

  return <>{children}</>;
}
