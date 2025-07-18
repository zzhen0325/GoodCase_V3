import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { Tag } from '@/types';

// 获取所有标签
export async function GET(request: NextRequest) {
  try {
    // 标签现在从图片数据中自动提取，返回警告信息
    return NextResponse.json(
      {
        success: false,
        error: '标签现在从图片数据中自动提取，请使用实时监听获取标签数据',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { success: false, error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// 创建标签
export async function POST(request: NextRequest) {
  try {
    // 标签现在从图片数据中自动管理，不支持独立创建
    return NextResponse.json(
      {
        success: false,
        error: '标签现在从图片数据中自动管理，请通过编辑图片来添加标签',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('创建标签失败:', error);
    return NextResponse.json(
      { success: false, error: '创建标签失败' },
      { status: 500 }
    );
  }
}
