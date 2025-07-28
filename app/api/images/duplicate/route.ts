import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json(
        { error: '缺少图片ID' },
        { status: 400 }
      );
    }

    // 获取数据库连接
    const db = getAdminDb();
    if (!db) {
      console.error('❌ 数据库连接失败');
      return NextResponse.json(
        { success: false, error: 'DATABASE_CONNECTION_FAILED' },
        { status: 500 }
      );
    }
    
    // 获取原图片数据
    const originalImageRef = db.collection('images').doc(imageId);
    const originalImageDoc = await originalImageRef.get();
    
    if (!originalImageDoc.exists) {
      return NextResponse.json(
        { error: '原图片不存在' },
        { status: 404 }
      );
    }

    const originalData = originalImageDoc.data();
    
    if (!originalData) {
      return NextResponse.json(
        { error: '无法获取原图片数据' },
        { status: 500 }
      );
    }
    
    // 创建复制的图片数据（不包含id字段，让Firestore自动生成）
    const { id: originalId, ...dataWithoutId } = originalData as any;
    const duplicateData = {
      ...dataWithoutId,
      title: `${originalData.title || '未命名'} (副本)`,
      name: `${originalData.name || '未命名'} (副本)`,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    const docRef = await db.collection('images').add(duplicateData);
    
    // 获取完整的新图片数据
    const newImageDoc = await docRef.get();
    const newImageData = {
      id: docRef.id,
      ...newImageDoc.data(),
    };

    console.log('✅ 图片复制成功:', { originalId: imageId, newId: docRef.id });

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