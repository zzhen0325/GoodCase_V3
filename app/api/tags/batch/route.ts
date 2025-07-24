import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { BatchOperationResult } from '@/types';

// PATCH - 批量操作标签
export async function PATCH(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { operation, tagIds, updates } = requestData;
    
    if (!operation || !Array.isArray(tagIds) || tagIds.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少必要参数',
            details: {
              errors: [
                { field: 'operation', message: '操作类型不能为空' },
                { field: 'tagIds', message: '标签ID数组不能为空' }
              ]
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
    
    const results: BatchOperationResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;
    
    if (operation === 'update') {
      if (!updates || typeof updates !== 'object') {
        return NextResponse.json(
          { 
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '更新操作需要提供updates参数'
            }
          },
          { status: 400 }
        );
      }
      
      // 批量更新
      const batch = writeBatch(db);
      
      for (const tagId of tagIds) {
        try {
          const tagRef = doc(db, 'tags', tagId);
          const tagSnapshot = await getDoc(tagRef);
          
          if (!tagSnapshot.exists()) {
            results.push({
              id: tagId,
              success: false,
              error: '标签不存在'
            });
            failedCount++;
            continue;
          }
          
          const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
          };
          
          batch.update(tagRef, updateData);
          
          results.push({
            id: tagId,
            success: true
          });
          successCount++;
          
        } catch (error) {
          results.push({
            id: tagId,
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          });
          failedCount++;
        }
      }
      
      await batch.commit();
      
    } else if (operation === 'delete') {
      // 批量删除
      for (const tagId of tagIds) {
        try {
          const tagRef = doc(db, 'tags', tagId);
          const tagSnapshot = await getDoc(tagRef);
          
          if (!tagSnapshot.exists()) {
            results.push({
              id: tagId,
              success: false,
              error: '标签不存在'
            });
            failedCount++;
            continue;
          }
          
          // 获取使用该标签的图片
          const imagesQuery = query(
            collection(db, 'images'),
            where('tags', 'array-contains', tagId)
          );
          const imagesSnapshot = await getDocs(imagesQuery);
          
          // 使用批量操作删除标签并更新图片
          const batch = writeBatch(db);
          
          // 从所有图片中移除该标签
          imagesSnapshot.docs.forEach(imageDoc => {
            const imageData = imageDoc.data();
            const updatedTags = imageData.tags.filter((id: string) => id !== tagId);
            batch.update(imageDoc.ref, {
              tags: updatedTags,
              updatedAt: serverTimestamp()
            });
          });
          
          // 删除标签
          batch.delete(tagRef);
          
          await batch.commit();
          
          results.push({
            id: tagId,
            success: true
          });
          successCount++;
          
        } catch (error) {
          results.push({
            id: tagId,
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          });
          failedCount++;
        }
      }
      
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '不支持的操作类型',
            details: {
              supportedOperations: ['update', 'delete']
            }
          }
        },
        { status: 400 }
      );
    }
    
    const responseData: BatchOperationResult = {
      successCount,
      failedCount,
      results
    };
    
    return NextResponse.json({
      success: true,
      data: {
        message: '批量操作完成',
        operation,
        ...responseData
      }
    });
    
  } catch (error) {
    console.error('批量操作标签失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '批量操作标签失败'
        }
      },
      { status: 500 }
    );
  }
}
