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
  TAG_GROUPS: 'tag-groups',
  TAGS: 'tags',
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

        // 获取关联的提示词（移除排序以避免复合索引）
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

        images.push({
          id: doc.id,
          url: imageData.url,
          title: imageData.title,
          prompts: prompts,
          tags: imageData.tags || [],
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
    totalPrompts: number;
  }> {
    try {
      const { db } = await getServerFirebase();
      const [imagesSnapshot, promptsSnapshot] = await Promise.all([
        db.collection(COLLECTIONS.IMAGES).get(),
        db.collection(COLLECTIONS.PROMPTS).get(),
      ]);

      return {
        totalImages: imagesSnapshot.size,
        totalPrompts: promptsSnapshot.size,
      };
    } catch (error) {
      console.error('获取统计信息失败:', error);
      return {
        totalImages: 0,
        totalPrompts: 0,
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
          tags: imageData.tags || [],
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

      // 提示词和标签现在直接嵌套存储在图片文档中

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
      // 标签现在直接存储在图片文档中，无需单独导入

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
          tags: image.tags || [],
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

        // 提示词和标签现在直接嵌套存储在图片文档中
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

  // ===== 标签分组相关方法 =====

  // 确保默认标签分组存在
  static async ensureDefaultTagGroup(): Promise<string> {
    try {
      const { db } = await getServerFirebase();
      const DEFAULT_GROUP_ID = 'default';
      
      // 检查默认分组是否存在
      const defaultGroupDoc = await db.collection(COLLECTIONS.TAG_GROUPS).doc(DEFAULT_GROUP_ID).get();
      
      if (!defaultGroupDoc.exists) {
        // 创建默认分组
        const now = Timestamp.now();
        const defaultGroupData: TagGroupDocument = {
          id: DEFAULT_GROUP_ID,
          name: '默认分组',
          color: '#64748b',
          order: 0, // 默认分组排在最前面
          tagCount: 0,
          createdAt: now,
          updatedAt: now,
        };
        
        await db.collection(COLLECTIONS.TAG_GROUPS).doc(DEFAULT_GROUP_ID).set(defaultGroupData);
        console.log('已创建默认标签分组');
      }
      
      return DEFAULT_GROUP_ID;
    } catch (error) {
      console.error('确保默认标签分组失败:', error);
      return 'default'; // 返回默认ID，即使创建失败
    }
  }

  // 获取所有标签分组
  static async getAllTagGroups(): Promise<TagGroup[]> {
    try {
      const { db } = await getServerFirebase();
      const snapshot = await db
        .collection(COLLECTIONS.TAG_GROUPS)
        .orderBy('createdAt', 'desc')
        .get();

      const tagGroups: TagGroup[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data() as TagGroupDocument;

        // 获取该分组下的标签数量
        const tagsSnapshot = await db
          .collection(COLLECTIONS.TAGS)
          .where('groupId', '==', doc.id)
          .get();

        tagGroups.push({
          id: doc.id,
          name: data.name,
          color: data.color,
          tagCount: tagsSnapshot.size,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      }

      return tagGroups;
    } catch (error) {
      console.error('获取标签分组失败:', error);
      return [];
    }
  }

  // 根据ID获取标签分组
  static async getTagGroupById(id: string): Promise<TagGroup | null> {
    try {
      const { db } = await getServerFirebase();
      const doc = await db.collection(COLLECTIONS.TAG_GROUPS).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as TagGroupDocument;

      // 获取该分组下的标签数量
      const tagsSnapshot = await db
        .collection(COLLECTIONS.TAGS)
        .where('groupId', '==', doc.id)
        .get();

      return {
        id: doc.id,
        name: data.name,
        color: data.color,
        tagCount: tagsSnapshot.size,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };
    } catch (error) {
      console.error('获取标签分组失败:', error);
      return null;
    }
  }

  // 创建标签分组
  static async createTagGroup(data: {
    name: string;
    color: string;
  }): Promise<TagGroup> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();
      const ref = db.collection(COLLECTIONS.TAG_GROUPS).doc();

      const tagGroupDoc: TagGroupDocument = {
        id: ref.id,
        name: data.name,
        color: data.color,
        order: 0,
        tagCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await ref.set(tagGroupDoc);

      return {
        id: ref.id,
        name: data.name,
        color: data.color,
        order: 0,
        tagCount: 0,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      };
    } catch (error) {
      console.error('创建标签分组失败:', error);
      throw new Error('创建标签分组失败');
    }
  }

  // 更新标签分组
  static async updateTagGroup(
    id: string,
    data: { name: string; color: string }
  ): Promise<TagGroup> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();

      const updateData = {
        name: data.name,
        color: data.color,
        updatedAt: now,
      };

      await db.collection(COLLECTIONS.TAG_GROUPS).doc(id).update(updateData);

      // 获取更新后的数据
      const tagGroup = await this.getTagGroupById(id);
      if (!tagGroup) {
        throw new Error('标签分组不存在');
      }

      return tagGroup;
    } catch (error) {
      console.error('更新标签分组失败:', error);
      throw new Error('更新标签分组失败');
    }
  }

  // 删除标签分组
  static async deleteTagGroup(id: string): Promise<void> {
    try {
      const { db } = await getServerFirebase();
      await db.collection(COLLECTIONS.TAG_GROUPS).doc(id).delete();
    } catch (error) {
      console.error('删除标签分组失败:', error);
      throw new Error('删除标签分组失败');
    }
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

      return snapshot.docs.map((doc: any) => {
        const data = doc.data() as TagDocument;
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          groupId: data.groupId || '',
  
          createdAt: (data.createdAt?.toDate?.() || new Date()).toISOString(),
          updatedAt: (data.updatedAt?.toDate?.() || new Date()).toISOString(),
        };
      });
    } catch (error) {
      console.error('获取标签失败:', error);
      return [];
    }
  }

  // 根据分组ID获取标签
  static async getTagsByGroupId(groupId: string): Promise<Tag[]> {
    try {
      const { db } = await getServerFirebase();
      const snapshot = await db
        .collection(COLLECTIONS.TAGS)
        .where('groupId', '==', groupId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => {
        const data = doc.data() as TagDocument;
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          groupId: data.groupId || '',
  
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
    groupId?: string;
  }): Promise<Tag> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();
      const ref = db.collection(COLLECTIONS.TAGS).doc();

      // 如果没有提供分组ID，确保默认分组存在并使用它
      const finalGroupId = data.groupId || await this.ensureDefaultTagGroup();

      const tagDoc: TagDocument = {
        id: ref.id,
        name: data.name,
        color: data.color,
        groupId: finalGroupId,

        createdAt: now,
        updatedAt: now,
      };

      await ref.set(tagDoc);

      return {
        id: ref.id,
        name: data.name,
        color: data.color,
        groupId: finalGroupId,

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
    data: { name: string; color: string; groupId: string }
  ): Promise<Tag> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();

      const updateData = {
        name: data.name,
        color: data.color,
        groupId: data.groupId,
        updatedAt: now,
      };

      await db.collection(COLLECTIONS.TAGS).doc(id).update(updateData);

      // 获取更新后的数据
      const doc = await db.collection(COLLECTIONS.TAGS).doc(id).get();
      if (!doc.exists) {
        throw new Error('标签不存在');
      }

      const tagData = doc.data() as TagDocument;
      return {
        id: doc.id,
        name: tagData.name,
        color: tagData.color,
        groupId: tagData.groupId || '',

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
      const imagesSnapshot = await db
        .collection(COLLECTIONS.IMAGES)
        .where('tags', 'array-contains', tagId)
        .get();

      const batch = db.batch();

      imagesSnapshot.docs.forEach((doc: any) => {
        const imageData = doc.data() as ImageDocument;
        const updatedTags = imageData.tags.filter((tag) => tag.id !== tagId);
        batch.update(doc.ref, {
          tags: updatedTags,
          updatedAt: Timestamp.now(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('从图片中移除标签失败:', error);
      throw new Error('从图片中移除标签失败');
    }
  }
}
