import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs, runTransaction, writeBatch } from 'firebase/firestore';
import { TagCategory, FirestoreTagCategory, PRESET_THEMES, VALIDATION_RULES } from '@/types';

// 验证分类数据
function validateCategoryData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 名称验证
  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') {
      errors.push('分类名称不能为空');
    } else if (data.name.length > VALIDATION_RULES.CATEGORY_NAME_MAX_LENGTH) {
      errors.push(`分类名称不能超过${VALIDATION_RULES.CATEGORY_NAME_MAX_LENGTH}个字符`);
    }
  }
  
  // 描述验证
  if (data.description !== undefined && data.description.length > VALIDATION_RULES.CATEGORY_DESCRIPTION_MAX_LENGTH) {
    errors.push(`描述不能超过${VALIDATION_RULES.CATEGORY_DESCRIPTION_MAX_LENGTH}个字符`);
  }
  
  // 颜色验证
  if (data.color !== undefined && !Object.keys(PRESET_THEMES).includes(data.color)) {
    errors.push(`颜色必须是以下值之一: ${Object.keys(PRESET_THEMES).join(', ')}`);
  }
  
  return { isValid: errors.length === 0, errors };
}

// GET - 获取单个标签分类
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await context.params;
    
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }

    const docRef = doc(db, 'tagCategories', categoryId);
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: '标签分类不存在'
          }
        },
        { status: 404 }
      );
    }
    
    const firestoreCategory = docSnapshot.data() as FirestoreTagCategory;
    
    const category: TagCategory = {
      id: docSnapshot.id,
      name: firestoreCategory.name,
      description: firestoreCategory.description,
      color: firestoreCategory.color,
      isDefault: firestoreCategory.isDefault,
      createdAt: firestoreCategory.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: firestoreCategory.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
    
    return NextResponse.json({ 
      success: true, 
      data: category
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

// PATCH - 更新标签分类
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await context.params;
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

    const docRef = doc(db, 'tagCategories', categoryId);
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: '标签分类不存在'
          }
        },
        { status: 404 }
      );
    }
    
    const currentData = docSnapshot.data() as FirestoreTagCategory;
    
    // 检查是否尝试修改默认分类的关键属性
    if (currentData.isDefault && (requestData.name || requestData.isDefault === false)) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'OPERATION_NOT_ALLOWED',
            message: '默认分类的名称和默认状态不能修改'
          }
        },
        { status: 403 }
      );
    }
    
    // 如果更新名称，检查是否与其他分类重复
    if (requestData.name && requestData.name !== currentData.name) {
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
    }
    
    // 更新分类
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    if (requestData.name !== undefined) updateData.name = requestData.name;
    if (requestData.description !== undefined) updateData.description = requestData.description;
    if (requestData.color !== undefined) updateData.color = requestData.color;
    if (requestData.isDefault !== undefined) updateData.isDefault = requestData.isDefault;
    
    await updateDoc(docRef, updateData);
    
    // 返回更新后的数据
    const updatedSnapshot = await getDoc(docRef);
    const updatedData = updatedSnapshot.data() as FirestoreTagCategory;
    
    const responseData: TagCategory = {
      id: categoryId,
      name: updatedData.name,
      description: updatedData.description,
      color: updatedData.color,
      isDefault: updatedData.isDefault,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({ 
      success: true, 
      data: responseData
    });
    
  } catch (error) {
    console.error('更新标签分类失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '更新标签分类失败'
        }
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除标签分类（级联删除）
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await context.params;
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';

    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }

    const docRef = doc(db, 'tagCategories', categoryId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: '标签分类不存在'
          }
        },
        { status: 404 }
      );
    }

    const categoryData = docSnapshot.data() as FirestoreTagCategory;

    // 检查是否为默认分类
    if (categoryData.isDefault) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OPERATION_NOT_ALLOWED',
            message: '默认分类不能删除'
          }
        },
        { status: 403 }
      );
    }

    // 获取关联的标签
    const tagsQuery = query(
      collection(db, 'tags'),
      where('categoryId', '==', categoryId)
    );
    const tagsSnapshot = await getDocs(tagsQuery);

    // 获取默认分类ID
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

    // 如果是预览模式，返回影响范围
    if (preview) {
      return NextResponse.json({
        success: true,
        data: {
          canDelete: true,
          isDefault: false,
          affectedTags: tagsSnapshot.size,
          targetCategory: {
            id: defaultCategoryId,
            name: defaultCategoryData.name
          }
        }
      });
    }

    // 执行级联删除
    await runTransaction(db, async (transaction) => {
      // 将关联标签移动到默认分类
      tagsSnapshot.docs.forEach(tagDoc => {
        transaction.update(tagDoc.ref, {
          categoryId: defaultCategoryId,
          updatedAt: serverTimestamp()
        });
      });

      // 删除分类
      transaction.delete(docRef);
    });

    return NextResponse.json({
      success: true,
      data: {
        message: '分类已成功删除',
        movedTags: tagsSnapshot.size,
        targetCategoryId: defaultCategoryId
      }
    });

  } catch (error) {
    console.error('删除标签分类失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除标签分类失败'
        }
      },
      { status: 500 }
    );
  }
}
