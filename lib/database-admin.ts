import { getServerFirebase } from "./firebase-server";
import { Timestamp } from "firebase-admin/firestore";
import type {
  ImageData,
  ImageDocument,
  PromptDocument,
  PromptBlock,
  ExportData,
  TagGroup,
  TagGroupDocument,
  Tag,
  TagDocument,
} from "@/types";

// Firestore 集合名称
const COLLECTIONS = {
  IMAGES: "images",
  PROMPTS: "prompts",
  TAG_GROUPS: "tag-groups",
  TAGS: "tags",
} as const;

export class DatabaseAdmin {
  // 获取所有图片（管理员版本，无分页限制）
  static async getAllImages(): Promise<ImageData[]> {
    try {
      const { db } = await getServerFirebase();
      const imagesSnapshot = await db
        .collection(COLLECTIONS.IMAGES)
        .orderBy("createdAt", "desc")
        .get();

      const images: ImageData[] = [];

      for (const doc of imagesSnapshot.docs) {
        const imageData = doc.data() as ImageDocument;

        // 获取关联的提示词
        const promptsSnapshot = await db
          .collection(COLLECTIONS.PROMPTS)
          .where("imageId", "==", doc.id)
          .orderBy("createdAt", "asc")
          .get();

        const prompts: PromptBlock[] = promptsSnapshot.docs.map((promptDoc: any) => {
          const promptData = promptDoc.data() as PromptDocument;
          return {
            id: promptDoc.id,
            text: promptData.text || '',
            category: promptData.category,
            tags: promptData.tags || [],
            usageCount: promptData.usageCount || 0,
            isTemplate: promptData.isTemplate || false,
            color: promptData.color,
            createdAt: promptData.createdAt?.toDate?.() || new Date(),
            updatedAt: promptData.updatedAt?.toDate?.() || new Date(),
          };
        });

        images.push({
          id: doc.id,
          url: imageData.url,
          thumbnailUrl: imageData.thumbnailUrl,
          title: imageData.title,
          description: imageData.description,
          prompt: prompts.length > 0 ? prompts[0].text : '', // 保留向后兼容
          prompts: prompts, // 新增完整的提示词数组
          tags: imageData.tags || [],
          createdAt: imageData.createdAt?.toDate?.() || new Date(),
          updatedAt: imageData.updatedAt?.toDate?.() || new Date(),
          size: {
            width: imageData.width || 0,
            height: imageData.height || 0,
            fileSize: imageData.fileSize || 0,
          },
          metadata: {
            format: imageData.format || 'unknown',
            colorSpace: imageData.colorSpace,
            hasTransparency: imageData.hasTransparency,
          },
        });
      }

      return images;
    } catch (error) {
      console.error("获取所有图片失败:", error);
      return [];
    }
  }

  // 获取所有提示词
  static async getAllPrompts(): Promise<PromptBlock[]> {
    try {
      const { db } = await getServerFirebase();
      const promptsSnapshot = await db
        .collection(COLLECTIONS.PROMPTS)
        .orderBy("createdAt", "desc")
        .get();

      return promptsSnapshot.docs.map((doc: any) => {
        const data = doc.data() as PromptDocument;
        return {
          id: doc.id,
          text: data.text || '',
          category: data.category,
          tags: data.tags || [],
          usageCount: data.usageCount || 0,
          isTemplate: data.isTemplate || false,
          color: data.color,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
      });
    } catch (error) {
      console.error("获取所有提示词失败:", error);
      return [];
    }
  }

  // 导出所有数据
  static async exportAllData(): Promise<ExportData> {
    try {
      console.log("开始导出数据...");

      const [images, prompts] = await Promise.all([
        this.getAllImages(),
        this.getAllPrompts(),
      ]);

      const exportData: ExportData = {
        version: "2.0",
        exportDate: new Date(),
        images,
        tags: [],
        tagGroups: [],
        prompts,
        metadata: {
          totalImages: images.length,
          totalTags: 0,
          totalPrompts: prompts.length,
        },
      };

      console.log(
        `导出完成: ${images.length} 张图片, ${prompts.length} 个提示词`,
      );

      return exportData;
    } catch (error) {
      console.error("导出数据失败:", error);
      throw new Error("导出数据失败");
    }
  }

  // 清空所有数据（危险操作）
  static async clearAllData(): Promise<void> {
    try {
      console.log("开始清空所有数据...");

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

      console.log("所有数据已清空");
    } catch (error) {
      console.error("清空数据失败:", error);
      throw new Error("清空数据失败");
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
      console.error("获取统计信息失败:", error);
      return {
        totalImages: 0,
        totalPrompts: 0,
      };
    }
  }

  // 创建图片（管理员版本）
  static async createImage(imageData: Partial<ImageData> & { url: string; title: string }): Promise<string> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();
      const imageRef = db.collection(COLLECTIONS.IMAGES).doc();

      const imageDoc: ImageDocument = {
        id: imageRef.id,
        url: imageData.url,
        title: imageData.title,
        tags: imageData.tags || [],
        width: imageData.size?.width || 0,
        height: imageData.size?.height || 0,
        fileSize: imageData.size?.fileSize || 0,
        format: imageData.metadata?.format || 'unknown',
        createdAt: now,
        updatedAt: now,
      };

      await imageRef.set(imageDoc);

      // 创建提示词
      if (imageData.prompts && imageData.prompts.length > 0) {
        for (const prompt of imageData.prompts) {
          const promptRef = db.collection(COLLECTIONS.PROMPTS).doc();
          const promptDoc: PromptDocument = {
            id: promptRef.id,
            text: prompt.text || '',
            category: prompt.category || 'general',
            tags: prompt.tags || [],
            usageCount: prompt.usageCount || 0,
            isTemplate: prompt.isTemplate || false,
            imageId: imageRef.id, // 关联到图片ID
            createdAt: now,
            updatedAt: now,
          };
          await promptRef.set(promptDoc);
        }
      }

      // 标签现在直接存储在图片文档中

      return imageRef.id;
    } catch (error) {
      console.error("创建图片失败:", error);
      throw new Error("创建图片失败");
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
      console.log("开始批量导入数据...");

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
          tags: image.tags || [],
          width: image.size?.width || 0,
          height: image.size?.height || 0,
          fileSize: image.size?.fileSize || 0,
          format: image.metadata?.format || 'unknown',
          createdAt: typeof image.createdAt === 'string' ? Timestamp.fromDate(new Date(image.createdAt)) : image.createdAt,
          updatedAt: typeof image.updatedAt === 'string' ? Timestamp.fromDate(new Date(image.updatedAt)) : image.updatedAt,
        };
        await imageRef.set(imageDoc);
        importedImages++;

