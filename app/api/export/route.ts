import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { ExportData, ImageData, Prompt, Tag } from '@/types';

const COLLECTIONS = {
  IMAGES: 'images',
  PROMPTS: 'prompts',
} as const;

async function getAllImages(db: FirebaseFirestore.Firestore): Promise<ImageData[]> {
  const imagesSnapshot = await db.collection(COLLECTIONS.IMAGES).orderBy('createdAt', 'desc').get();
  const images: ImageData[] = [];
  for (const doc of imagesSnapshot.docs) {
    const imageData = doc.data() as any;
    const promptsSnapshot = await db.collection(COLLECTIONS.PROMPTS).where('imageId', '==', imageData.id).orderBy('order').get();
    const prompts: Prompt[] = promptsSnapshot.docs.map((promptDoc: any) => promptDoc.data() as Prompt);
    const tags: Tag[] = imageData.tags || [];
    images.push({ ...imageData, prompts, tags });
  }
  return images;
}

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

async function getAllPrompts(db: FirebaseFirestore.Firestore): Promise<Prompt[]> {
  const promptsSnapshot = await db.collection(COLLECTIONS.PROMPTS).orderBy('createdAt', 'desc').get();
  return promptsSnapshot.docs.map((doc: any) => doc.data() as Prompt);
}

async function exportAllData(db: FirebaseFirestore.Firestore): Promise<ExportData> {
  const [images, tags, prompts] = await Promise.all([
    getAllImages(db),
    getAllTags(db),
    getAllPrompts(db),
  ]);
  return {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    images,
    tags,
    metadata: {
      totalImages: images.length,
      totalTags: tags.length,
      totalPrompts: prompts.length,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const exportData = await exportAllData(adminDb);
    const filename = `gallery-export-${new Date().toISOString().split('T')[0]}.json`;
    
    // 返回JSON文件
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('导出失败:', error);
    return NextResponse.json(
      { error: '导出失败' },
      { status: 500 }
    );
  }
}