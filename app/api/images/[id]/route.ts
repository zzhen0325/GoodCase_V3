import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { ImageData } from '@/types';

// PUT - 更新图片
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates: Partial<ImageData> = await request.json();
    
    const result = await Database.updateImage(id, updates);
    
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('更新图片失败:', error);
    return NextResponse.json(
      { success: false, error: '更新图片失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除图片
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const result = await Database.deleteImage(id);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('删除图片失败:', error);
    return NextResponse.json(
      { success: false, error: '删除图片失败' },
      { status: 500 }
    );
  }
}