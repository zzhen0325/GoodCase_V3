import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin配置
let app: App;

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

// 导出服务实例
export const adminDb = getFirestore(app);
export const adminStorage = getStorage(app);

export default app;