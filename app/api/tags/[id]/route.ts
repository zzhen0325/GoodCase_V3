import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdmin } from '@/lib/database-admin';

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