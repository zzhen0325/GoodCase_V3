import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdmin } from '@/lib/database-admin';
import { ImageDocument } from '@/types';

// GET - 获取所有图片
export async function GET(request: NextRequest) {
  try {
    // 获取所有图片（搜索功能在前端实现）
    const images = await DatabaseAdmin.getAllImages();
    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('获取图片失败:', error);
    return NextResponse.json(
      { success: false, error: '获取图片失败' },
      { status: 500 }
    );
  }
}

// 处理图片上传的 POST 请求
export async function POST(request: NextRequest) {
  try {
    console.log('📥 收到图片上传请求');
    const data = await request.json();
    console.log('📋 请求数据:', {
      hasImageUrl: !!data.imageUrl,
      filename: data.filename,
      size: data.size,
      type: data.type,
      hasPrompt: !!data.prompt,
    });

    const { imageUrl, filename, size, type, prompt } = data;

    // 验证必需字段
    if (!imageUrl) {
      console.error('❌ 缺少图片URL');
      return NextResponse.json(
        { success: false, error: '缺少图片URL' },
        { status: 400 }
      );
    }

    if (!prompt) {
      console.error('❌ 缺少提示词');
      return NextResponse.json(
        { success: false, error: '缺少提示词' },
        { status: 400 }
      );
    }

    // 保存图片信息到数据库
    console.log('💾 开始保存图片信息到数据库...');
    const result = await DatabaseAdmin.createImage({
      url: imageUrl,
      title: filename || 'unknown',
      prompts: [
        {
          id: '',
          title: prompt,
          content: prompt,
          color: '#3b82f6',
          order: 0,
        },
      ],
      tags: [],
    });

    console.log('✅ 图片信息保存成功，ID:', result);
    return NextResponse.json({
      success: true,
      data: { id: result },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('❌ 添加图片失败:', error);
    console.error(
      '错误堆栈:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '添加图片失败',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
