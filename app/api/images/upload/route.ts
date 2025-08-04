import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { UnifiedImageStorageService } from '@/lib/unified-image-storage';
import { getImageMetadata } from '@/lib/image-utils';
import { v4 as uuidv4 } from 'uuid';

// POST - 上传图片
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let imageFile: File;
    let title: string = '';
    let link: string = '';
    let tagIds: string[] = [];
    let promptBlocks: any[] = [];
    let promptIds: string[] = [];
    
    // 检查是FormData还是JSON格式
    if (contentType?.includes('multipart/form-data')) {
      // FormData格式 (来自 page.tsx)
      const formData = await request.formData();
      imageFile = formData.get('file') as File;
      title = formData.get('title') as string || '';
      link = formData.get('link') as string || '';
      
      const tagIdsStr = formData.get('tagIds') as string;
      if (tagIdsStr) {
        tagIds = JSON.parse(tagIdsStr);
      }
      
      const promptBlocksStr = formData.get('promptBlocks') as string;
      if (promptBlocksStr) {
        promptBlocks = JSON.parse(promptBlocksStr);
      }
    } else {
      // JSON格式 (来自 hooks/use-image-operations.ts)
      const body = await request.json();
      const { imageUrl, title: jsonTitle, link: jsonLink, tagIds: jsonTagIds, promptBlocks: jsonPromptBlocks, promptIds: jsonPromptIds, ...metadata } = body;
      
      // 将base64转换为File对象
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      imageFile = new File([blob], jsonTitle || 'image.png', { type: blob.type });
      
      title = jsonTitle || '';
      link = jsonLink || '';
      tagIds = jsonTagIds || [];
      promptBlocks = jsonPromptBlocks || [];
      promptIds = jsonPromptIds || [];
    }
    
    if (!imageFile) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'MISSING_FILE',
          message: '请选择要上传的图片文件' 
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'INVALID_FILE_TYPE',
          message: '不支持的文件类型，请上传 JPEG、PNG 或 WebP 格式的图片' 
        },
        { status: 400 }
      );
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'FILE_TOO_LARGE',
          message: '文件大小不能超过 10MB' 
        },
        { status: 400 }
      );
    }

    // 获取图片元数据
    let metadata;
    try {
      metadata = await getImageMetadata(imageFile);
      console.log('图片元数据获取成功:', metadata);
    } catch (error) {
      console.error('获取图片元数据失败:', error);
      // 使用默认值继续处理
      metadata = {
        width: 0,
        height: 0,
        fileSize: imageFile.size,
        format: imageFile.type.split('/')[1] || 'png'
      };
    }

    // 上传到 Firebase Storage
    let imageUrl;
    try {
      console.log('开始上传图片到 Firebase Storage');
      imageUrl = await UnifiedImageStorageService.uploadImageServer(
        imageFile,
        'images'
      );
      console.log('图片上传成功:', imageUrl);
    } catch (error) {
      console.error('Firebase Storage 上传失败:', error);
      throw new Error(`图片上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    // 保存到 Firestore
    let docRef;
    const imageId = uuidv4();
    const now = new Date();
    const imageData = {
      id: imageId,
      name: title || imageFile.name,
      description: '',
      link: link || '',
      url: imageUrl,
      size: imageFile.size,
      mimeType: imageFile.type,
      width: metadata.width,
      height: metadata.height,
      tags: tagIds || [],
      promptBlocks: promptBlocks || [],
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    try {
      console.log('开始连接数据库');
      const db = getAdminDb();
      if (!db) {
        throw new Error('数据库连接失败');
      }
      console.log('数据库连接成功');

      console.log('准备保存图片数据:', {
        id: imageData.id,
        name: imageData.name,
        size: imageData.size,
        tagsCount: imageData.tags.length,
        promptBlocksCount: imageData.promptBlocks.length
      });

      docRef = await db.collection('images').add(imageData);
      console.log('图片数据保存成功, 文档ID:', docRef.id);
    } catch (error) {
      console.error('数据库操作失败:', error);
      throw new Error(`数据库保存失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    // 返回完整的图片数据，包含所有关联信息
    return NextResponse.json({
      success: true,
      data: imageData,
      message: '图片上传成功'
    });

  } catch (error) {
    const errorObj = error as Error;
    console.error('图片上传失败 - 详细错误信息:', {
      message: errorObj.message,
      stack: errorObj.stack,
      code: (errorObj as any).code,
      name: errorObj.name
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'UPLOAD_FAILED',
        message: '图片上传失败，请稍后重试',
        debug: process.env.NODE_ENV === 'development' ? errorObj.message : undefined
      },
      { status: 500 }
    );
  }
}