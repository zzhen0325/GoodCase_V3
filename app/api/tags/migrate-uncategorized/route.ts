import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';

// POST - 迁移未分类标签到默认分类
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }

    // 获取默认分类
    const defaultCategoryQuery = query(
      collection(db, 'tagCategories'),
      where('isDefault', '==', true)
    );
    const defaultCategorySnapshot = await getDocs(defaultCategoryQuery);

    if (defaultCategorySnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: '找不到默认分类'
          }
        },
        { status: 500 }
      );
    }

    const defaultCategoryId = defaultCategorySnapshot.docs[0].id;
    const defaultCategoryData = defaultCategorySnapshot.docs[0].data();

    // 查找所有未分类的标签（获取所有标签然后过滤）
    const allTagsQuery = query(collection(db, 'tags'));
    const allTagsSnapshot = await getDocs(allTagsQuery);
    
    const uncategorizedDocs = allTagsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.categoryId || data.categoryId === null || data.categoryId === '' || data.categoryId === undefined;
    });
    
    const uncategorizedTags = {
      docs: uncategorizedDocs,
      empty: uncategorizedDocs.length === 0,
      size: uncategorizedDocs.length
    };
    
    console.log(`找到 ${uncategorizedTags.size} 个未分类标签`);

    if (uncategorizedTags.empty) {
      return NextResponse.json({
        success: true,
        data: {
          message: '没有找到未分类的标签',
          migratedCount: 0,
          targetCategory: {
            id: defaultCategoryId,
            name: defaultCategoryData.name
          }
        }
      });
    }

    // 使用批量写入来更新所有未分类标签
    const batch = writeBatch(db);
    
    uncategorizedTags.docs.forEach(tagDoc => {
      batch.update(tagDoc.ref, {
        categoryId: defaultCategoryId,
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      data: {
        message: '未分类标签已成功迁移到默认分类',
        migratedCount: uncategorizedTags.size,
        targetCategory: {
          id: defaultCategoryId,
          name: defaultCategoryData.name
        }
      }
    });

  } catch (error) {
    console.error('迁移未分类标签失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '迁移未分类标签失败'
        }
      },
      { status: 500 }
    );
  }
}