import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin配置 - 延迟初始化
let app: App | null = null;

function initializeFirebaseAdmin(): App {
  // 仅在运行时初始化Firebase（而非构建时）
  if (typeof window === 'undefined' && !app) {
    if (getApps().length === 0) {
      // 在生产环境中，使用服务账号密钥
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId: 'perceptive-map-465407-s9',
          storageBucket: 'perceptive-map-465407-s9.firebasestorage.app',
        });
      } else {
        // 在开发环境中，使用默认凭据
        app = initializeApp({
          projectId: 'perceptive-map-465407-s9',
          storageBucket: 'perceptive-map-465407-s9.firebasestorage.app',
        });
      }
    } else {
      app = getApps()[0];
    }
  }
  
  if (!app) {
    throw new Error('Firebase Admin not initialized - this should only be called on server side');
  }
  
  return app;
}

// 导出延迟初始化的服务实例
export function getAdminDb() {
  return getFirestore(initializeFirebaseAdmin());
}

export function getAdminStorage() {
  return getStorage(initializeFirebaseAdmin());
}

// 保持向后兼容性的导出
export const adminDb = new Proxy({} as any, {
  get(target, prop) {
    return getAdminDb()[prop as keyof ReturnType<typeof getFirestore>];
  }
});

export const adminStorage = new Proxy({} as any, {
  get(target, prop) {
    return getAdminStorage()[prop as keyof ReturnType<typeof getStorage>];
  }
});

export default function getApp() {
  return initializeFirebaseAdmin();
}