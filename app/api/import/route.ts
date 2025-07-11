import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ExportData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data }: { data: ExportData } = body;

    // 验证数据格式
    if (!data || !data.version || !Array.isArray(data.images)) {
      return NextResponse.json(
        { error: '无效的导入数据格式' },
        { status: 400 }
      );
    }

    // 简化导入：逐个添加图片
    let successCount = 0;
    let errorCount = 0;
    
    for (const image of data.images) {
      try {
        const db = getAdminDb();
        const docRef = await db.collection('images').add({
          title: image.title,
          url: image.url,
          prompts: image.prompts || [],
          tags: image.tags || [],
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }
    
    const result = {
      imported: successCount,
      failed: errorCount,
      total: data.images.length
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('导入失败:', error);
    return NextResponse.json(
      { error: '导入失败' },
      { status: 500 }
    );
  }
}