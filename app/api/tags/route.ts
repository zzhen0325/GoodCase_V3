import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { getDb } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// 获取所有标签 - 从独立的标签表获取
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

// 创建新标签
export async function POST(request: NextRequest) {
  try {
    const { name, color, categoryId } = await request.json();
    
    if (!name || !color) {
      return NextResponse.json(
        { error: '标签名称和颜色为必填项' },
        { status: 400 }
      );
    }
    
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }
    
    // 创建新标签对象
    const newTag = {
      name: name.trim(),
      color,
      categoryId: categoryId || null,
      usageCount: 0,
      order: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // 保存到独立的标签表
    const docRef = await addDoc(collection(db, 'tags'), newTag);
    
    return NextResponse.json({ 
      success: true,
      tag: {
        id: docRef.id,
        ...newTag,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    return NextResponse.json(
      { error: '创建标签失败' },
      { status: 500 }
    );
  }
}
