import { NextRequest, NextResponse } from 'next/server';

// POST - 图片上传接口（客户端处理）
export async function POST(request: NextRequest) {
  try {
    // 这个接口主要用于验证和处理上传后的数据
    // 实际的文件上传在客户端通过Firebase Storage完成

    const { imageUrl, metadata } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: '图片URL不能为空' },
        { status: 400 }
      );
    }

    // 验证URL格式
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: '无效的图片URL' },
        { status: 400 }
      );
    }

    // 验证是否为Firebase Storage URL
    if (!imageUrl.includes('firebasestorage.googleapis.com')) {
      return NextResponse.json(
        { success: false, error: '只允许Firebase Storage的图片URL' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: imageUrl,
        metadata: metadata || {},
      },
    });
  } catch (error) {
    console.error('处理上传失败:', error);
    return NextResponse.json(
      { success: false, error: '处理上传失败' },
      { status: 500 }
    );
  }
}
