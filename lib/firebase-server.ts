import {
  initializeApp,
  getApps,
  cert,
  ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { Timestamp } from "firebase-admin/firestore";

// Firebase Admin SDK 配置
function getServiceAccount(): ServiceAccount {
  // 使用分离的环境变量
  return {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")!,
  };
}

// 延迟初始化 Firebase Admin（避免构建时初始化）
let adminApp: any = null;

function initializeFirebaseAdmin() {
  // 仅在运行时初始化Firebase（而非构建时）
  if (typeof window === "undefined" && !adminApp) {
    if (!getApps().length) {
      const serviceAccount = getServiceAccount();
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } else {
      adminApp = getApps()[0];
    }
  }
  return adminApp;
}

// 获取服务端 Firebase 实例
export async function getServerFirebase() {
  const app = initializeFirebaseAdmin();
  if (!app) {
    throw new Error(
      "Firebase Admin not initialized - this function should only be called on server side",
    );
  }
  const db = getFirestore(app);
  const storage = getStorage(app);

  return {
    db,
    storage,
    Timestamp,
    app: adminApp,
  };
}

// Firebase Manager 类 - 用于客户端和服务端统一接口
export class FirebaseManager {
  private static instance: FirebaseManager;
  private clientStorage: any = null;
  private clientDb: any = null;

  private constructor() {}

  static getInstance(): FirebaseManager {
    if (!FirebaseManager.instance) {
      FirebaseManager.instance = new FirebaseManager();
    }
    return FirebaseManager.instance;
  }

  // 设置客户端存储实例（从客户端 firebase.ts 调用）
  setClientStorage(storage: any) {
    this.clientStorage = storage;
  }

  // 设置客户端数据库实例（从客户端 firebase.ts 调用）
  setClientDb(db: any) {
    this.clientDb = db;
  }

  // 获取存储实例（客户端使用）
  async getStorage() {
    if (typeof window !== "undefined") {
      // 客户端环境
      if (!this.clientStorage) {
        throw new Error("客户端存储未初始化");
      }
      return this.clientStorage;
    } else {
      // 服务端环境
      const { storage } = await getServerFirebase();
      return storage;
    }
  }

  // 获取数据库实例（客户端使用）
  async getDb() {
    if (typeof window !== "undefined") {
      // 客户端环境
      if (!this.clientDb) {
        throw new Error("客户端数据库未初始化");
      }
      return this.clientDb;
    } else {
      // 服务端环境
      const { db } = await getServerFirebase();
      return db;
    }
  }
}

// 导出单例实例
export const firebaseManager = FirebaseManager.getInstance();

export default firebaseManager;
