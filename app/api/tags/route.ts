import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { Tag } from '@/types';

// GET - 获取所有标签
export async function GET() {
  try {
    const tags = await Database.getTags();
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
    const result = await Database.addTag(tagData);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data }, { status: 201 });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('添加标签失败:', error);
    return NextResponse.json(
      { success: false, error: '添加标签失败' },
      { status: 500 }
    );
  }
}