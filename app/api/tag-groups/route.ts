import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';

// 获取所有标签分组 - 从图片数据中动态提取
export async function GET() {
  try {
    const database = Database.getInstance();
    
    // 使用Promise包装实时监听，获取一次性数据
    const tagGroups = await new Promise((resolve, reject) => {
      const unsubscribe = database.subscribeToTagGroups(
        (tagGroups) => {
          unsubscribe(); // 立即取消订阅
          resolve(tagGroups);
        },
        (error) => {
          unsubscribe();
          reject(error);
        }
      );
    });
    
    return NextResponse.json({ tagGroups });
  } catch (error) {
    console.error('获取标签分组失败:', error);
    return NextResponse.json(
      { error: '获取标签分组失败' },
      { status: 500 }
    );
  }
}

// 标签分组的创建、更新、删除现在通过图片中的标签管理
// 不再需要独立的分组CRUD操作
export async function POST() {
  return NextResponse.json(
    { error: '请通过图片标签管理分组' },
    { status: 400 }
  );
}
