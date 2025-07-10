import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { ImageData } from '@/types';

// GET - 获取所有图片
export async function GET(request: NextRequest) {
  try {
    // 获取所有图片（搜索功能在前端实现）
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
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    
    const imageData = {
      title: prompt, // 使用提示词作为标题
      url: imageUrl, // 图片下载URL
      prompts: [{
        id: Date.now().toString(),
        title: prompt,
        content: prompt,
        color: 'slate',
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }], // 提示词对象数组
      tags: tagArray.map(tag => ({ id: tag, name: tag, color: '#3b82f6' })) // 标签对象数组
    };

    // 3. 调用 Database 方法存入 Firestore
    const result = await Database.addImage(imageData);

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