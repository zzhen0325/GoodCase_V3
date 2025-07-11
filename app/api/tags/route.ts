import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Tag } from '@/types';

const COLLECTIONS = {
  IMAGES: 'images',
} as const;

async function getAllTags(db: FirebaseFirestore.Firestore): Promise<Tag[]> {
  const imagesSnapshot = await db.collection(COLLECTIONS.IMAGES).get();
  const tagMap = new Map<string, Tag>();
  imagesSnapshot.docs.forEach((doc: any) => {
    const imageData = doc.data();
    (imageData.tags || []).forEach((tag: Tag) => {
      if (tagMap.has(tag.name)) {
        const existingTag = tagMap.get(tag.name)!;
        existingTag.usageCount = (existingTag.usageCount || 0) + 1;
      } else {
        tagMap.set(tag.name, { ...tag, usageCount: 1 });
      }
    });
  });
  return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// GET - 获取所有标签
export async function GET() {
  try {
    const adminDb = getAdminDb();
    const tags = await getAllTags(adminDb);
    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { success: false, error: '获取标签失败' },
      { status: 500 }
    );
  }
}

// POST - 添加新标签
export async function POST(req: NextRequest) {
  try {
    const tagData = (await req.json()) as Omit<Tag, 'id'>;
    // 标签是嵌入在图片文档中的，这个API可能需要重新设计，或者只是一个未使用的占位符。
    // 暂时返回成功，因为没有直接的“添加标签”操作。
    return NextResponse.json({ success: true, message: '标签功能暂未实现' }, { status: 201 });
  } catch (error) {
    console.error('添加标签失败:', error);
    return NextResponse.json(
      { success: false, error: '添加标签失败' },
      { status: 500 }
    );
  }
}