import {
  initializeApp,
  getApps,
  cert,
  App,
  ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// Firebase Admin配置 - 延迟初始化
let app: App | null = null;

function initializeFirebaseAdmin(): App {
  // 确保只在服务器端运行
  if (typeof window !== "undefined") {
    throw new Error("Firebase Admin 不能在客户端使用");
  }
  
  // 仅在运行时初始化Firebase（而非构建时）
  if (!app) {
    if (getApps().length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
          );
          app = initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          });
          console.log("✅ Firebase Admin 使用 SERVICE_ACCOUNT_KEY 初始化成功");
        } catch (error) {
          console.error("❌ Firebase Admin SERVICE_ACCOUNT_KEY 解析失败:", error);
          throw new Error("Firebase Admin SERVICE_ACCOUNT_KEY 格式错误");
        }
      } else if (
        process.env.FIREBASE_PRIVATE_KEY &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PROJECT_ID
      ) {
        // 使用分离的环境变量
        const serviceAccount: ServiceAccount = {
          projectId: process.env.FIREBASE_PROJECT_ID!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        };
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        console.log("✅ Firebase Admin 使用分离环境变量初始化成功");
      } else {
        // 在开发环境中，使用默认凭据
        console.warn("⚠️ Firebase Admin 使用默认配置（无认证）");
        app = initializeApp({
          projectId: "perceptive-map-465407-s9",
          storageBucket: "perceptive-map-465407-s9.firebasestorage.app",
        });
      }
    } else {
      app = getApps()[0];
    }
  }

  if (!app) {
    throw new Error(
      "Firebase Admin not initialized - this should only be called on server side",
    );
  }

  return app;
}

// 导出延迟初始化的服务实例
export function getAdminDb() {
  if (typeof window !== "undefined") {
    throw new Error("getAdminDb 不能在客户端使用");
  }
  return getFirestore(initializeFirebaseAdmin());
}

export function getAdminStorage() {
  if (typeof window !== "undefined") {
    throw new Error("getAdminStorage 不能在客户端使用");
  }
  return getStorage(initializeFirebaseAdmin());
}

// 保持向后兼容性的导出
export const adminDb = new Proxy({} as any, {
  get(target, prop) {
    return getAdminDb()[prop as keyof ReturnType<typeof getFirestore>];
  },
});

export const adminStorage = new Proxy({} as any, {
  get(target, prop) {
    return getAdminStorage()[prop as keyof ReturnType<typeof getStorage>];
  },
});

export default function getApp() {
  return initializeFirebaseAdmin();
}
