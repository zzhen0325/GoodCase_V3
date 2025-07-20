import { getServerFirebase } from './firebase-server';
import { Timestamp } from 'firebase-admin/firestore';
import type {
  ImageData,
  ImageDocument,
  PromptDocument,
  ExportData,
  TagGroup,
  TagGroupDocument,
  Tag,
  TagDocument,
} from '@/types';



// Firestore 集合名称
const COLLECTIONS = {
  IMAGES: 'images',
  PROMPTS: 'prompts',
  CATEGORIES: 'categories', // 原 TAG_GROUPS
  TAGS: 'tags',
  IMAGE_TAGS: 'image-tags', // 新增：图片标签关联表
  // 保持向后兼容
  TAG_GROUPS: 'categories',
} as const;

export class DatabaseAdmin {
  // 获取所有图片（管理员版本，无分页限制）
  static async getAllImages(): Promise<ImageData[]> {
    try {
      const { db } = await getServerFirebase();
      const imagesSnapshot = await db
        .collection(COLLECTIONS.IMAGES)
        .orderBy('createdAt', 'desc')
        .get();

      const images: ImageData[] = [];

      for (const doc of imagesSnapshot.docs) {
        const imageData = doc.data() as ImageDocument;

        // 获取关联的提示词
        const promptsSnapshot = await db
          .collection(COLLECTIONS.PROMPTS)
          .where('imageId', '==', doc.id)
          .get();

        const prompts = promptsSnapshot.docs.map(
          (promptDoc: any) => {
            const promptData = promptDoc.data() as PromptDocument;
            return {
              id: promptDoc.id,
              title: promptData.title || '',
              content: promptData.content || '',
              color: promptData.color || '#3b82f6',
              order: promptData.order || 0,
              createdAt: promptData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updatedAt: promptData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            };
          }
        );

        // 获取关联的标签（从image-tags关联表）
        const imageTagsSnapshot = await db
          .collection(COLLECTIONS.IMAGE_TAGS)
          .where('imageId', '==', doc.id)
          .get();

        const tags: Tag[] = [];
        for (const imageTagDoc of imageTagsSnapshot.docs) {
          const imageTagData = imageTagDoc.data();
          const tagDoc = await db.collection(COLLECTIONS.TAGS).doc(imageTagData.tagId).get();
          if (tagDoc.exists) {
            const tagData = tagDoc.data() as TagDocument;
            tags.push({
              id: tagDoc.id,
              name: tagData.name,
              color: tagData.color,
              categoryId: tagData.categoryId,
              usageCount: tagData.usageCount || 0,
              order: tagData.order || 0,
              createdAt: tagData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updatedAt: tagData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            });
          }
        }

        images.push({
          id: doc.id,
          url: imageData.url,
          title: imageData.title,
          prompts: prompts,
          tags: tags,
          createdAt: imageData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: imageData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      }

      return images;
    } catch (error) {
      console.error('获取所有图片失败:', error);
      return [];
    }
  }

  // 获取所有提示词
  static async getAllPrompts(): Promise<any[]> {
    try {
      const { db } = await getServerFirebase();
      const promptsSnapshot = await db
        .collection(COLLECTIONS.PROMPTS)
        .orderBy('createdAt', 'desc')
        .get();

      return promptsSnapshot.docs.map((doc: any) => {
        const data = doc.data() as PromptDocument;
        return {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          color: data.color || '#3b82f6',
          order: data.order || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('获取所有提示词失败:', error);
      return [];
    }
  }

  // 导出所有数据
  static async exportAllData(): Promise<ExportData> {
    try {
      console.log('开始导出数据...');

      const [images, prompts] = await Promise.all([
        this.getAllImages(),
        this.getAllPrompts(),
      ]);

      const exportData: ExportData = {
        version: '2.1',
        exportDate: new Date(),
        images,
        tags: [],
        metadata: {
          totalImages: images.length,
          totalTags: 0,
        },
      };

      console.log(
        `导出完成: ${images.length} 张图片, ${prompts.length} 个提示词`
      );

      return exportData;
    } catch (error) {
      console.error('导出数据失败:', error);
      throw new Error('导出数据失败');
    }
  }

  // 清空所有数据（危险操作）
  static async clearAllData(): Promise<void> {
    try {
      console.log('开始清空所有数据...');

      const { db } = await getServerFirebase();
      const batch = db.batch();

      // 删除所有图片
      const imagesSnapshot = await db.collection(COLLECTIONS.IMAGES).get();
      imagesSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      // 删除所有提示词
      const promptsSnapshot = await db.collection(COLLECTIONS.PROMPTS).get();
      promptsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      // 删除所有分类
      const categoriesSnapshot = await db.collection(COLLECTIONS.CATEGORIES).get();
      categoriesSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      // 删除所有标签
      const tagsSnapshot = await db.collection(COLLECTIONS.TAGS).get();
      tagsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      // 删除所有图片标签关联
      const imageTagsSnapshot = await db.collection(COLLECTIONS.IMAGE_TAGS).get();
      imageTagsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log('所有数据已清空');
    } catch (error) {
      console.error('清空数据失败:', error);
      throw new Error('清空数据失败');
    }
  }

  // 获取数据库统计信息
  static async getStats(): Promise<{
    totalImages: number;
    totalPrompts: number;
    totalCategories: number;
    totalTags: number;
    totalImageTags: number;
  }> {
    try {
      const { db } = await getServerFirebase();
      const [imagesSnapshot, promptsSnapshot, categoriesSnapshot, tagsSnapshot, imageTagsSnapshot] = await Promise.all([
        db.collection(COLLECTIONS.IMAGES).get(),
        db.collection(COLLECTIONS.PROMPTS).get(),
        db.collection(COLLECTIONS.CATEGORIES).get(),
        db.collection(COLLECTIONS.TAGS).get(),
        db.collection(COLLECTIONS.IMAGE_TAGS).get(),
      ]);

      return {
        totalImages: imagesSnapshot.size,
        totalPrompts: promptsSnapshot.size,
        totalCategories: categoriesSnapshot.size,
        totalTags: tagsSnapshot.size,
        totalImageTags: imageTagsSnapshot.size,
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        totalImages: 0,
        totalPrompts: 0,
        totalCategories: 0,
        totalTags: 0,
        totalImageTags: 0,
      };
    }
  }

  // 创建图片（管理员版本）
  static async createImage(
    imageData: Partial<ImageData> & { url: string; title: string }
  ): Promise<string> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();
      const imageRef = db.collection(COLLECTIONS.IMAGES).doc();

      const imageDoc: ImageDocument = {
          id: imageRef.id,
          url: imageData.url,
          title: imageData.title,
          prompts: imageData.prompts || [],
          width: 0,
          height: 0,
          fileSize: 0,
          format: 'unknown',
          colorSpace: undefined,
          hasTransparency: false,
          createdAt: now,
          updatedAt: now,
        };

      await imageRef.set(imageDoc);

      // 如果有标签数据，创建图片标签关联
      if (imageData.tags && imageData.tags.length > 0) {
        const batch = db.batch();
        imageData.tags.forEach((tag) => {
          const imageTagRef = db.collection(COLLECTIONS.IMAGE_TAGS).doc();
          batch.set(imageTagRef, {
            id: imageTagRef.id,
            imageId: imageRef.id,
            tagId: tag.id,
            createdAt: now,
          });
        });
        await batch.commit();
      }

      return imageRef.id;
    } catch (error) {
      console.error('创建图片失败:', error);
      throw new Error('创建图片失败');
    }
  }

  // 批量导入数据
  static async batchImportData(data: ExportData): Promise<{
    success: boolean;
    importedImages: number;
    importedPrompts: number;
    error?: string;
  }> {
    try {
      console.log('开始批量导入数据...');

      const { db } = await getServerFirebase();
      let importedImages = 0;
      let importedPrompts = 0;

      // 导入图片和相关数据
      for (const image of data.images) {
        const imageRef = db.collection(COLLECTIONS.IMAGES).doc();
        const imageDoc: ImageDocument = {
          id: imageRef.id,
          url: image.url,
          title: image.title,
          prompts: image.prompts || [],
          width: 0,
          height: 0,
          fileSize: 0,
          format: 'unknown',
          colorSpace: undefined,
          hasTransparency: false,
          createdAt:
            typeof image.createdAt === 'string'
              ? Timestamp.fromDate(new Date(image.createdAt))
              : Timestamp.fromDate(image.createdAt),
          updatedAt:
            typeof image.updatedAt === 'string'
              ? Timestamp.fromDate(new Date(image.updatedAt))
              : Timestamp.fromDate(image.updatedAt),
        };
        await imageRef.set(imageDoc);
        importedImages++;

        // 如果有标签数据，创建图片标签关联
        if (image.tags && image.tags.length > 0) {
          const batch = db.batch();
          image.tags.forEach((tag) => {
            const imageTagRef = db.collection(COLLECTIONS.IMAGE_TAGS).doc();
            batch.set(imageTagRef, {
              id: imageTagRef.id,
              imageId: imageRef.id,
              tagId: tag.id,
              createdAt: Timestamp.now(),
            });
          });
          await batch.commit();
        }
      }

      console.log(
        `导入完成: ${importedImages} 张图片, ${importedPrompts} 个提示词`
      );

      return {
        success: true,
        importedImages,
        importedPrompts,
      };
    } catch (error) {
      console.error('批量导入数据失败:', error);
      return {
        success: false,
        importedImages: 0,
        importedPrompts: 0,
        error: '导入数据失败',
      };
    }
  }

  // ===== 分类相关方法 =====

  // 确保默认分类存在
  static async ensureDefaultCategory(): Promise<string> {
    try {
      const { db } = await getServerFirebase();
      const DEFAULT_CATEGORY_ID = 'default';
      
      // 检查默认分类是否存在
      const defaultCategoryDoc = await db.collection(COLLECTIONS.CATEGORIES).doc(DEFAULT_CATEGORY_ID).get();
      
      if (!defaultCategoryDoc.exists) {
        // 创建默认分类
        const now = Timestamp.now();
        const defaultCategoryData = {
          id: DEFAULT_CATEGORY_ID,
          name: '默认分类',
          description: '默认标签分类',
          color: '#6b7280',
          order: 0, // 默认分类排在最前面
          tagCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        
        await db.collection(COLLECTIONS.CATEGORIES).doc(DEFAULT_CATEGORY_ID).set(defaultCategoryData);
        console.log('已创建默认分类');
      }
      
      return DEFAULT_CATEGORY_ID;
    } catch (error) {
      console.error('确保默认分类失败:', error);
      return 'default'; // 返回默认ID，即使创建失败
    }
  }

  // 确保默认标签分组存在（向后兼容）


  // 获取所有分类
  static async getAllCategories(): Promise<TagGroup[]> {
    try {
      const { db } = await getServerFirebase();
      const snapshot = await db
        .collection(COLLECTIONS.CATEGORIES)
        .orderBy('order', 'asc')
        .orderBy('name', 'asc')
        .get();

      const categories: TagGroup[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();

        // 获取该分类下的标签数量
        const tagsSnapshot = await db
          .collection(COLLECTIONS.TAGS)
          .where('categoryId', '==', doc.id)
          .get();

        categories.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          color: data.color,
          order: data.order || 0,
          tagCount: tagsSnapshot.size,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      }

      return categories;
    } catch (error) {
      console.error('获取分类失败:', error);
      return [];
    }
  }

  // 获取所有标签分组（向后兼容）
  static async getAllTagGroups(): Promise<TagGroup[]> {
    return this.getAllCategories();
  }

  // 根据ID获取分类
  static async getCategoryById(id: string): Promise<TagGroup | null> {
    try {
      const { db } = await getServerFirebase();
      const doc = await db.collection(COLLECTIONS.CATEGORIES).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }

      // 获取该分类下的标签数量
      const tagsSnapshot = await db
        .collection(COLLECTIONS.TAGS)
        .where('categoryId', '==', doc.id)
        .get();

      return {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        color: data.color || '#6b7280',
        order: data.order || 0,
        tagCount: tagsSnapshot.size,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    } catch (error) {
      console.error('获取分类失败:', error);
      return null;
    }
  }

  // 根据ID获取标签分组（向后兼容）
  static async getTagGroupById(id: string): Promise<TagGroup | null> {
    return this.getCategoryById(id);
  }

  // 创建分类
  static async createCategory(data: {
    name: string;
    description?: string;
    color?: string;
    order?: number;
  }): Promise<TagGroup> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();
      const ref = db.collection(COLLECTIONS.CATEGORIES).doc();

      const categoryDoc = {
        id: ref.id,
        name: data.name,
        description: data.description || '',
        color: data.color || '#6b7280',
        order: data.order || 0,
        tagCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await ref.set(categoryDoc);

      return {
        id: ref.id,
        name: data.name,
        description: data.description || '',
        color: data.color || '#6b7280',
        order: data.order || 0,
        tagCount: 0,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      };
    } catch (error) {
      console.error('创建分类失败:', error);
      throw new Error('创建分类失败');
    }
  }

  // 创建标签分组（向后兼容）
  static async createTagGroup(data: {
    name: string;
  }): Promise<TagGroup> {
    return this.createCategory(data);
  }

  // 更新分类
  static async updateCategory(
    id: string,
    data: { name: string; description?: string; color?: string; order?: number }
  ): Promise<TagGroup> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();

      const updateData: any = {
        name: data.name,
        updatedAt: now,
      };

      if (data.description !== undefined) updateData.description = data.description;
      if (data.color !== undefined) updateData.color = data.color;
      if (data.order !== undefined) updateData.order = data.order;

      await db.collection(COLLECTIONS.CATEGORIES).doc(id).update(updateData);

      // 获取更新后的数据
      const category = await this.getCategoryById(id);
      if (!category) {
        throw new Error('分类不存在');
      }

      return category;
    } catch (error) {
      console.error('更新分类失败:', error);
      throw new Error('更新分类失败');
    }
  }

  // 更新标签分组（向后兼容）
  static async updateTagGroup(
    id: string,
    data: { name: string }
  ): Promise<TagGroup> {
    return this.updateCategory(id, data);
  }

  // 删除分类
  static async deleteCategory(id: string): Promise<void> {
    try {
      const { db } = await getServerFirebase();
      await db.collection(COLLECTIONS.CATEGORIES).doc(id).delete();
    } catch (error) {
      console.error('删除分类失败:', error);
      throw new Error('删除分类失败');
    }
  }

  // 删除标签分组（向后兼容）
  static async deleteTagGroup(id: string): Promise<void> {
    return this.deleteCategory(id);
  }

  // ===== 标签相关方法 =====

  // 获取所有标签
  static async getAllTags(): Promise<Tag[]> {
    try {
      const { db } = await getServerFirebase();
      const snapshot = await db
        .collection(COLLECTIONS.TAGS)
        .orderBy('createdAt', 'desc')
        .get();

      // 确保默认分类存在
      const defaultCategoryId = await this.ensureDefaultCategory();

      return snapshot.docs.map((doc: any) => {
        const data = doc.data() as TagDocument;
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          categoryId: data.categoryId || defaultCategoryId, // 如果没有categoryId，使用默认分类
          usageCount: data.usageCount || 0,
          order: data.order || 0,
          createdAt: (data.createdAt?.toDate?.() || new Date()).toISOString(),
          updatedAt: (data.updatedAt?.toDate?.() || new Date()).toISOString(),
        };
      });
    } catch (error) {
      console.error('获取标签失败:', error);
      return [];
    }
  }

