import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdmin } from '@/lib/database-admin';

// 更新标签分组
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, color } = await request.json();
    const { id } = await params;

    if (!name || !color) {
      return NextResponse.json(
        { success: false, error: '分组名称和颜色不能为空' },
        { status: 400 }
      );
    }

    const tagGroup = await DatabaseAdmin.updateTagGroup(id, { name, color });
    return NextResponse.json({ success: true, data: tagGroup });
  } catch (error) {
    console.error('更新标签分组失败:', error);
    return NextResponse.json(
      { success: false, error: '更新标签分组失败' },
      { status: 500 }
    );
  }
}

// 删除标签分组
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查分组下是否有标签
    const tags = await DatabaseAdmin.getTagsByGroupId(id);
    if (tags.length > 0) {
      return NextResponse.json(
        { success: false, error: '该分组下还有标签，无法删除' },
        { status: 400 }
      );
    }

    await DatabaseAdmin.deleteTagGroup(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除标签分组失败:', error);
    return NextResponse.json(
      { success: false, error: '删除标签分组失败' },
      { status: 500 }
    );
  }
}
