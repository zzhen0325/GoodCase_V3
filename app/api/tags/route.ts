import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

// GET - 获取所有标签
export async function GET() {
  try {
    const result = await Database.getAllTags();
    
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { success: false, error: '获取标签失败' },
      { status: 500 }
    );
  }
}