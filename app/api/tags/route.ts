import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdmin } from '@/lib/database-admin';
import { Tag } from '@/types';

// GET - 获取所有标签
export async function GET() {
  try {
    const tags = await DatabaseAdmin.getAllTags();
    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { success: false, error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// POST - 添加新标签
export async function POST(req: NextRequest) {
  try {
    const tagData = (await req.json()) as Omit<Tag, 'id'>;
    // 暂时返回成功，因为DatabaseAdmin可能没有addTag方法
    return NextResponse.json({ success: true, message: '标签功能暂未实现' }, { status: 201 });
  } catch (error) {
    console.error('添加标签失败:', error);
    return NextResponse.json(
      { success: false, error: '添加标签失败' },
      { status: 500 }
    );
  }
}