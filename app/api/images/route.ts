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
    const title = formData.get('title') as string;
    const tags = JSON.parse(formData.get('tags') as string || '[]') as { id: string, name: string }[];
    const description = formData.get('description') as string || '';
    const prompt_blocks = JSON.parse(formData.get('prompt_blocks') as string || '[]') as any[];

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // 1. 上传图片到 Firebase Storage
    const imageUrl = await ImageStorageService.uploadImage(file, 'gallery');

    // 2. 准备要存入 Firestore 的数据
    const imageData = {
      image_name: file.name,
      image_path: imageUrl, // 保存的是 Storage 的路径或 URL
      tags: tags.map(t => t.name),
      description: title || description,
      prompt_blocks: prompt_blocks, // 从表单获取
      // is_valid 和时间戳由 database.ts 中的 addImage 方法处理
    };

    // 3. 调用 Database 方法存入 Firestore
    const result = await Database.addImage(imageData as any);

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