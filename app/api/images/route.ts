import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { ImageData } from '@/types';
import { z } from 'zod';

// Zod schema for validating image data
const TagSchema = z.object({
  id: z.string().min(1, 'Tag ID cannot be empty'),
  name: z.string().min(1, 'Tag name cannot be empty').trim(),
  color: z.string().min(1, 'Tag color cannot be empty'),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional()
});

const PromptSchema = z.object({
  id: z.string().min(1, 'Prompt ID cannot be empty'),
  text: z.string().min(1, 'Prompt text cannot be empty').trim(),
  color: z.string().min(1, 'Prompt color cannot be empty'),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional()
});

const ImageDataSchema = z.object({
  title: z.string().trim().default(''),
  url: z.string().min(1, 'Image URL cannot be empty'),
  prompts: z.array(PromptSchema).default([]),
  tags: z.array(TagSchema).default([]),
  createdAt: z.number().positive('Created timestamp must be positive'),
  updatedAt: z.number().positive('Updated timestamp must be positive')
}).refine(
  (data) => data.title.length > 0 || data.url.length > 0,
  {
    message: 'Either title or URL must be provided',
    path: ['title']
  }
);

// GET - 获取所有图片
export async function GET() {
  try {
    const result = await Database.getAllImages();
    
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('获取图片失败:', error);
    
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
      { success: false, error: '获取图片失败' },
      { status: 500 }
    );
  }
}

// POST - 添加新图片
export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json();
    
    // 使用 Zod 验证和规范化数据
    const validationResult = ImageDataSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return NextResponse.json({
        success: false,
        message: '数据验证失败',
        errors: errors
      }, { status: 400 });
    }
    
    // 从验证结果中提取数据，排除id字段（由数据库生成）
    const { title, url, prompts, tags, createdAt, updatedAt } = validationResult.data;
    const imageData = { title, url, prompts, tags, createdAt, updatedAt };
    
    const result = await Database.addImage(imageData);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '图片添加成功',
        data: result.data
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error || '添加图片失败'
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('添加图片时出错:', error);
    
    // 检查是否是 Datastore Mode 错误
    if (error.message && error.message.includes('Datastore Mode')) {
      return NextResponse.json({
        success: false,
        message: 'Firebase 配置错误：请确保 Firestore 数据库设置为 Native Mode，而不是 Datastore Mode。请查看 FIREBASE_SETUP.md 获取详细说明。',
        details: 'Firestore database must be in Native Mode'
      }, { status: 500 });
    }
    
    // 检查是否是权限错误 (code: 7)
    if (error.code === 7 || (error.message && error.message.includes('PERMISSION_DENIED'))) {
      return NextResponse.json({
        success: false,
        message: 'Firebase 权限错误：请检查服务账户权限和 Firestore 安全规则。',
        details: 'Permission denied - check service account permissions and Firestore security rules'
      }, { status: 403 });
    }
    
    // 检查是否是配置错误 (code: 5)
    if (error.code === 5 || (error.message && error.message.includes('NOT_FOUND'))) {
      return NextResponse.json({
        success: false,
        message: 'Firebase 配置错误：请检查项目 ID、数据库设置和服务账户配置。',
        details: 'Configuration error - check project ID, database setup, and service account'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      message: '服务器内部错误',
      details: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}