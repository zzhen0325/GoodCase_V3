import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

// 获取所有标签分组
export async function GET() {
  try {
    // 标签分组功能已简化，不再需要独立管理
    return NextResponse.json(
      {
        success: false,
        error: '标签分组功能已简化，标签现在从图片数据中自动提取',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('获取标签分组失败:', error);
    return NextResponse.json(
      { success: false, error: '获取标签分组失败' },
      { status: 500 }
    );
  }
}

// 创建标签分组
export async function POST(request: NextRequest) {
  try {
    // 标签分组功能已简化，不再支持独立创建
    return NextResponse.json(
      {
        success: false,
        error: '标签分组功能已简化，标签现在从图片数据中自动管理',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('创建标签分组失败:', error);
    return NextResponse.json(
      { success: false, error: '创建标签分组失败' },
      { status: 500 }
    );
  }
}
