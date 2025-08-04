import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, where, doc, setDoc } from 'firebase/firestore';
import { TagCategory, FirestoreTagCategory, PRESET_THEMES, ThemeColor, VALIDATION_RULES } from '@/types';

// 验证分类数据
function validateCategoryData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 名称验证
  if (!data.name || typeof data.name !== 'string') {
    errors.push('分类名称不能为空');
  } else if (data.name.length > VALIDATION_RULES.CATEGORY_NAME_MAX_LENGTH) {
    errors.push(`分类名称不能超过${VALIDATION_RULES.CATEGORY_NAME_MAX_LENGTH}个字符`);
  }
  
  // 描述验证
  if (data.description && data.description.length > VALIDATION_RULES.CATEGORY_DESCRIPTION_MAX_LENGTH) {
    errors.push(`描述不能超过${VALIDATION_RULES.CATEGORY_DESCRIPTION_MAX_LENGTH}个字符`);
  }
  
  // 颜色验证
  if (!data.color || !Object.keys(PRESET_THEMES).includes(data.color)) {
    errors.push(`颜色必须是以下值之一: ${Object.keys(PRESET_THEMES).join(', ')}`);
  }
  
  return { isValid: errors.length === 0, errors };
}

// GET - 获取所有标签分类
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '9999');
    
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }

    const q = query(collection(db, 'tagCategories'), orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const allCategories: TagCategory[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const firestoreCategory = docSnapshot.data() as FirestoreTagCategory;
      
      const tagCategory: TagCategory = {
        id: docSnapshot.id,
        name: firestoreCategory.name,
        description: firestoreCategory.description,
        color: firestoreCategory.color,
        isDefault: firestoreCategory.isDefault,
        createdAt: firestoreCategory.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: firestoreCategory.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
      
      allCategories.push(tagCategory);
    }
    
    // 分页处理
    const total = allCategories.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const categories = allCategories.slice(startIndex, endIndex);
    
    return NextResponse.json({ 
      success: true, 
      data: categories,
      meta: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    console.error('获取标签分类失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取标签分类失败'
        }
      },
      { status: 500 }
    );
  }
}

// POST - 创建标签分类
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // 验证请求数据
    const validation = validateCategoryData(requestData);
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
    
    // 检查分类名称是否已存在
    const existingQuery = query(
      collection(db, 'tagCategories'), 
      where('name', '==', requestData.name)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'RESOURCE_CONFLICT',
            message: '分类名称已存在',
            details: {
              field: 'name',
              value: requestData.name
            }
          }
        },
        { status: 409 }
      );
    }
    
    // 创建新分类
    const isDefault = requestData.isDefault === true;
    const docRef = await addDoc(collection(db, 'tagCategories'), {
      name: requestData.name,
      description: requestData.description || '',
      color: requestData.color as ThemeColor,
      isDefault: isDefault,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // 更新文档以包含ID
    await setDoc(doc(db, 'tagCategories', docRef.id), {
      id: docRef.id,
      name: requestData.name,
      description: requestData.description || '',
      color: requestData.color as ThemeColor,
      isDefault: isDefault,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    const responseData: TagCategory = {
      id: docRef.id,
      name: requestData.name,
      description: requestData.description || '',
      color: requestData.color as ThemeColor,
      isDefault: isDefault,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({ 
      success: true, 
      data: responseData
    });
    
  } catch (error) {
    console.error('创建标签分类失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '创建标签分类失败'
        }
      },
      { status: 500 }
    );
  }
}
