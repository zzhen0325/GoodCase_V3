/**
 * 新的数据库操作函数
 * 实现数据验证、级联删除和批量操作逻辑
 */

import { getDb } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { 
  TagCategory, 
  FirestoreTagCategory, 
  Tag, 
  FirestoreTag, 
  ImageData, 
  FirestoreImage,
  VALIDATION_RULES,
  PRESET_THEMES,
  ThemeColor
} from '@/types';

// ==================== 验证函数 ====================

export function validateCategory(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('分类名称不能为空');
  } else if (data.name.length > VALIDATION_RULES.CATEGORY_NAME_MAX_LENGTH) {
    errors.push(`分类名称不能超过${VALIDATION_RULES.CATEGORY_NAME_MAX_LENGTH}个字符`);
  }
  
  if (data.description && data.description.length > VALIDATION_RULES.CATEGORY_DESCRIPTION_MAX_LENGTH) {
    errors.push(`描述不能超过${VALIDATION_RULES.CATEGORY_DESCRIPTION_MAX_LENGTH}个字符`);
  }
  
  if (!data.color || !Object.keys(PRESET_THEMES).includes(data.color)) {
    errors.push(`颜色必须是以下值之一: ${Object.keys(PRESET_THEMES).join(', ')}`);
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateTag(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('标签名称不能为空');
  } else if (data.name.length > VALIDATION_RULES.TAG_NAME_MAX_LENGTH) {
    errors.push(`标签名称不能超过${VALIDATION_RULES.TAG_NAME_MAX_LENGTH}个字符`);
  }
  
  if (!data.categoryId || typeof data.categoryId !== 'string') {
    errors.push('必须指定分类ID');
  }
  
  return { isValid: errors.length === 0, errors };
}

export function validateImage(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('图片名称不能为空');
  } else if (data.name.length > VALIDATION_RULES.IMAGE_NAME_MAX_LENGTH) {
    errors.push(`图片名称不能超过${VALIDATION_RULES.IMAGE_NAME_MAX_LENGTH}个字符`);
  }
  
  if (data.description && data.description.length > VALIDATION_RULES.IMAGE_DESCRIPTION_MAX_LENGTH) {
    errors.push(`描述不能超过${VALIDATION_RULES.IMAGE_DESCRIPTION_MAX_LENGTH}个字符`);
  }
  
  if (data.promptBlocks && Array.isArray(data.promptBlocks)) {
    const orders = new Set();
    data.promptBlocks.forEach((block: any, index: number) => {
      if (!block.content || block.content.trim().length === 0) {
        errors.push(`提示词块${index + 1}内容不能为空`);
      } else if (block.content.length > VALIDATION_RULES.PROMPT_CONTENT_MAX_LENGTH) {
        errors.push(`提示词块${index + 1}内容不能超过${VALIDATION_RULES.PROMPT_CONTENT_MAX_LENGTH}个字符`);
      }
      
      if (!block.color || !Object.keys(PRESET_THEMES).includes(block.color)) {
        errors.push(`提示词块${index + 1}颜色无效`);
      }
      
      if (orders.has(block.order)) {
        errors.push(`提示词块排序序号${block.order}重复`);
      }
      orders.add(block.order);
    });
  }
  
  return { isValid: errors.length === 0, errors };
}

// ==================== 分类操作 ====================

