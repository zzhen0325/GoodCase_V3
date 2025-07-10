import { NextResponse } from 'next/server';
import { validateFirestoreConnection } from '@/lib/firebase';

export async function GET() {
  try {
    const result = await validateFirestoreConnection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Firebase 连接正常',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          details: result.details,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Firebase 测试失败',
        details: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}