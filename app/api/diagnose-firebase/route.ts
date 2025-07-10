import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('开始 Firebase 诊断...');
    
    // 检查环境变量
    const envCheck = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
      projectIdValue: process.env.FIREBASE_PROJECT_ID
    };
    
    console.log('环境变量检查:', envCheck);
    
    if (!process.env.FIREBASE_PROJECT_ID) {
      return NextResponse.json({
        success: false,
        error: 'FIREBASE_PROJECT_ID 未设置',
        envCheck
      });
    }
    
    // 尝试简单的 Firebase Admin 初始化
    try {
      const { initializeApp, getApps, cert } = await import('firebase-admin/app');
      const { getFirestore } = await import('firebase-admin/firestore');
      
      console.log('Firebase Admin 模块加载成功');
      
      // 检查是否已初始化
      const existingApps = getApps();
      console.log('现有 Firebase 应用数量:', existingApps.length);
      
      let app;
      if (existingApps.length === 0) {
        console.log('初始化新的 Firebase 应用...');
        app = initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
      } else {
        app = existingApps[0];
        console.log('使用现有 Firebase 应用');
      }
      
      console.log('获取 Firestore 实例...');
      const db = getFirestore(app);
      
      console.log('尝试简单的 Firestore 操作...');
      
      // 尝试最简单的操作
      const testCollection = db.collection('_diagnostic_test');
      console.log('创建测试集合引用成功');
      
      // 尝试获取集合（这会触发实际的网络请求）
      const snapshot = await testCollection.limit(1).get();
      console.log('Firestore 查询成功，文档数量:', snapshot.size);
      
      return NextResponse.json({
        success: true,
        message: 'Firebase 连接成功',
        envCheck,
        documentCount: snapshot.size
      });
      
    } catch (firebaseError: any) {
      console.error('Firebase 操作错误:', firebaseError);
      
      let errorAnalysis = {
        code: firebaseError.code,
        message: firebaseError.message,
        type: 'unknown'
      };
      
      if (firebaseError.message) {
        if (firebaseError.message.includes('Cloud Firestore API has not been used')) {
          errorAnalysis.type = 'api_not_enabled';
        } else if (firebaseError.message.includes('Datastore Mode')) {
          errorAnalysis.type = 'datastore_mode';
        } else if (firebaseError.message.includes('NOT_FOUND') || firebaseError.code === 5) {
          errorAnalysis.type = 'project_not_found';
        } else if (firebaseError.message.includes('PERMISSION_DENIED')) {
          errorAnalysis.type = 'permission_denied';
        }
      }
      
      return NextResponse.json({
        success: false,
        error: 'Firebase 操作失败',
        errorAnalysis,
        envCheck,
        fullError: firebaseError.toString()
      });
    }
    
  } catch (error: any) {
    console.error('诊断过程中发生错误:', error);
    return NextResponse.json({
      success: false,
      error: '诊断失败',
      details: error.message
    });
  }
}