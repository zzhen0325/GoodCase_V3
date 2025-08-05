import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { UnifiedImageStorageService } from '@/lib/unified-image-storage';
import { getImageMetadata, getImageMetadataServer } from '@/lib/image-utils';
import { v4 as uuidv4 } from 'uuid';

// POST - 上传图片
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let imageFile: File;
    let beforeFile: File | null = null;
    let afterFile: File | null = null;
    let title: string = '';
    let link: string = '';
    let tagIds: string[] = [];
    let promptBlocks: any[] = [];
    let promptIds: string[] = [];
    let imageType: 'single' | 'comparison' = 'single';
    
    // 检查是FormData还是JSON格式
    if (contentType?.includes('multipart/form-data')) {
      // FormData格式 (来自 page.tsx)
      const formData = await request.formData();
      
      // 获取图片类型
      imageType = (formData.get('imageType') as string || 'single') as 'single' | 'comparison';
      
      if (imageType === 'comparison') {
        beforeFile = formData.get('beforeFile') as File;
        afterFile = formData.get('afterFile') as File;
        imageFile = beforeFile; // 用于后续验证
      } else {
        imageFile = formData.get('file') as File;
      }
      
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
    
    // 验证文件存在
    if (imageType === 'comparison') {
      if (!beforeFile || !afterFile) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'MISSING_FILE',
            message: '请选择Before和After图片文件' 
          },
          { status: 400 }
        );
      }
    } else {
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
    }

    // 验证文件类型和大小的辅助函数
    const validateFile = (file: File, fileName: string) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`${fileName}不支持的文件类型，请上传 JPEG、PNG 或 WebP 格式的图片`);
      }
      
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(`${fileName}文件大小不能超过 10MB`);
      }
    };

    // 验证所有文件
    try {
      if (imageType === 'comparison') {
        validateFile(beforeFile!, 'Before图片');
        validateFile(afterFile!, 'After图片');
      } else {
        validateFile(imageFile, '图片');
      }
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'INVALID_FILE',
          message: error instanceof Error ? error.message : '文件验证失败'
        },
        { status: 400 }
      );
    }

    // 生成图片ID
    const imageId = uuidv4();
    
    // 获取图片元数据和上传文件
    let metadata;
    let imageUrl: string | undefined;
    let beforeImageData: { 
      storagePath: string; 
      url: string; 
      fileSize: number;
      width: number;
      height: number;
      mimeType: string;
      format: string;
    } | undefined;
    let afterImageData: { 
      storagePath: string; 
      url: string; 
      fileSize: number;
      width: number;
      height: number;
      mimeType: string;
      format: string;
    } | undefined;
    
    if (imageType === 'comparison') {
      // 双图模式：分别处理before和after图片
      try {
        console.log('开始处理双图上传');
        
        // 获取before图片元数据
        const beforeBuffer = Buffer.from(await beforeFile!.arrayBuffer());
        const afterBuffer = Buffer.from(await afterFile!.arrayBuffer());
        const beforeMetadata = await getImageMetadataServer(beforeBuffer, beforeFile!.type);
        const afterMetadata = await getImageMetadataServer(afterBuffer, afterFile!.type);
        
        console.log('Before图片元数据:', beforeMetadata);
        console.log('After图片元数据:', afterMetadata);
        
        // 使用after图片的元数据作为主要元数据
        metadata = afterMetadata;
        
        // 如果仍然无法获取尺寸，记录警告
        if (beforeMetadata.width === 0 || beforeMetadata.height === 0) {
          console.warn('Before图片尺寸获取失败，将在后台异步修复');
        }
        if (afterMetadata.width === 0 || afterMetadata.height === 0) {
          console.warn('After图片尺寸获取失败，将在后台异步修复');
        }
        
        // 上传before图片
        const beforeExt = beforeFile!.name.split('.').pop() || 'png';
        const beforeFileName = `${imageId}_before.${beforeExt}`;
        const beforeUrl = await UnifiedImageStorageService.uploadImageServer(
          beforeFile!,
          'images',
          beforeFileName
        );
        
        // 上传after图片
        const afterExt = afterFile!.name.split('.').pop() || 'png';
        const afterFileName = `${imageId}_after.${afterExt}`;
        const afterUrl = await UnifiedImageStorageService.uploadImageServer(
          afterFile!,
          'images',
          afterFileName
        );
        
        beforeImageData = {
          storagePath: `images/${beforeFileName}`,
          url: beforeUrl,
          fileSize: beforeMetadata.size,
          width: beforeMetadata.width,
          height: beforeMetadata.height,
          mimeType: beforeFile!.type,
          format: beforeMetadata.format
        };
        
        afterImageData = {
          storagePath: `images/${afterFileName}`,
          url: afterUrl,
          fileSize: afterMetadata.size,
          width: afterMetadata.width,
          height: afterMetadata.height,
          mimeType: afterFile!.type,
          format: afterMetadata.format
        };
        
        console.log('双图上传成功:', { beforeUrl, afterUrl });
        
      } catch (error) {
        console.error('双图上传失败:', error);
        throw new Error(`双图上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    } else {
      // 单图模式：使用增强的服务器端元数据获取
      try {
        const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
        metadata = await getImageMetadataServer(imageBuffer, imageFile.type);
        console.log('图片元数据获取成功:', metadata);
        
        // 如果仍然无法获取尺寸，记录警告
        if (metadata.width === 0 || metadata.height === 0) {
          console.warn('图片尺寸获取失败，将在后台异步修复');
        }
      } catch (error) {
        console.error('获取图片元数据失败:', error);
        metadata = {
          width: 0,
          height: 0,
          fileSize: imageFile.size,
          format: imageFile.type.split('/')[1] || 'png'
        };
      }

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
    }

    // 处理提示词块：双图类型默认添加"指令"提示词块
    let finalPromptBlocks = promptBlocks || [];
    if (imageType === 'comparison' && finalPromptBlocks.length === 0) {
      finalPromptBlocks = [{
        id: 'default-instruction',
        title: '指令',
        content: '',
        color: 'blue',
        order: 0
      }];
    }

    // 保存到 Firestore
    let docRef;
    const now = new Date();
    
    // 构建图片数据结构
    const baseImageData = {
      id: imageId,
      type: imageType,
      name: title || (imageType === 'comparison' ? 'Before & After Comparison' : imageFile.name),
      description: '',
      link: link || '',
      tags: tagIds || [],
      promptBlocks: finalPromptBlocks,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };
    
    let imageData;
    if (imageType === 'comparison') {
      // 双图数据结构
      imageData = {
        ...baseImageData,
        beforeImage: beforeImageData,
        afterImage: afterImageData,
        size: (beforeFile?.size || 0) + (afterFile?.size || 0),
        mimeType: afterFile?.type || 'image/png',
        width: metadata.width,
        height: metadata.height
      };
    } else {
      // 单图数据结构
      imageData = {
        ...baseImageData,
        url: imageUrl,
        size: imageFile.size,
        mimeType: imageFile.type,
        width: metadata.width,
        height: metadata.height
      };
    }

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