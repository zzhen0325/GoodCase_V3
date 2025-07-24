import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { Tag, FirestoreTag, VALIDATION_RULES } from '@/types';

// 验证标签数据
function validateTagData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 名称验证
  if (data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') {
      errors.push('标签名称不能为空');
    } else if (data.name.length > VALIDATION_RULES.TAG_NAME_MAX_LENGTH) {
      errors.push(`标签名称不能超过${VALIDATION_RULES.TAG_NAME_MAX_LENGTH}个字符`);
    }
  }
  
  // 分类ID验证
  if (data.categoryId !== undefined && (!data.categoryId || typeof data.categoryId !== 'string')) {
    errors.push('分类ID不能为空');
  }
  
  return { isValid: errors.length === 0, errors };
}

// GET - 获取单个标签
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tagId: string }> }
) {
  try {
    const { tagId } = await context.params;
    
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }

    const docRef = doc(db, 'tags', tagId);
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: '标签不存在'
          }
        },
        { status: 404 }
      );
    }
    
    const firestoreTag = docSnapshot.data() as FirestoreTag;
    
    const tag: Tag = {
      id: docSnapshot.id,
      name: firestoreTag.name,
      categoryId: firestoreTag.categoryId,
      createdAt: firestoreTag.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: firestoreTag.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
    
    return NextResponse.json({ 
      success: true, 
      data: tag
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

// PATCH - 更新标签
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tagId: string }> }
) {
  try {
    const { tagId } = await context.params;
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

    const docRef = doc(db, 'tags', tagId);
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: '标签不存在'
          }
        },
        { status: 404 }
      );
    }
    
    const currentData = docSnapshot.data() as FirestoreTag;
    
    // 如果更新名称，检查同一分类下是否重复
    if (requestData.name && requestData.name !== currentData.name) {
      const categoryId = requestData.categoryId || currentData.categoryId;
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
    }
    
    // 更新标签
    const updateData: any = {
      updatedAt: serverTimestamp()
    };
    
    if (requestData.name !== undefined) updateData.name = requestData.name;
    if (requestData.categoryId !== undefined) updateData.categoryId = requestData.categoryId;
    
    await updateDoc(docRef, updateData);
    
    // 返回更新后的数据
    const updatedSnapshot = await getDoc(docRef);
    const updatedData = updatedSnapshot.data() as FirestoreTag;
    
    const responseData: Tag = {
      id: tagId,
      name: updatedData.name,
      categoryId: updatedData.categoryId,
      createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({ 
      success: true, 
      data: responseData
    });
    
  } catch (error) {
    console.error('更新标签失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '更新标签失败'
        }
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除标签（级联删除）
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ tagId: string }> }
) {
  try {
    const { tagId } = await context.params;
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get('preview') === 'true';
    
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }

    const docRef = doc(db, 'tags', tagId);
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: '标签不存在'
          }
        },
        { status: 404 }
      );
    }
    
    const tagData = docSnapshot.data() as FirestoreTag;
    
    // 获取使用该标签的图片
    const imagesQuery = query(
      collection(db, 'images'),
      where('tags', 'array-contains', tagId)
    );
    const imagesSnapshot = await getDocs(imagesQuery);
    
    // 如果是预览模式，返回影响范围
    if (preview) {
      return NextResponse.json({
        success: true,
        data: {
          canDelete: true,
          affectedImages: imagesSnapshot.size,
          tagName: tagData.name
        }
      });
    }
    
    // 执行级联删除
    await runTransaction(db, async (transaction) => {
      // 从所有图片中移除该标签
      imagesSnapshot.docs.forEach(imageDoc => {
        const imageData = imageDoc.data();
        const updatedTags = imageData.tags.filter((id: string) => id !== tagId);
        transaction.update(imageDoc.ref, {
          tags: updatedTags,
          updatedAt: serverTimestamp()
        });
      });
      
      // 删除标签
      transaction.delete(docRef);
    });
    
    return NextResponse.json({
      success: true,
      data: {
        message: '标签已成功删除',
        affectedImages: imagesSnapshot.size
      }
    });
    
  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除标签失败'
        }
      },
      { status: 500 }
    );
  }
}