export async function createCategory(categoryData: {
  name: string;
  description?: string;
  color: ThemeColor;
}): Promise<TagCategory> {
  const db = getDb();
  if (!db) throw new Error('数据库连接失败');
  
  // 验证数据
  const validation = validateCategory(categoryData);
  if (!validation.isValid) {
    throw new Error(`验证失败: ${validation.errors.join(', ')}`);
  }
  
  // 检查名称唯一性
  const existingQuery = query(
    collection(db, 'tagCategories'),
    where('name', '==', categoryData.name)
  );
  const existingSnapshot = await getDocs(existingQuery);
  
  if (!existingSnapshot.empty) {
    throw new Error('分类名称已存在');
  }
  
  // 创建分类
  const docRef = await addDoc(collection(db, 'tagCategories'), {
    name: categoryData.name,
    description: categoryData.description || '',
    color: categoryData.color,
    isDefault: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  // 更新文档以包含ID
  await setDoc(doc(db, 'tagCategories', docRef.id), {
    id: docRef.id,
    name: categoryData.name,
    description: categoryData.description || '',
    color: categoryData.color,
    isDefault: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return {
    id: docRef.id,
    name: categoryData.name,
    description: categoryData.description || '',
    color: categoryData.color,
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function deleteCategoryWithCascade(categoryId: string): Promise<{
  success: boolean;
  movedTags: number;
  targetCategoryId: string;
}> {
  const db = getDb();
  if (!db) throw new Error('数据库连接失败');
  
  // 检查分类是否存在
  const categoryDoc = await getDoc(doc(db, 'tagCategories', categoryId));
  if (!categoryDoc.exists()) {
    throw new Error('分类不存在');
  }
  
  const categoryData = categoryDoc.data() as FirestoreTagCategory;
  if (categoryData.isDefault) {
    throw new Error('默认分类不能删除');
  }
  
  // 获取默认分类
  const defaultCategoryQuery = query(
    collection(db, 'tagCategories'),
    where('isDefault', '==', true)
  );
  const defaultCategorySnapshot = await getDocs(defaultCategoryQuery);
  
  if (defaultCategorySnapshot.empty) {
    throw new Error('找不到默认分类');
  }
  
  const defaultCategoryId = defaultCategorySnapshot.docs[0].id;
  
  // 获取关联标签
  const tagsQuery = query(
    collection(db, 'tags'),
    where('categoryId', '==', categoryId)
  );
  const tagsSnapshot = await getDocs(tagsQuery);
  
  // 执行级联删除
  const result = await runTransaction(db, async (transaction) => {
    // 将关联标签移动到默认分类
    tagsSnapshot.docs.forEach(tagDoc => {
      transaction.update(tagDoc.ref, {
        categoryId: defaultCategoryId,
        updatedAt: serverTimestamp()
      });
    });
    
    // 删除分类
    transaction.delete(categoryDoc.ref);
    
    return {
      success: true,
      movedTags: tagsSnapshot.size,
      targetCategoryId: defaultCategoryId
    };
  });
  
  return result;
}

// ==================== 标签操作 ====================

export async function createTag(tagData: {
  name: string;
  categoryId: string;
}): Promise<Tag> {
  const db = getDb();
  if (!db) throw new Error('数据库连接失败');
  
  // 验证数据
  const validation = validateTag(tagData);
  if (!validation.isValid) {
    throw new Error(`验证失败: ${validation.errors.join(', ')}`);
  }
  
  // 验证分类是否存在
  const categoryRef = doc(db, 'tagCategories', tagData.categoryId);
  const categorySnapshot = await getDoc(categoryRef);
  
  if (!categorySnapshot.exists()) {
    throw new Error('指定的分类不存在');
  }
  
  // 检查同一分类下名称唯一性
  const existingQuery = query(
    collection(db, 'tags'),
    where('name', '==', tagData.name),
    where('categoryId', '==', tagData.categoryId)
  );
  const existingSnapshot = await getDocs(existingQuery);
  
  if (!existingSnapshot.empty) {
    throw new Error('该分类下已存在同名标签');
  }
  
  // 创建标签
  const docRef = await addDoc(collection(db, 'tags'), {
    name: tagData.name,
    categoryId: tagData.categoryId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  // 更新文档以包含ID
  await setDoc(doc(db, 'tags', docRef.id), {
    id: docRef.id,
    name: tagData.name,
    categoryId: tagData.categoryId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  return {
    id: docRef.id,
    name: tagData.name,
    categoryId: tagData.categoryId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export async function deleteTagWithCascade(tagId: string): Promise<{
  success: boolean;
  affectedImages: number;
}> {
  const db = getDb();
  if (!db) throw new Error('数据库连接失败');
  
  // 检查标签是否存在
  const tagDoc = await getDoc(doc(db, 'tags', tagId));
  if (!tagDoc.exists()) {
    throw new Error('标签不存在');
  }
  
  // 获取使用该标签的图片
  const imagesQuery = query(
    collection(db, 'images'),
    where('tags', 'array-contains', tagId)
  );
  const imagesSnapshot = await getDocs(imagesQuery);
  
  // 执行级联删除
  const result = await runTransaction(db, async (transaction) => {
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
    transaction.delete(tagDoc.ref);
    
    return {
      success: true,
      affectedImages: imagesSnapshot.size
    };
  });
  
  return result;
}

// ==================== 批量操作 ====================

export async function batchUpdateTags(tagIds: string[], updates: any): Promise<{
  successCount: number;
  failedCount: number;
  results: Array<{ id: string; success: boolean; error?: string }>;
}> {
  const db = getDb();
  if (!db) throw new Error('数据库连接失败');
  
  const batch = writeBatch(db);
  const results: Array<{ id: string; success: boolean; error?: string }> = [];
  let successCount = 0;
  let failedCount = 0;
  
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
  
  return { successCount, failedCount, results };
}

export async function batchUpdateImages(imageIds: string[], updates: any): Promise<{
  successCount: number;
  failedCount: number;
  results: Array<{ id: string; success: boolean; error?: string }>;
}> {
  const db = getDb();
  if (!db) throw new Error('数据库连接失败');
  
  const batch = writeBatch(db);
  const results: Array<{ id: string; success: boolean; error?: string }> = [];
  let successCount = 0;
  let failedCount = 0;
  
  for (const imageId of imageIds) {
    try {
      const imageRef = doc(db, 'images', imageId);
      const imageSnapshot = await getDoc(imageRef);
      
      if (!imageSnapshot.exists()) {
        results.push({
          id: imageId,
          success: false,
          error: '图片不存在'
        });
        failedCount++;
        continue;
      }
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      batch.update(imageRef, updateData);
      
      results.push({
        id: imageId,
        success: true
      });
      successCount++;
      
    } catch (error) {
      results.push({
        id: imageId,
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      });
      failedCount++;
    }
  }
  
  await batch.commit();
  
  return { successCount, failedCount, results };
}
