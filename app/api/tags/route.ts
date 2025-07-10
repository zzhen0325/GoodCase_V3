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
    
    // 检查是否是 Firestore 模式错误
    if (error instanceof Error && error.message.includes('Datastore Mode')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Firebase 项目配置错误：请在 Firebase Console 中将数据库切换为 Firestore 原生模式',
          details: 'The Cloud Firestore API is not available for Firestore in Datastore Mode'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: '获取标签失败' },
      { status: 500 }
    );
  }
}