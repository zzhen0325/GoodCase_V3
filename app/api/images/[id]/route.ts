import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// PUT - 更新图片信息
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();

    console.log('🔄 开始更新图片:', { id, updates });

    // 获取数据库连接
    const db = getAdminDb();
    if (!db) {
      console.error('❌ 数据库连接失败');
      return NextResponse.json(
        { success: false, error: 'DATABASE_CONNECTION_FAILED' },
        { status: 500 }
      );
    }

    // 验证图片是否存在
    const imageRef = db.collection('images').doc(id);
    const imageDoc = await imageRef.get();
    
    if (!imageDoc.exists) {
      console.error('❌ 图片不存在:', id);
      return NextResponse.json(
        { success: false, error: 'IMAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 准备更新数据
    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    };

    // 如果有title字段，同时更新name字段以保持兼容性
    if (updates.title) {
      updateData.name = updates.title;
    }

    // 更新图片信息
    await imageRef.update(updateData);

    // 获取更新后的图片数据
    const updatedDoc = await imageRef.get();
    const updatedImage = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    };

    console.log('✅ 图片更新成功:', { id, updatedImage });

    return NextResponse.json({
      success: true,
      data: updatedImage,
    });
  } catch (error) {
    console.error('❌ 图片更新失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除图片
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('🗑️ 开始删除图片:', id);

    // 获取数据库连接
    const db = getAdminDb();
    if (!db) {
      console.error('❌ 数据库连接失败');
      return NextResponse.json(
        { success: false, error: 'DATABASE_CONNECTION_FAILED' },
        { status: 500 }
      );
    }

    // 验证图片是否存在
    const imageRef = db.collection('images').doc(id);
    const imageDoc = await imageRef.get();
    
    if (!imageDoc.exists) {
      console.error('❌ 图片不存在:', id);
      return NextResponse.json(
        { success: false, error: 'IMAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 删除图片记录
    await imageRef.delete();

    console.log('✅ 图片删除成功:', id);

    return NextResponse.json({
      success: true,
      message: '图片删除成功',
    });
  } catch (error) {
    console.error('❌ 图片删除失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'DELETE_FAILED',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// GET - 获取单个图片信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('📖 获取图片信息:', id);

    // 获取数据库连接
    const db = getAdminDb();
    if (!db) {
      console.error('❌ 数据库连接失败');
      return NextResponse.json(
        { success: false, error: 'DATABASE_CONNECTION_FAILED' },
        { status: 500 }
      );
    }

    // 获取图片信息
    const imageRef = db.collection('images').doc(id);
    const imageDoc = await imageRef.get();
    
    if (!imageDoc.exists) {
      console.error('❌ 图片不存在:', id);
      return NextResponse.json(
        { success: false, error: 'IMAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const imageData = {
      id: imageDoc.id,
      ...imageDoc.data(),
    };

    console.log('✅ 获取图片信息成功:', id);

    return NextResponse.json({
      success: true,
      data: imageData,
    });
  } catch (error) {
    console.error('❌ 获取图片信息失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'GET_FAILED',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}