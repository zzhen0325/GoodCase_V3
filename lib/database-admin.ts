import { getServerFirebase } from "./firebase-server";
import type {
  ImageData,
  ImageDocument,
  PromptDocument,
  Prompt,
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
          .where("imageId", "==", imageData.id)
          .orderBy("order")
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
            updatedAt: promptData.updatedAt,
          };
        });

        images.push({
          id: imageData.id,
          url: imageData.url,
          title: imageData.title,
          prompts,
          tagIds: imageData.tagIds || [],
          createdAt: imageData.createdAt,
          updatedAt: imageData.updatedAt,
          usageCount: imageData.usageCount,
        });
      }

      return images;
    } catch (error) {
      console.error("获取所有图片失败:", error);
      return [];
    }
  }

  // 获取所有提示词
  static async getAllPrompts(): Promise<Prompt[]> {
    try {
      const { db } = await getServerFirebase();
      const promptsSnapshot = await db
        .collection(COLLECTIONS.PROMPTS)
        .orderBy("createdAt", "desc")
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
          updatedAt: data.updatedAt,
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
        exportedAt: new Date().toISOString(),
        images,
        metadata: {
          totalImages: images.length,
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
  static async createImage(imageData: any): Promise<string> {
    try {
      const { db } = await getServerFirebase();
      const now = new Date().toISOString();
      const imageRef = db.collection(COLLECTIONS.IMAGES).doc();

      const imageDoc: ImageDocument = {
        id: imageRef.id,
        url: imageData.url,
        title: imageData.title,
        tagIds: imageData.tagIds || [],
        createdAt: now,
        updatedAt: now,
        usageCount: 0,
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
          tagIds: image.tagIds || [],
          createdAt: image.createdAt,
          updatedAt: image.updatedAt,
          usageCount: image.usageCount || 0,
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
            updatedAt: prompt.updatedAt || image.updatedAt,
          };
          await promptRef.set(promptDoc);
          importedPrompts++;
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
          .where("groupId", "==", data.id)
          .get();

        tagGroups.push({
          id: data.id,
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
        .where("groupId", "==", data.id)
        .get();

      return {
        id: data.id,
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
      const now = new Date().toISOString();
      const ref = db.collection(COLLECTIONS.TAG_GROUPS).doc();

      const tagGroupDoc: TagGroupDocument = {
        id: ref.id,
        name: data.name,
        color: data.color,
        createdAt: now,
        updatedAt: now,
      };

      await ref.set(tagGroupDoc);

      return {
        id: ref.id,
        name: data.name,
        color: data.color,
        tagCount: 0,
        createdAt: now,
        updatedAt: now,
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
      const now = new Date().toISOString();

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
          id: data.id,
          name: data.name,
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
          id: data.id,
          name: data.name,
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
    groupId: string;
  }): Promise<Tag> {
    try {
      const { db } = await getServerFirebase();
      const now = new Date().toISOString();
      const ref = db.collection(COLLECTIONS.TAGS).doc();

      const tagDoc: TagDocument = {
        id: ref.id,
        name: data.name,
        groupId: data.groupId,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await ref.set(tagDoc);

      return {
        id: ref.id,
        name: data.name,
        groupId: data.groupId,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error("创建标签失败:", error);
      throw new Error("创建标签失败");
    }
  }

  // 更新标签
  static async updateTag(
    id: string,
    data: { name: string; groupId: string },
  ): Promise<Tag> {
    try {
      const { db } = await getServerFirebase();
      const now = new Date().toISOString();

      const updateData = {
        name: data.name,
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
        id: tagData.id,
        name: tagData.name,
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
        .where("tagIds", "array-contains", tagId)
        .get();

      const batch = db.batch();

      imagesSnapshot.docs.forEach((doc: any) => {
        const imageData = doc.data() as ImageDocument;
        const updatedTagIds = imageData.tagIds.filter((id) => id !== tagId);
        batch.update(doc.ref, {
          tagIds: updatedTagIds,
          updatedAt: new Date().toISOString(),
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
          updatedAt: new Date().toISOString(),
        });
      });
    } catch (error) {
      console.error("更新标签使用次数失败:", error);
      throw new Error("更新标签使用次数失败");
    }
  }
}
