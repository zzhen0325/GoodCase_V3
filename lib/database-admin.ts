import { getServerFirebase } from './firebase-server';
import type {
  ImageData,
  ImageDocument,
  PromptDocument,
  Prompt,
  Tag,
  ExportData
} from '@/types';

// Firestore 集合名称
const COLLECTIONS = {
  IMAGES: 'images',
  PROMPTS: 'prompts'
} as const;

export class DatabaseAdmin {
  // 获取所有图片（管理员版本，无分页限制）
  static async getAllImages(): Promise<ImageData[]> {
    try {
      const { db } = await getServerFirebase();
      const imagesSnapshot = await db.collection(COLLECTIONS.IMAGES)
        .orderBy('createdAt', 'desc')
        .get();
      
      const images: ImageData[] = [];
      
      for (const doc of imagesSnapshot.docs) {
        const imageData = doc.data() as ImageDocument;
        
        // 获取关联的提示词
        const promptsSnapshot = await db.collection(COLLECTIONS.PROMPTS)
          .where('imageId', '==', imageData.id)
          .orderBy('order')
          .get();
        
        const prompts: Prompt[] = promptsSnapshot.docs.map((promptDoc: any) => {
          const promptData = promptDoc.data() as PromptDocument;
          return {
            id: promptData.id,
            title: promptData.title,
            content: promptData.content,
            color: promptData.color,
            order: promptData.order,
            createdAt: promptData.createdAt,
            updatedAt: promptData.updatedAt
          };
        });
        
        // 获取标签（直接从图片文档中获取）
        const tags: Tag[] = imageData.tags || [];
        
        images.push({
          id: imageData.id,
          url: imageData.url,
          title: imageData.title,
          prompts,
          tags,
          createdAt: imageData.createdAt,
          updatedAt: imageData.updatedAt,
          usageCount: imageData.usageCount
        });
      }
      
      return images;
    } catch (error) {
      console.error('获取所有图片失败:', error);
      return [];
    }
  }

  // 获取所有标签 - 从图片数据中提取
  static async getAllTags(): Promise<Tag[]> {
    try {
      const { db } = await getServerFirebase();
      const imagesSnapshot = await db.collection(COLLECTIONS.IMAGES)
        .get();
      
      const tagMap = new Map<string, Tag>();
      
      // 从所有图片中提取标签
      imagesSnapshot.docs.forEach((doc: any) => {
        const imageData = doc.data();
        const imageTags = imageData.tags || [];
        
        imageTags.forEach((tag: Tag) => {
          if (tagMap.has(tag.name)) {
            const existingTag = tagMap.get(tag.name)!;
            existingTag.usageCount = (existingTag.usageCount || 0) + 1;
            // 保持最新的更新时间
            if (tag.updatedAt && (!existingTag.updatedAt || tag.updatedAt > existingTag.updatedAt)) {
              existingTag.updatedAt = tag.updatedAt;
            }
          } else {
            tagMap.set(tag.name, {
              ...tag,
              usageCount: 1
            });
          }
        });
      });
      
      // 转换为数组并按名称排序
      return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('获取所有标签失败:', error);
      return [];
    }
  }

  // 更新标签（在所有图片中更新）
  static async updateTag(tagId: string, updates: Partial<Tag>): Promise<Tag> {
    try {
      const { db } = await getServerFirebase();
      const batch = db.batch();
      const allImagesSnapshot = await db.collection(COLLECTIONS.IMAGES).get();
      
      let updatedTag: Tag | null = null;

      allImagesSnapshot.forEach(doc => {
        const image = doc.data() as ImageDocument;
        const tags = image.tags || [];
        let hasUpdates = false;
        
        const updatedTags = tags.map(tag => {
          if (tag.id === tagId) {
            const newTag = { ...tag, ...updates, updatedAt: new Date().toISOString() };
            updatedTag = newTag;
            hasUpdates = true;
            return newTag;
          }
          return tag;
        });

        if (hasUpdates) {
          const imageRef = db.collection(COLLECTIONS.IMAGES).doc(doc.id);
          batch.update(imageRef, { tags: updatedTags });
        }
      });

      await batch.commit();
      
      if (!updatedTag) {
        throw new Error(`标签 ${tagId} 未找到`);
      }
      
      console.log(`标签 ${tagId} 已在所有图片中更新`);
      return updatedTag;
    } catch (error) {
      console.error(`更新标签 ${tagId} 失败:`, error);
      throw new Error(`更新标签失败`);
    }
  }

  // 删除标签（从所有图片中移除）
  static async deleteTag(tagId: string): Promise<void> {
    try {
      const { db } = await getServerFirebase();
      const batch = db.batch();
      const allImagesSnapshot = await db.collection(COLLECTIONS.IMAGES).get();

      allImagesSnapshot.forEach(doc => {
        const image = doc.data() as ImageDocument;
        const initialTagsLength = image.tags?.length || 0;
        const updatedTags = image.tags?.filter(t => t.id !== tagId);

        if (updatedTags && updatedTags.length < initialTagsLength) {
          const imageRef = db.collection(COLLECTIONS.IMAGES).doc(doc.id);
          batch.update(imageRef, { tags: updatedTags });
        }
      });

      await batch.commit();
      console.log(`标签 ${tagId} 已从所有图片中移除`);
    } catch (error) {
      console.error(`删除标签 ${tagId} 失败:`, error);
      throw new Error(`删除标签失败`);
    }
  }