        // 导入提示词（如果存在）
        if (image.prompt) {
          const promptRef = db.collection(COLLECTIONS.PROMPTS).doc();
          const promptDoc: PromptDocument = {
            id: promptRef.id,
            text: image.prompt,
            category: 'imported',
            tags: image.tags || [],
            usageCount: 0,
            isTemplate: false,
            imageId: imageRef.id,
            createdAt: typeof image.createdAt === 'string' ? Timestamp.fromDate(new Date(image.createdAt)) : image.createdAt,
            updatedAt: typeof image.updatedAt === 'string' ? Timestamp.fromDate(new Date(image.updatedAt)) : image.updatedAt,
          };
          await promptRef.set(promptDoc);
          importedPrompts++;
        }

        // 兼容旧格式的prompts数组
        if ((image as any).prompts && Array.isArray((image as any).prompts)) {
          for (const prompt of (image as any).prompts) {
          const promptRef = db.collection(COLLECTIONS.PROMPTS).doc();
          const promptDoc: PromptDocument = {
            id: promptRef.id,
            text: prompt.text || prompt.title || prompt.content || '',
            category: prompt.category || 'imported',
            tags: prompt.tags || [],
            usageCount: prompt.usageCount || 0,
            isTemplate: prompt.isTemplate || false,
            imageId: imageRef.id,
            createdAt: typeof (prompt.createdAt || image.createdAt) === 'string' ? Timestamp.fromDate(new Date(prompt.createdAt || image.createdAt)) : (prompt.createdAt || image.createdAt),
            updatedAt: typeof (prompt.updatedAt || image.updatedAt) === 'string' ? Timestamp.fromDate(new Date(prompt.updatedAt || image.updatedAt)) : (prompt.updatedAt || image.updatedAt),
          };
          await promptRef.set(promptDoc);
          importedPrompts++;
          }
        }

