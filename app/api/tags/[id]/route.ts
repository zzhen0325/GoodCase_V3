import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdmin } from '@/lib/database-admin';

// 更新标签
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name, color, categoryId } = await request.json();
    const { id } = await params;

    // 只在提供了 name 或 color 时才验证它们不能为空
    if ((name !== undefined && !name) || (color !== undefined && !color)) {
      return NextResponse.json(
        { success: false, error: '标签名称和颜色不能为空' },
        { status: 400 }
      );
    }

    // 如果提供了分组ID，检查分组是否存在
    if (categoryId) {
      const category = await DatabaseAdmin.getCategoryById(categoryId);
      if (!category) {
        return NextResponse.json(
          { success: false, error: '指定的分组不存在' },
          { status: 400 }
        );
      }
    }

    // 构建更新对象，只包含提供的字段
    const updateData: any = {};
    if (name !== undefined && name !== null && name !== '') updateData.name = name;
    if (color !== undefined && color !== null && color !== '') updateData.color = color;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;

    const tag = await DatabaseAdmin.updateTag(id, updateData);
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
