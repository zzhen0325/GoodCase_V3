import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdmin } from '@/lib/database-admin';

// 更新标签
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, color, groupId } = await request.json();
    const { id } = await params;

    if (!name || !color || !groupId) {
      return NextResponse.json(
        { success: false, error: '标签名称、颜色和分组ID不能为空' },
        { status: 400 }
      );
    }

    // 检查分组是否存在
    const tagGroup = await DatabaseAdmin.getTagGroupById(groupId);
    if (!tagGroup) {
      return NextResponse.json(
        { success: false, error: '指定的分组不存在' },
        { status: 400 }
      );
    }

    const tag = await DatabaseAdmin.updateTag(id, { name, color, groupId });
    return NextResponse.json({ success: true, data: tag });
  } catch (error) {
    console.error('更新标签失败:', error);
    return NextResponse.json(
      { success: false, error: '更新标签失败' },
      { status: 500 }
    );
  }
}

// 删除标签
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 删除标签前，需要从所有使用该标签的图片中移除
    await DatabaseAdmin.removeTagFromAllImages(id);
    await DatabaseAdmin.deleteTag(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json(
      { success: false, error: '删除标签失败' },
      { status: 500 }
    );
  }
}