  // 获取所有提示词
  static async getAllPrompts(): Promise<Prompt[]> {
    try {
      const { db } = await getServerFirebase();
      const promptsSnapshot = await db.collection(COLLECTIONS.PROMPTS)
        .orderBy('createdAt', 'desc')
        .get();
      
      return promptsSnapshot.docs.map((doc: any) => {
        const data = doc.data() as PromptDocument;
        return {
          id: data.id,
          title: data.title,
          content: data.content,
          color: data.color,
          order: data.order,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
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
      
      const [images, tags, prompts] = await Promise.all([
        this.getAllImages(),
        this.getAllTags(),
        this.getAllPrompts()
      ]);
      
      const exportData: ExportData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        images,
        tags,
        metadata: {
          totalImages: images.length,
          totalTags: tags.length,
          totalPrompts: prompts.length
        }
      };
      
      console.log(`导出完成: ${images.length} 张图片, ${tags.length} 个标签, ${prompts.length} 个提示词`);
      
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
      
      // 标签现在存储在图片文档中，无需单独删除
      
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
    totalTags: number;
    totalPrompts: number;
  }> {
    try {
      const { db } = await getServerFirebase();
      const [imagesSnapshot, promptsSnapshot] = await Promise.all([
        db.collection(COLLECTIONS.IMAGES).get(),
        db.collection(COLLECTIONS.PROMPTS).get()
      ]);
      
      // 计算标签数量（从图片中提取）
      const tags = await this.getAllTags();
      
      return {
        totalImages: imagesSnapshot.size,
        totalTags: tags.length,
        totalPrompts: promptsSnapshot.size
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        totalImages: 0,
        totalTags: 0,
        totalPrompts: 0
      };
    }
  }

  // 创建图片（管理员版本）
  static async createImage(imageData: any): Promise<string> {
    try {
      const { db } = await getServerFirebase();
      const now = new Date().toISOString();
      const imageRef = db.collection(COLLECTIONS.IMAGES).doc();
      
      const imageDoc: ImageDocument = {
        id: imageRef.id,
        url: imageData.url,
        title: imageData.title,
        tags: imageData.tags || [],
        createdAt: now,
        updatedAt: now,
        usageCount: 0
      };
      
      await imageRef.set(imageDoc);
      
      // 创建提示词
      if (imageData.prompts && imageData.prompts.length > 0) {
        for (const prompt of imageData.prompts) {
          const promptRef = db.collection(COLLECTIONS.PROMPTS).doc();
          const promptDoc: PromptDocument = {
            id: promptRef.id,
            imageId: imageRef.id,
            title: prompt.title,
            content: prompt.content,
            color: prompt.color,
            order: prompt.order,
            createdAt: now,
            updatedAt: now
          };
          await promptRef.set(promptDoc);
        }
      }
      
      // 标签现在直接存储在图片文档中
      
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
    importedTags: number;
    importedPrompts: number;
    error?: string;
  }> {
    try {
      console.log('开始批量导入数据...');
      
      const { db } = await getServerFirebase();
      // 标签现在直接存储在图片文档中，无需单独导入
      
      let importedImages = 0;
      let importedPrompts = 0;
      
      // 然后导入图片和相关数据
      for (const image of data.images) {
        const imageRef = db.collection(COLLECTIONS.IMAGES).doc();
        const imageDoc: ImageDocument = {
          id: imageRef.id,
          url: image.url,
          title: image.title,
          tags: image.tags || [],
          createdAt: image.createdAt,
          updatedAt: image.updatedAt,
          usageCount: image.usageCount || 0
        };
        await imageRef.set(imageDoc);
        importedImages++;
        
        // 导入提示词
        for (const prompt of image.prompts) {
          const promptRef = db.collection(COLLECTIONS.PROMPTS).doc();
          const promptDoc: PromptDocument = {
            id: promptRef.id,
            imageId: imageRef.id,
            title: prompt.title,
            content: prompt.content,
            color: prompt.color,
            order: prompt.order,
            createdAt: prompt.createdAt || image.createdAt,
            updatedAt: prompt.updatedAt || image.updatedAt
          };
          await promptRef.set(promptDoc);
          importedPrompts++;
        }
        
        // 标签现在直接存储在图片文档中
      }
      
      console.log(`导入完成: ${importedImages} 张图片, ${data.tags.length} 个标签, ${importedPrompts} 个提示词`);
      
      return {
        success: true,
        importedImages,
        importedTags: data.tags.length,
        importedPrompts
      };
    } catch (error) {
      console.error('批量导入数据失败:', error);
      return {
        success: false,
        importedImages: 0,
        importedTags: 0,
        importedPrompts: 0,
        error: '导入数据失败'
      };
    }
  }
}