        // 标签现在直接存储在图片文档中
      }

      console.log(
        `导入完成: ${importedImages} 张图片, ${importedPrompts} 个提示词`,
      );

      return {
        success: true,
        importedImages,
        importedPrompts,
      };
    } catch (error) {
      console.error("批量导入数据失败:", error);
      return {
        success: false,
        importedImages: 0,
        importedPrompts: 0,
        error: "导入数据失败",
      };
    }
  }

  // ===== 标签分组相关方法 =====

  // 获取所有标签分组
  static async getAllTagGroups(): Promise<TagGroup[]> {
    try {
      const { db } = await getServerFirebase();
      const snapshot = await db
        .collection(COLLECTIONS.TAG_GROUPS)
        .orderBy("createdAt", "desc")
        .get();

      const tagGroups: TagGroup[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data() as TagGroupDocument;

        // 获取该分组下的标签数量
        const tagsSnapshot = await db
          .collection(COLLECTIONS.TAGS)
          .where("groupId", "==", doc.id)
          .get();

        tagGroups.push({
          id: doc.id,
          name: data.name,
          color: data.color,
          tagCount: tagsSnapshot.size,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      }

      return tagGroups;
    } catch (error) {
      console.error("获取标签分组失败:", error);
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
        .where("groupId", "==", doc.id)
        .get();

      return {
        id: doc.id,
        name: data.name,
        color: data.color,
        tagCount: tagsSnapshot.size,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error("获取标签分组失败:", error);
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
        tagCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await ref.set(tagGroupDoc);

      return {
        id: ref.id,
        name: data.name,
        color: data.color,
        tagCount: 0,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      };
    } catch (error) {
      console.error("创建标签分组失败:", error);
      throw new Error("创建标签分组失败");
    }
  }

  // 更新标签分组
  static async updateTagGroup(
    id: string,
    data: { name: string; color: string },
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
        throw new Error("标签分组不存在");
      }

      return tagGroup;
    } catch (error) {
      console.error("更新标签分组失败:", error);
      throw new Error("更新标签分组失败");
    }
  }

  // 删除标签分组
  static async deleteTagGroup(id: string): Promise<void> {
    try {
      const { db } = await getServerFirebase();
      await db.collection(COLLECTIONS.TAG_GROUPS).doc(id).delete();
    } catch (error) {
      console.error("删除标签分组失败:", error);
      throw new Error("删除标签分组失败");
    }
  }

  // ===== 标签相关方法 =====

  // 获取所有标签
  static async getAllTags(): Promise<Tag[]> {
    try {
      const { db } = await getServerFirebase();
      const snapshot = await db
        .collection(COLLECTIONS.TAGS)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc: any) => {
        const data = doc.data() as TagDocument;
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          groupId: data.groupId,
          usageCount: data.usageCount,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
    } catch (error) {
      console.error("获取标签失败:", error);
      return [];
    }
  }

  // 根据分组ID获取标签
  static async getTagsByGroupId(groupId: string): Promise<Tag[]> {
    try {
      const { db } = await getServerFirebase();
      const snapshot = await db
        .collection(COLLECTIONS.TAGS)
        .where("groupId", "==", groupId)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc: any) => {
        const data = doc.data() as TagDocument;
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          groupId: data.groupId,
          usageCount: data.usageCount,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
    } catch (error) {
      console.error("获取标签失败:", error);
      return [];
    }
  }

  // 创建标签
  static async createTag(data: {
    name: string;
    color: string;
    groupId: string;
  }): Promise<Tag> {
    try {
      const { db } = await getServerFirebase();
      const now = Timestamp.now();
      const ref = db.collection(COLLECTIONS.TAGS).doc();

      const tagDoc: TagDocument = {
        id: ref.id,
        name: data.name,
        color: data.color,
        groupId: data.groupId,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await ref.set(tagDoc);

      return {
        id: ref.id,
        name: data.name,
        color: data.color,
        groupId: data.groupId,
        usageCount: 0,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      };
    } catch (error) {
      console.error("创建标签失败:", error);
      throw new Error("创建标签失败");
    }
  }

  // 更新标签
  static async updateTag(
    id: string,
    data: { name: string; color: string; groupId: string },
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
        throw new Error("标签不存在");
      }

      const tagData = doc.data() as TagDocument;
      return {
        id: doc.id,
        name: tagData.name,
        color: tagData.color,
        groupId: tagData.groupId,
        usageCount: tagData.usageCount,
        createdAt: tagData.createdAt,
        updatedAt: tagData.updatedAt,
      };
    } catch (error) {
      console.error("更新标签失败:", error);
      throw new Error("更新标签失败");
    }
  }

  // 删除标签
  static async deleteTag(id: string): Promise<void> {
    try {
      const { db } = await getServerFirebase();
      await db.collection(COLLECTIONS.TAGS).doc(id).delete();
    } catch (error) {
      console.error("删除标签失败:", error);
      throw new Error("删除标签失败");
    }
  }

  // 从所有图片中移除指定标签
  static async removeTagFromAllImages(tagId: string): Promise<void> {
    try {
      const { db } = await getServerFirebase();
      const imagesSnapshot = await db
        .collection(COLLECTIONS.IMAGES)
        .where("tags", "array-contains", tagId)
        .get();

      const batch = db.batch();

      imagesSnapshot.docs.forEach((doc: any) => {
        const imageData = doc.data() as ImageDocument;
        const updatedTags = imageData.tags.filter((id) => id !== tagId);
        batch.update(doc.ref, {
          tags: updatedTags,
          updatedAt: Timestamp.now(),
        });
      });

      await batch.commit();
    } catch (error) {
      console.error("从图片中移除标签失败:", error);
      throw new Error("从图片中移除标签失败");
    }
  }

  // 更新标签使用次数
  static async updateTagUsageCount(
    tagId: string,
    increment: number = 1,
  ): Promise<void> {
    try {
      const { db } = await getServerFirebase();
      const tagRef = db.collection(COLLECTIONS.TAGS).doc(tagId);

      await db.runTransaction(async (transaction) => {
        const tagDoc = await transaction.get(tagRef);
        if (!tagDoc.exists) {
          throw new Error("标签不存在");
        }

        const tagData = tagDoc.data() as TagDocument;
        const newUsageCount = Math.max(0, tagData.usageCount + increment);

        transaction.update(tagRef, {
          usageCount: newUsageCount,
          updatedAt: Timestamp.now(),
        });
      });
    } catch (error) {
      console.error("更新标签使用次数失败:", error);
      throw new Error("更新标签使用次数失败");
    }
  }
}
