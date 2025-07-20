import { getServerFirebase } from '../lib/firebase-server';
import { Timestamp } from 'firebase-admin/firestore';
import type {
  ImageDocument,
  TagDocument,
  CategoryDocument,
  ImageTagDocument,
  Tag,
  TagGroup
} from '../types';

// 集合名称
const COLLECTIONS = {
  IMAGES: 'images',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  IMAGE_TAGS: 'image-tags',
} as const;

/**
 * 数据迁移脚本：将嵌入式标签数据迁移到独立表结构
 * 
 * 迁移步骤：
 * 1. 读取所有图片的嵌入式标签数据
 * 2. 创建独立的分类（categories）记录
 * 3. 创建独立的标签（tags）记录
 * 4. 建立图片标签关联（image_tags）记录
 * 5. 清理图片中的嵌入式标签字段
 */
export async function migrateToIndependentTables() {
  console.log('开始数据迁移：将嵌入式标签迁移到独立表结构...');
  
  try {
    const { db } = await getServerFirebase();
    const batch = db.batch();
    
    // 步骤1：读取所有图片数据
    console.log('步骤1：读取所有图片数据...');
    const imagesSnapshot = await db.collection(COLLECTIONS.IMAGES).get();
    const images = imagesSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data() as ImageDocument
    }));
    
    console.log(`找到 ${images.length} 张图片`);
    
    // 步骤2：收集所有唯一的分类和标签
    console.log('步骤2：分析标签和分类数据...');
    const categoriesMap = new Map<string, TagGroup>();
    const tagsMap = new Map<string, Tag & { categoryId?: string }>();
    const imageTagRelations: Array<{ imageId: string; tagId: string }> = [];
    
    images.forEach(({ id: imageId, data: imageData }) => {
      const imageTags = (imageData as any).tags || [];
      
      imageTags.forEach((tag: any) => {
        if (!tag || !tag.name) return;
        
        // 处理分类
        const categoryId = tag.groupId || 'default';
        const categoryName = tag.groupName || '默认分类';
        
        if (!categoriesMap.has(categoryId)) {
          categoriesMap.set(categoryId, {
            id: categoryId,
            name: categoryName,
            description: categoryId === 'default' ? '默认分类' : undefined,
            order: categoryId === 'default' ? 0 : categoriesMap.size + 1,
            tagCount: 0,
            createdAt: tag.createdAt || new Date().toISOString(),
            updatedAt: tag.updatedAt || new Date().toISOString(),
          });
        }
        
        // 处理标签
        const tagKey = `${tag.name}_${categoryId}`; // 确保标签名在分类内唯一
        if (!tagsMap.has(tagKey)) {
          tagsMap.set(tagKey, {
            id: tag.id || `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: tag.name,
            color: tag.color || '#3b82f6',
            categoryId: categoryId,
            usageCount: 0,
            order: tag.order || 0,
            createdAt: tag.createdAt || new Date().toISOString(),
            updatedAt: tag.updatedAt || new Date().toISOString(),
          });
        }
        
        // 记录图片标签关联
        const tagData = tagsMap.get(tagKey)!;
        imageTagRelations.push({
          imageId,
          tagId: tagData.id
        });
        
        // 更新使用计数
        tagData.usageCount = (tagData.usageCount || 0) + 1;
      });
    });
    
    // 更新分类的标签计数
    tagsMap.forEach(tag => {
      if (tag.categoryId && categoriesMap.has(tag.categoryId)) {
        const category = categoriesMap.get(tag.categoryId)!;
        category.tagCount = (category.tagCount || 0) + 1;
      }
    });
    
    console.log(`找到 ${categoriesMap.size} 个分类，${tagsMap.size} 个标签，${imageTagRelations.length} 个关联关系`);
    
    // 步骤3：创建分类记录
    console.log('步骤3：创建分类记录...');
    for (const [categoryId, category] of Array.from(categoriesMap.entries())) {
      const categoryRef = db.collection(COLLECTIONS.CATEGORIES).doc(categoryId);
      const categoryDoc: CategoryDocument = {
        id: categoryId,
        name: category.name,
        description: category.description,
        order: category.order,
        tagCount: category.tagCount,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      batch.set(categoryRef, categoryDoc);
    }
    
    // 步骤4：创建标签记录
    console.log('步骤4：创建标签记录...');
    for (const [, tag] of Array.from(tagsMap.entries())) {
      const tagRef = db.collection(COLLECTIONS.TAGS).doc(tag.id);
      const tagDoc: TagDocument = {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        categoryId: tag.categoryId,
        usageCount: tag.usageCount,
        order: tag.order,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      batch.set(tagRef, tagDoc);
    }
    
    // 步骤5：创建图片标签关联记录
    console.log('步骤5：创建图片标签关联记录...');
    imageTagRelations.forEach(({ imageId, tagId }) => {
      const relationRef = db.collection(COLLECTIONS.IMAGE_TAGS).doc();
      const relationDoc: ImageTagDocument = {
        id: relationRef.id,
        imageId,
        tagId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      batch.set(relationRef, relationDoc);
    });
    
    // 步骤6：清理图片中的嵌入式标签字段
    console.log('步骤6：清理图片中的嵌入式标签字段...');
    images.forEach(({ id: imageId }) => {
      const imageRef = db.collection(COLLECTIONS.IMAGES).doc(imageId);
      batch.update(imageRef, {
        tags: [], // 清空标签数组
        updatedAt: Timestamp.now(),
      });
    });
    
    // 提交所有更改
    console.log('提交数据库更改...');
    await batch.commit();
    
    console.log('数据迁移完成！');
    console.log(`- 创建了 ${categoriesMap.size} 个分类`);
    console.log(`- 创建了 ${tagsMap.size} 个标签`);
    console.log(`- 创建了 ${imageTagRelations.length} 个图片标签关联`);
    console.log(`- 更新了 ${images.length} 张图片`);
    
  } catch (error) {
    console.error('数据迁移失败:', error);
    throw error;
  }
}

/**
 * 回滚迁移：将独立表数据恢复到嵌入式结构（仅用于测试）
 */
export async function rollbackMigration() {
  console.log('开始回滚迁移...');
  
  try {
    const { db } = await getServerFirebase();
    const batch = db.batch();
    
    // 读取所有数据
    const [imagesSnapshot, categoriesSnapshot, tagsSnapshot, imageTagsSnapshot] = await Promise.all([
      db.collection(COLLECTIONS.IMAGES).get(),
      db.collection(COLLECTIONS.CATEGORIES).get(),
      db.collection(COLLECTIONS.TAGS).get(),
      db.collection(COLLECTIONS.IMAGE_TAGS).get(),
    ]);
    
    // 构建数据映射
    const categories = new Map<string, CategoryDocument>();
    categoriesSnapshot.docs.forEach(doc => {
      categories.set(doc.id, doc.data() as CategoryDocument);
    });
    
    const tags = new Map<string, TagDocument>();
    tagsSnapshot.docs.forEach(doc => {
      tags.set(doc.id, doc.data() as TagDocument);
    });
    
    const imageTagsMap = new Map<string, string[]>();
    imageTagsSnapshot.docs.forEach(doc => {
      const data = doc.data() as ImageTagDocument;
      if (!imageTagsMap.has(data.imageId)) {
        imageTagsMap.set(data.imageId, []);
      }
      imageTagsMap.get(data.imageId)!.push(data.tagId);
    });
    
    // 恢复图片的嵌入式标签
    imagesSnapshot.docs.forEach(doc => {
      const imageId = doc.id;
      const tagIds = imageTagsMap.get(imageId) || [];
      
      const imageTags: Tag[] = tagIds.map(tagId => {
        const tag = tags.get(tagId);
        const category = tag?.categoryId ? categories.get(tag.categoryId) : null;
        
        return {
          id: tagId,
          name: tag?.name || '',
          color: tag?.color || '#3b82f6',
          groupId: tag?.categoryId,
          groupName: category?.name,
          order: tag?.order || 0,
          createdAt: tag?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: tag?.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      }).filter(tag => tag.name); // 过滤掉无效标签
      
      batch.update(doc.ref, {
        tags: imageTags,
        updatedAt: Timestamp.now(),
      });
    });
    
    // 删除独立表数据
    categoriesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    tagsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    imageTagsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    
    console.log('回滚完成！');
    
  } catch (error) {
    console.error('回滚失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'migrate') {
    migrateToIndependentTables()
      .then(() => {
        console.log('迁移成功完成');
        process.exit(0);
      })
      .catch((error) => {
        console.error('迁移失败:', error);
        process.exit(1);
      });
  } else if (command === 'rollback') {
    rollbackMigration()
      .then(() => {
        console.log('回滚成功完成');
        process.exit(0);
      })
      .catch((error) => {
        console.error('回滚失败:', error);
        process.exit(1);
      });
  } else {
    console.log('用法:');
    console.log('  npm run migrate        # 执行迁移');
    console.log('  npm run rollback       # 回滚迁移');
    process.exit(1);
  }
}