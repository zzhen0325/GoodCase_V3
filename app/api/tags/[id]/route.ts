import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdmin } from '@/lib/database-admin';
import { Tag } from '@/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tagId = params.id;
    if (!tagId) {
      return NextResponse.json(
        { success: false, error: '缺少标签 ID' },
        { status: 400 }
      );
    }

    const updates: Partial<Tag> = await req.json();
    const updatedTag = await DatabaseAdmin.updateTag(tagId, updates);
    
    return NextResponse.json({ 
      success: true, 
      data: updatedTag,
      message: `标签 ${tagId} 已成功更新` 
    });
  } catch (error) {
    console.error('更新标签失败:', error);
    return NextResponse.json(
      { success: false, error: '更新标签失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tagId = params.id;
    if (!tagId) {
      return NextResponse.json(
        { success: false, error: '缺少标签 ID' },
        { status: 400 }
      );
    }
    await DatabaseAdmin.deleteTag(tagId);
    return NextResponse.json({ success: true, message: `标签 ${tagId} 已成功删除` });
  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json(
      { success: false, error: '删除标签失败' },
      { status: 500 }
    );
  }
}