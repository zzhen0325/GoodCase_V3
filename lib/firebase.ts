import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, initializeFirestore, enableNetwork, disableNetwork, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCIQbFi0ogL2uAyRmAqeKn7iNGpun3AFfY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "perceptive-map-465407-s9.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://perceptive-map-465407-s9-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "perceptive-map-465407-s9",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "perceptive-map-465407-s9.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "383688111435",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:383688111435:web:948c86bc46b430222224ce",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-90M1DVZKQT"
};

// 初始化Firebase应用
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 初始化 Firestore 时设置优化选项
let db: Firestore;
try {
  db = initializeFirestore(app, {
    // 启用离线持久化
    localCache: {
      kind: 'persistent',
    },
    // 强制使用长轮询，解决连接超时问题
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  });
} catch (error) {
  // 如果已经初始化过，使用现有实例
  db = getFirestore(app);
}

// 网络状态管理
let isOnline = navigator?.onLine ?? true;
let networkRetryCount = 0;
const MAX_RETRY_COUNT = 3;

// 监听网络状态变化
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('🌐 网络已连接，启用 Firestore');
    isOnline = true;
    networkRetryCount = 0;
    try {
      await enableNetwork(db);
    } catch (error) {
      console.warn('启用网络失败:', error);
    }
  });

  window.addEventListener('offline', async () => {
    console.log('📴 网络已断开，禁用 Firestore');
    isOnline = false;
    try {
      await disableNetwork(db);
    } catch (error) {
      console.warn('禁用网络失败:', error);
    }
  });
}

// 连接重试机制
export async function retryConnection() {
  if (networkRetryCount >= MAX_RETRY_COUNT) {
    console.warn('已达到最大重试次数，停止重试');
    return false;
  }

  networkRetryCount++;
  console.log(`🔄 尝试重新连接 Firebase (${networkRetryCount}/${MAX_RETRY_COUNT})`);

  try {
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
    await enableNetwork(db);
    console.log('✅ Firebase 重新连接成功');
    networkRetryCount = 0;
    return true;
  } catch (error) {
    console.error('❌ Firebase 重新连接失败:', error);
    return false;
  }
}

// 检查连接状态
export function getConnectionStatus() {
  return {
    isOnline,
    retryCount: networkRetryCount,
    canRetry: networkRetryCount < MAX_RETRY_COUNT
  };
}

// 初始化其他服务
export const storage = getStorage(app);
export const auth = getAuth(app);
export { db };

// 开发环境下连接模拟器（推荐用于解决连接问题）
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // 检查是否启用模拟器
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  
  if (useEmulator) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('🔧 已连接到 Firebase 模拟器');
    } catch (error) {
      console.log('模拟器连接失败，使用生产环境');
    }
  }
}

export default app;
