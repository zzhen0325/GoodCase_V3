import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { Tag, FirestoreTag, TagCategory, FirestoreTagCategory, VALIDATION_RULES } from '@/types';

// 验证标签数据
function validateTagData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 名称验证
  if (!data.name || typeof data.name !== 'string') {
    errors.push('标签名称不能为空');
  } else if (data.name.length > VALIDATION_RULES.TAG_NAME_MAX_LENGTH) {
    errors.push(`标签名称不能超过${VALIDATION_RULES.TAG_NAME_MAX_LENGTH}个字符`);
  }
  
  // 分类ID验证（允许为空，将自动分配到默认分类）
  if (data.categoryId && typeof data.categoryId !== 'string') {
    errors.push('分类ID格式不正确');
  }
  
  return { isValid: errors.length === 0, errors };
}

// GET - 获取所有标签
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9999');
    const categoryId = searchParams.get('categoryId');
    const includeCategory = searchParams.get('includeCategory') === 'true';
    
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }

    // 构建查询
    let q = query(collection(db, 'tags'), orderBy('name', 'asc'));
    
    if (categoryId) {
      q = query(collection(db, 'tags'), where('categoryId', '==', categoryId), orderBy('name', 'asc'));
    }
    
    const querySnapshot = await getDocs(q);
    
    const allTags: any[] = [];
    
    // 如果需要包含分类信息，先获取所有分类
    let categoriesMap: Map<string, TagCategory> = new Map();
    if (includeCategory) {
      const categoriesSnapshot = await getDocs(collection(db, 'tagCategories'));
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
    }
    
    for (const docSnapshot of querySnapshot.docs) {
      const firestoreTag = docSnapshot.data() as FirestoreTag;
      
      const tag: any = {
        id: docSnapshot.id,
        name: firestoreTag.name,
        categoryId: firestoreTag.categoryId,
        createdAt: firestoreTag.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: firestoreTag.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
      
      // 如果需要包含分类信息
      if (includeCategory && categoriesMap.has(firestoreTag.categoryId)) {
        tag.tagCategory = categoriesMap.get(firestoreTag.categoryId);
      }
      
      allTags.push(tag);
    }
    
    // 分页处理
    const total = allTags.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const tags = allTags.slice(startIndex, endIndex);
    
    return NextResponse.json({ 
      success: true, 
      data: tags,
      meta: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    console.error('获取标签失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取标签失败'
        }
      },
      { status: 500 }
    );
  }
}

// POST - 创建标签
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // 验证请求数据
    const validation = validateTagData(requestData);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '数据验证失败',
            details: {
              errors: validation.errors.map(error => ({
                field: 'general',
                message: error
              }))
            }
          }
        },
        { status: 400 }
      );
    }
    
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }
    
    // 确定要使用的分类ID
    let categoryId = requestData.categoryId;
    
    if (!categoryId) {
      // 如果没有指定分类，获取默认分类
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
      
      categoryId = defaultCategorySnapshot.docs[0].id;
    } else {
      // 验证指定的分类是否存在
      const categoryRef = doc(db, 'tagCategories', categoryId);
      const categorySnapshot = await getDoc(categoryRef);
      
      if (!categorySnapshot.exists()) {
        return NextResponse.json(
          { 
            success: false,
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: '指定的分类不存在',
              details: {
                field: 'categoryId',
                value: categoryId
              }
            }
          },
          { status: 404 }
        );
      }
    }
    
    // 检查同一分类下标签名称是否已存在
    const existingQuery = query(
      collection(db, 'tags'), 
      where('name', '==', requestData.name),
      where('categoryId', '==', categoryId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'RESOURCE_CONFLICT',
            message: '该分类下已存在同名标签',
            details: {
              field: 'name',
              categoryId: categoryId,
              existingTagId: existingSnapshot.docs[0].id
            }
          }
        },
        { status: 409 }
      );
    }
    
    // 创建新标签
    const docRef = await addDoc(collection(db, 'tags'), {
      name: requestData.name,
      categoryId: categoryId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // 更新文档以包含ID
    await setDoc(doc(db, 'tags', docRef.id), {
      id: docRef.id,
      name: requestData.name,
      categoryId: categoryId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const responseData: Tag = {
      id: docRef.id,
      name: requestData.name,
      categoryId: categoryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({ 
      success: true, 
      data: responseData
    });
    
  } catch (error) {
    console.error('创建标签失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '创建标签失败'
        }
      },
      { status: 500 }
    );
  }
}
