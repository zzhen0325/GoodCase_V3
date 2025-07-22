import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';

// 更新标签分组
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { name } = await request.json();
    const { id } = await params;
    
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
    
    const groupRef = doc(db, 'categories', id);
    
    // 检查分组是否存在
    const groupDoc = await getDoc(groupRef);
    if (!groupDoc.exists()) {
      return NextResponse.json(
        { error: '标签分组不存在' },
        { status: 404 }
      );
    }
    
    await updateDoc(groupRef, {
      name,
      updatedAt: serverTimestamp(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新标签分组失败:', error);
    return NextResponse.json(
      { error: '更新标签分组失败' },
      { status: 500 }
    );
  }
}

// 删除标签分组
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }
    
    const groupRef = doc(db, 'categories', id);
    
    // 检查分组是否存在
    const groupDoc = await getDoc(groupRef);
    if (!groupDoc.exists()) {
      return NextResponse.json(
        { error: '标签分组不存在' },
        { status: 404 }
      );
    }
    
    // 检查分组下是否有标签
    const tagsQuery = query(
      collection(db, 'tags'),
      where('categoryId', '==', id)
    );
    const tagsSnapshot = await getDocs(tagsQuery);
    
    if (!tagsSnapshot.empty) {
      return NextResponse.json(
        { error: '该分组下还有标签，请先删除所有标签' },
        { status: 400 }
      );
    }
    
    await deleteDoc(groupRef);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除标签分组失败:', error);
    return NextResponse.json(
      { error: '删除标签分组失败' },
      { status: 500 }
    );
  }
}