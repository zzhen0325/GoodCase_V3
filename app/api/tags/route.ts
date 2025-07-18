import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

// 获取所有标签 - 从图片数据中动态提取
export async function GET() {
  try {
    const database = Database.getInstance();
    
    // 使用Promise包装实时监听，获取一次性数据
    const tags = await new Promise((resolve, reject) => {
      const unsubscribe = database.subscribeToTags(
        (tags) => {
          unsubscribe(); // 立即取消订阅
          resolve(tags);
        },
        (error) => {
          unsubscribe();
          reject(error);
        }
      );
    });
    
    return NextResponse.json({ tags });
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// 标签的创建、更新、删除现在通过图片API处理
// 不再需要独立的标签CRUD操作
export async function POST() {
  return NextResponse.json(
    { error: '请通过图片API管理标签' },
    { status: 400 }
  );
}