  // 根据分类ID获取标签
  static async getTagsByCategoryId(categoryId: string): Promise<Tag[]> {
    try {
      const { db } = await getServerFirebase();
      const snapshot = await db
        .collection(COLLECTIONS.TAGS)
        .where('categoryId', '==', categoryId)
        .orderBy('createdAt', 'desc')
        .get();

      // 确保默认分类存在
      const defaultCategoryId = await this.ensureDefaultCategory();

      return snapshot.docs.map((doc: any) => {
        const data = doc.data() as TagDocument;
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          categoryId: data.categoryId || defaultCategoryId, // 如果没有categoryId，使用默认分类
          usageCount: data.usageCount || 0,
          order: data.order || 0,
          createdAt: (data.createdAt?.toDate?.() || new Date()).toISOString(),
          updatedAt: (data.updatedAt?.toDate?.() || new Date()).toISOString(),
        };
      });
    } catch (error) {
      console.error('获取标签失败:', error);
      return [];
    }
  }



  // 创建标签
  static async createTag(data: {
    name: string;
    color: string;
    categoryId?: string;
  }): Promise<Tag> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();
      const ref = db.collection(COLLECTIONS.TAGS).doc();

      // 如果没有提供分类ID，确保默认分类存在并使用它
      const finalCategoryId = data.categoryId || await this.ensureDefaultCategory();

      const tagDoc: TagDocument = {
        id: ref.id,
        name: data.name,
        color: data.color,
        categoryId: finalCategoryId,
        usageCount: 0,
        order: 0,
        createdAt: now,
        updatedAt: now,
      };

      await ref.set(tagDoc);

      return {
        id: ref.id,
        name: data.name,
        color: data.color,
        categoryId: finalCategoryId,
        usageCount: 0,
        order: 0,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      };
    } catch (error) {
      console.error('创建标签失败:', error);
      throw new Error('创建标签失败');
    }
  }

  // 更新标签
  static async updateTag(
    id: string,
    data: { name?: string; color?: string; categoryId?: string | null }
  ): Promise<Tag> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();

      const updateData: any = {
        updatedAt: now,
      };
      
      if (data.name !== undefined && data.name !== null) updateData.name = data.name;
      if (data.color !== undefined && data.color !== null) updateData.color = data.color;
      if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId === null ? null : data.categoryId;
      }

      await db.collection(COLLECTIONS.TAGS).doc(id).update(updateData);

      // 获取更新后的数据
      const doc = await db.collection(COLLECTIONS.TAGS).doc(id).get();
      if (!doc.exists) {
        throw new Error('标签不存在');
      }

      const tagData = doc.data() as TagDocument;
      // 确保默认分类存在
      const defaultCategoryId = await this.ensureDefaultCategory();
      
      return {
        id: doc.id,
        name: tagData.name,
        color: tagData.color,
        categoryId: tagData.categoryId || defaultCategoryId, // 如果没有categoryId，使用默认分类
        usageCount: tagData.usageCount || 0,
        order: tagData.order || 0,
        createdAt: (tagData.createdAt?.toDate?.() || new Date()).toISOString(),
        updatedAt: (tagData.updatedAt?.toDate?.() || new Date()).toISOString(),
      };
    } catch (error) {
      console.error('更新标签失败:', error);
      throw new Error('更新标签失败');
    }
  }

  // 删除标签
  static async deleteTag(id: string): Promise<void> {
    try {
      const { db } = await getServerFirebase();
      await db.collection(COLLECTIONS.TAGS).doc(id).delete();
    } catch (error) {
      console.error('删除标签失败:', error);
      throw new Error('删除标签失败');
    }
  }

  // 从所有图片中移除指定标签
  static async removeTagFromAllImages(tagId: string): Promise<void> {
    try {
      const { db } = await getServerFirebase();
      
      // 删除所有与该标签相关的图片-标签关联记录
      const imageTagsSnapshot = await db
        .collection(COLLECTIONS.IMAGE_TAGS)
        .where('tagId', '==', tagId)
        .get();

      if (imageTagsSnapshot.empty) {
        return;
      }

      const batch = db.batch();

      imageTagsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('从图片中移除标签失败:', error);
      throw new Error('从图片中移除标签失败');
    }
  }
}
