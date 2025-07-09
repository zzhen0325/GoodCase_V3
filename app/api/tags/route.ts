import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

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