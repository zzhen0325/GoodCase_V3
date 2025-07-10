import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { ImageData } from '@/types';

// GET - 获取所有图片
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tagNames = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    
    // 如果有搜索条件，使用搜索方法
    if (search || tagNames.length > 0) {
      const tags = tagNames.map(name => ({ name, id: name, color: '', usageCount: 0 }));
      const result = await Database.searchImages(search, tags);
      
      if (result.success) {
        return NextResponse.json({ success: true, data: result.data });
      } else {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
    }
    
    // 否则获取所有图片
    const result = await Database.getAllImages();
    
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('获取图片失败:', error);
    return NextResponse.json(
      { success: false, error: '获取图片失败' },
      { status: 500 }
    );
  }
}

import { ImageStorageService } from '@/lib/image-storage';

// POST - 添加新图片
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prompt = formData.get('prompt') as string;
    const tags = formData.get('tags') as string || '';

    if (!file) {
      return NextResponse.json({ success: false, error: '请选择图片文件' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ success: false, error: '请输入提示词' }, { status: 400 });
    }

    // 1. 上传图片到 Firebase Storage
    const imageUrl = await ImageStorageService.uploadImage(file, 'images');

    // 2. 准备要存入 Firestore 的数据
    const imageData = {
      title: prompt, // 使用提示词作为标题
      url: imageUrl, // 图片下载URL
      prompts: [prompt], // 提示词数组
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [], // 标签数组
    };

    // 3. 调用 Database 方法存入 Firestore
    const imageDataWithTagObjects = {
      ...imageData,
      tags: imageData.tags.map(tag => ({ id: tag, name: tag, color: '#3b82f6' }))
    };
    const result = await Database.addImage(imageDataWithTagObjects);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data }, { status: 201 });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('添加图片失败:', error);
    return NextResponse.json({ success: false, error: '添加图片失败' }, { status: 500 });
  }
}