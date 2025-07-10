import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin配置
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// 初始化Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(firebaseAdminConfig),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

// 获取Firestore实例
export const db = getFirestore();

// Firestore集合名称
export const COLLECTIONS = {
  IMAGES: 'images',
  TAGS: 'tags',
} as const;

// 验证 Firestore 连接
export async function validateFirestoreConnection() {
  try {
    console.log('尝试连接到 Firestore，项目ID:', process.env.FIREBASE_PROJECT_ID);
    
    // 尝试读取一个不存在的文档来测试连接
    const testDoc = await db.collection('_test').doc('_connection').get();
    console.log('Firestore 连接测试成功');
    return { success: true };
  } catch (error) {
    console.error('Firestore 连接错误详情:', error);
    
    if (error instanceof Error) {
      // 检查是否为 Datastore 模式错误
      if (error.message.includes('Datastore Mode') || error.message.includes('not available for Firestore in Datastore Mode')) {
        return {
          success: false,
          error: 'Firebase 项目配置为 Datastore 模式，请切换为 Firestore 原生模式',
          details: error.message
        };
      }
      
      // 检查是否为 API 未启用错误
      if (error.message.includes('Cloud Firestore API has not been used') || error.message.includes('API not enabled')) {
        return {
          success: false,
          error: 'Cloud Firestore API 未启用',
          details: '请在 Google Cloud Console 中启用 Cloud Firestore API'
        };
      }
      
      // 检查是否为项目不存在错误
      if (error.message.includes('NOT_FOUND') || error.message.includes('Project not found')) {
        return {
          success: false,
          error: '项目未找到或配置错误',
          details: `项目ID: ${process.env.FIREBASE_PROJECT_ID}, 错误: ${error.message}`
        };
      }
    }
    
    return {
      success: false,
      error: 'Firestore 连接失败',
      details: error instanceof Error ? error.message : '未知错误'
    };
  }
}