import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { generateId } from '@/lib/utils';

// Firebase配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCIQbFi0ogL2uAyRmAqeKn7iNGpun3AFfY',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'perceptive-map-465407-s9.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'perceptive-map-465407-s9',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'perceptive-map-465407-s9.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '383688111435',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:383688111435:web:948c86bc46b430222224ce',
};

// 初始化 Firebase
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export async function POST(request: NextRequest) {
  try {
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: '缺少图片ID' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    
    // 获取原图片数据
    const originalImageDoc = await getDoc(doc(db, 'images', imageId));
    
    if (!originalImageDoc.exists()) {
      return NextResponse.json(
        { error: '原图片不存在' },
        { status: 404 }
      );
    }

    const originalData = originalImageDoc.data();
    
    // 创建复制的图片数据
    const duplicateData = {
      ...originalData,
      id: generateId(),
      title: `${originalData.title || '未命名'} (副本)`,
      name: `${originalData.name || '未命名'} (副本)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // 保持相同的图片URL和其他属性
      url: originalData.url,
      width: originalData.width || 0,
      height: originalData.height || 0,
      fileSize: originalData.fileSize || 0,
      format: originalData.format || 'png',
      tags: originalData.tags || [],
      promptBlocks: originalData.promptBlocks || [],
    };

    // 添加到数据库
    const docRef = await addDoc(collection(db, 'images'), duplicateData);
    
    // 获取完整的新图片数据
    const newImageDoc = await getDoc(docRef);
    const newImageData = {
      id: docRef.id,
      ...newImageDoc.data(),
    };

    return NextResponse.json({
      success: true,
      data: newImageData,
      message: '图片复制成功'
    });

  } catch (error) {
    console.error('复制图片失败:', error);
    return NextResponse.json(
      { error: '复制图片失败，请重试' },
      { status: 500 }
    );
  }
}