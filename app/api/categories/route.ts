import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';

// 获取所有标签分组（分类）
export async function GET() {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }
    
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const tagGroups = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt,
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt,
      };
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

// 创建标签分组（分类）
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: '分组名称不能为空' },
        { status: 400 }
      );
    }
    
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }
    
    // 获取当前最大order值
    const q = query(collection(db, 'categories'), orderBy('order', 'desc'));
    const querySnapshot = await getDocs(q);
    const maxOrder = querySnapshot.docs.length > 0 ? 
      (querySnapshot.docs[0].data().order || 0) : 0;
    
    // 随机选择一个颜色主题
    const colorThemes = ['pink', 'cyan', 'yellow', 'green', 'purple'];
    const randomColor = colorThemes[Math.floor(Math.random() * colorThemes.length)];
    
    const newGroup = {
      name,
      color: randomColor,
      order: maxOrder + 1,
      tagCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'categories'), newGroup);
    
    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      ...newGroup,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('创建标签分组失败:', error);
    return NextResponse.json(
      { error: '创建标签分组失败' },
      { status: 500 }
    );
  }
}
