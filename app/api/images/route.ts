import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { ImageData } from '@/types';

// GET - 获取所有图片
export async function GET() {
  try {
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

// POST - 添加新图片
export async function POST(request: NextRequest) {
  try {
    const imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'> = await request.json();
    
    const result = await Database.addImage(imageData);
    
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('添加图片失败:', error);
    return NextResponse.json(
      { success: false, error: '添加图片失败' },
      { status: 500 }
    );
  }
}