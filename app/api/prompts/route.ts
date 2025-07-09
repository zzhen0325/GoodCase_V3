import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

// GET - 获取所有提示词
export async function GET() {
  try {
    const prompts = await Database.getPrompts();
    return NextResponse.json({ success: true, data: prompts });
  } catch (error) {
    console.error('获取提示词失败:', error);
    return NextResponse.json(
      { success: false, error: '获取提示词失败' },
      { status: 500 }
    );
  }
}