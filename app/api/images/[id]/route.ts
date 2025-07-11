import { NextResponse } from 'next/server';
import admin from '@/lib/firebase';
import { z } from 'zod';

const firestore = admin.firestore();
const storage = admin.storage();

const imageUpdateSchema = z.object({
  name: z.string().min(1, '名称不能为空').optional(),
  description: z.string().optional(),
});

// 更新图片信息
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    const validation = imageUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors }, { status: 400 });
    }

    const imageRef = firestore.collection('images').doc(id);
    await imageRef.update(validation.data);

    return NextResponse.json({ message: '图片信息更新成功' });
  } catch (error) {
    console.error('更新图片信息失败:', error);
    return NextResponse.json({ error: '更新图片信息失败' }, { status: 500 });
  }
}

// 获取单个图片信息
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const imageRef = firestore.collection('images').doc(id);
    const imageSnap = await imageRef.get();

    if (!imageSnap.exists) {
      return NextResponse.json({ error: '图片未找到' }, { status: 404 });
    }

    return NextResponse.json({ id: imageSnap.id, ...imageSnap.data() });
  } catch (error) {
    console.error('获取图片信息失败:', error);
    return NextResponse.json({ error: '获取图片信息失败' }, { status: 500 });
  }
}

// 删除图片
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const imageRef = firestore.collection('images').doc(id);
    const imageSnap = await imageRef.get();

    if (!imageSnap.exists) {
      return NextResponse.json({ error: '图片未找到' }, { status: 404 });
    }

    const imageUrl = imageSnap.data()?.imageUrl;
    if (imageUrl) {
      const imageFileRef = storage.bucket().file(new URL(imageUrl).pathname.substring(1));
      await imageFileRef.delete();
    }

    await imageRef.delete();

    return NextResponse.json({ message: '图片删除成功' });
  } catch (error) {
    console.error('删除图片失败:', error);
    return NextResponse.json({ error: '删除图片失败' }, { status: 500 });
  }
}