import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where, limit as firestoreLimit } from 'firebase/firestore';
import { ImageData, FirestoreImage, Tag, FirestoreTag, TagCategory, FirestoreTagCategory, PRESET_THEMES } from '@/types';

// GET - 获取图片列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as 'ACTIVE' | 'ARCHIVED' | null;
    const tagId = searchParams.get('tagId');
    const fields = searchParams.get('fields'); // 选择性字段加载
    
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }

    // 构建查询
    let q = query(
      collection(db, 'images'),
      orderBy('createdAt', 'desc')
    );
    
    // 添加状态过滤
    if (status) {
      q = query(
        collection(db, 'images'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }
    
    // 添加标签过滤
    if (tagId) {
      q = query(
        collection(db, 'images'),
        where('tags', 'array-contains', tagId),
        where('status', '==', status || 'ACTIVE'),
        orderBy('createdAt', 'desc')
      );
    }
    
    // 添加分页限制
    q = query(q, firestoreLimit(limit));
    
    const querySnapshot = await getDocs(q);
    
    const allImages: any[] = [];
    
    // 获取标签和分类映射（用于扩展标签信息）
    const tagsMap: Map<string, any> = new Map();
    const categoriesMap: Map<string, TagCategory> = new Map();
    
    // 预加载标签和分类信息
    const [tagsSnapshot, categoriesSnapshot] = await Promise.all([
      getDocs(collection(db, 'tags')),
      getDocs(collection(db, 'tagCategories'))
    ]);
    
    // 构建分类映射
    categoriesSnapshot.docs.forEach(doc => {
      const categoryData = doc.data() as FirestoreTagCategory;
      categoriesMap.set(doc.id, {
        id: doc.id,
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color,
        isDefault: categoryData.isDefault,
        createdAt: categoryData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: categoryData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });
    
    // 构建标签映射（包含分类信息）
    tagsSnapshot.docs.forEach(doc => {
      const tagData = doc.data() as FirestoreTag;
      const tagCategory = categoriesMap.get(tagData.categoryId);
      tagsMap.set(doc.id, {
        id: doc.id,
        name: tagData.name,
        categoryId: tagData.categoryId,
        category: tagCategory,
        createdAt: tagData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: tagData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });
    
    for (const docSnapshot of querySnapshot.docs) {
      const firestoreImage = docSnapshot.data() as FirestoreImage;
      
      // 基础图片信息
      const image: any = {
        id: docSnapshot.id,
        url: firestoreImage.url,
        name: firestoreImage.name,
        link: firestoreImage.link,
        createdAt: firestoreImage.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: firestoreImage.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        status: firestoreImage.status
      };
      
      // 根据fields参数决定返回哪些字段
      if (!fields || fields.includes('description')) {
        image.description = firestoreImage.description;
      }
      
      if (!fields || fields.includes('storagePath')) {
        image.storagePath = firestoreImage.storagePath;
      }
      
      if (!fields || fields.includes('tags')) {
        // 扩展标签信息
        image.tags = firestoreImage.tags.map(tagId => tagsMap.get(tagId)).filter(Boolean);
      }
      
      if (!fields || fields.includes('promptBlocks')) {
        // 扩展提示词块的主题信息
        image.promptBlocks = firestoreImage.promptBlocks.map(block => ({
          ...block,
          theme: block.color ? {
            name: block.color,
            colors: PRESET_THEMES[block.color as keyof typeof PRESET_THEMES]
          } : null
        }));
      }
      
      // 添加统计信息
      if (!fields || fields.includes('stats')) {
        image.tagCount = firestoreImage.tags.length;
        image.promptBlockCount = firestoreImage.promptBlocks.length;
      }
      
      allImages.push(image);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: allImages,
      meta: {
        page,
        limit,
        total: allImages.length
      }
    });
    
  } catch (error) {
    console.error('获取图片列表失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取图片列表失败'
        }
      },
      { status: 500 }
    );
  }
}
