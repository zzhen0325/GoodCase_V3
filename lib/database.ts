import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ImageData,
  Tag,
  TagGroup,
  Prompt,
  DBResult,
  BatchResult,
  ImageDocument,
  TagDocument,
  TagGroupDocument,
  PromptDocument,
  Pagination,
} from "@/types";
import { generateId } from "./utils";

// 集合名称常量
const COLLECTIONS = {
  IMAGES: "images",
  TAGS: "tags",
  TAG_GROUPS: "tagGroups",
  PROMPTS: "prompts",
} as const;

// 获取数据库实例的辅助函数
function getDb() {
  if (!db) {
    throw new Error("Firebase 数据库未初始化");
  }
  return db;
}

// 服务器时间戳辅助函数
function serverTimestamp() {
  return Timestamp.now();
}

/**
 * 数据库操作类 - 优化版
 * 封装所有 Firestore 数据库操作，支持批量操作和事务
 */
export class Database {
  private static instance: Database | null = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 确保 Firebase 已初始化
      if (!db) {
        throw new Error("Firebase 数据库未初始化");
      }
      this.initialized = true;
    } catch (error) {
      console.error("数据库初始化失败:", error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // 文档转换辅助函数
  private convertImageDocument(doc: DocumentSnapshot): ImageData | null {
    if (!doc.exists()) return null;

    const data = doc.data() as any;
    return {
      id: doc.id,
      url: data.url,
      title: data.title || "",
      prompts: data.prompts || [],
      tagIds: data.tagIds || [],
      createdAt:
        data.createdAt?.toDate?.()?.toISOString() ||
        data.createdAt ||
        new Date().toISOString(),
      updatedAt:
        data.updatedAt?.toDate?.()?.toISOString() ||
        data.updatedAt ||
        new Date().toISOString(),
      usageCount: data.usageCount || 0,
    };
  }

  // 批量操作方法
  async batchUpdateImages(
    updates: Array<{ id: string; data: Partial<ImageData> }>,
  ): Promise<BatchResult> {
    await this.ensureInitialized();
    try {
      const dbInstance = getDb();
      const batch = writeBatch(dbInstance);
      const results: Array<{ id: string; success: boolean; error?: string }> =
        [];

      for (const update of updates) {
        try {
          const imageRef = doc(dbInstance, COLLECTIONS.IMAGES, update.id);
          const updateData = {
            ...update.data,
            updatedAt: serverTimestamp(),
          };
          delete updateData.id;
          delete updateData.createdAt;

          batch.update(imageRef, updateData);
          results.push({ id: update.id, success: true });
        } catch (error) {
          results.push({
            id: update.id,
            success: false,
            error: error instanceof Error ? error.message : "更新失败",
          });
        }
      }

      await batch.commit();

      return {
        success: true,
        results,
        successCount: results.filter((r) => r.success).length,
        failureCount: results.filter((r) => !r.success).length,
      };
    } catch (error) {
      console.error("批量更新失败:", error);
      return {
        success: false,
        error: "批量更新失败",
        results: [],
        successCount: 0,
        failureCount: updates.length,
      };
    }
  }

  // 分页获取图片
  async getImagesPaginated(
    pagination: Pagination,
  ): Promise<
    DBResult<{ images: ImageData[]; hasMore: boolean; lastDoc?: any }>
  > {
    await this.ensureInitialized();
    try {
      const dbInstance = getDb();
      const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);

      let q = query(
        imagesRef,
        orderBy("createdAt", "desc"),
        limit(pagination.limit || 20),
      );

      if (pagination.startAfter) {
        q = query(q, startAfter(pagination.startAfter));
      }

      const snapshot = await getDocs(q);
      const images: ImageData[] = [];

      snapshot.docs.forEach((doc) => {
        const imageData = this.convertImageDocument(doc);
        if (imageData) {
          images.push(imageData);
        }
      });

      const hasMore = snapshot.docs.length === (pagination.limit || 20);
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        success: true,
        data: {
          images,
          hasMore,
          lastDoc,
        },
      };
    } catch (error) {
      console.error("分页查询图片失败:", error);
      return {
        success: false,
        error: "分页查询图片失败",
      };
    }
  }

  // 搜索图片
  async searchImages(
    searchTerm: string,
    filters?: { tagIds?: string[]; dateRange?: { start: Date; end: Date } },
  ): Promise<DBResult<ImageData[]>> {
    await this.ensureInitialized();
    try {
      const dbInstance = getDb();
      const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);

      let q = query(imagesRef, orderBy("createdAt", "desc"));

      // 添加日期范围过滤
      if (filters?.dateRange) {
        q = query(
          q,
          where("createdAt", ">=", Timestamp.fromDate(filters.dateRange.start)),
          where("createdAt", "<=", Timestamp.fromDate(filters.dateRange.end)),
        );
      }

      const snapshot = await getDocs(q);
      let images: ImageData[] = [];

      snapshot.docs.forEach((doc) => {
        const imageData = this.convertImageDocument(doc);
        if (imageData) {
          images.push(imageData);
        }
      });

      // 客户端过滤（因为 Firestore 的全文搜索限制）
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        images = images.filter(
          (image) =>
            image.title.toLowerCase().includes(term) ||
            image.prompts.some((prompt) => prompt.toLowerCase().includes(term)),
        );
      }

      // 标签过滤
      if (filters?.tagIds && filters.tagIds.length > 0) {
        images = images.filter((image) =>
          filters.tagIds!.some((tagId) => image.tagIds.includes(tagId)),
        );
      }

      return {
        success: true,
        data: images,
      };
    } catch (error) {
      console.error("搜索图片失败:", error);
      return {
        success: false,
        error: "搜索图片失败",
      };
    }
  }

  // 事务操作：增加图片使用次数
  async incrementImageUsage(imageId: string): Promise<DBResult<void>> {
    await this.ensureInitialized();
    try {
      const dbInstance = getDb();

      await runTransaction(dbInstance, async (transaction) => {
        const imageRef = doc(dbInstance, COLLECTIONS.IMAGES, imageId);
        const imageDoc = await transaction.get(imageRef);

        if (!imageDoc.exists()) {
          throw new Error("图片不存在");
        }

        const currentUsage = imageDoc.data()?.usageCount || 0;
        transaction.update(imageRef, {
          usageCount: currentUsage + 1,
          updatedAt: serverTimestamp(),
        });
      });

      return { success: true };
    } catch (error) {
      console.error("更新使用次数失败:", error);
      return {
        success: false,
        error: "更新使用次数失败",
      };
    }
  }
  // ==================== 图片相关操作 ====================

  // 订阅图片列表变化
  subscribeToImages(
    callback: (images: ImageData[]) => void,
    onError?: (error: Error) => void,
  ): () => void {
    try {
      const dbInstance = getDb();
      const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);
      const q = query(imagesRef, orderBy("createdAt", "desc"));

      return onSnapshot(
        q,
        (snapshot) => {
          const images: ImageData[] = [];
          snapshot.docs.forEach((doc) => {
            const imageData = this.convertImageDocument(doc);
            if (imageData) {
              images.push(imageData);
            }
          });
          callback(images);
        },
        (error) => {
          console.error("实时监听图片失败:", error);
          if (onError) onError(error);
        },
      );
    } catch (error) {
      console.error("订阅图片数据失败:", error);
      if (onError) onError(error as Error);
      return () => {};
    }
  }

  // 订阅单个图片变化
  subscribeToImage(
    id: string,
    callback: (image: ImageData | null) => void,
    onError?: (error: Error) => void,
  ): () => void {
    try {
      const dbInstance = getDb();
      const imageRef = doc(dbInstance, COLLECTIONS.IMAGES, id);

      return onSnapshot(
        imageRef,
        (doc) => {
          const imageData = this.convertImageDocument(doc);
          callback(imageData);
        },
        (error) => {
          console.error("实时监听单个图片失败:", error);
          if (onError) onError(error);
        },
      );
    } catch (error) {
      console.error("订阅单个图片数据失败:", error);
      if (onError) onError(error as Error);
      return () => {};
    }
  }

  // 获取所有图片
  async getAllImages(): Promise<DBResult<ImageData[]>> {
    await this.ensureInitialized();
    try {
      const dbInstance = getDb();
      const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);
      const q = query(imagesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const images: ImageData[] = [];
      snapshot.docs.forEach((doc) => {
        const imageData = this.convertImageDocument(doc);
        if (imageData) {
          images.push(imageData);
        }
      });

      return {
        success: true,
        data: images,
      };
    } catch (error) {
      console.error("获取所有图片失败:", error);
      return {
        success: false,
        error: "获取图片失败",
      };
    }
  }

  // 根据ID获取图片
  async getImageById(id: string): Promise<DBResult<ImageData | null>> {
    await this.ensureInitialized();
    try {
      const dbInstance = getDb();
      const imageRef = doc(dbInstance, COLLECTIONS.IMAGES, id);
      const imageDoc = await getDoc(imageRef);

      const imageData = this.convertImageDocument(imageDoc);

      return {
        success: true,
        data: imageData,
      };
    } catch (error) {
      console.error("获取图片失败:", error);
      return {
        success: false,
        error: "获取图片失败",
      };
    }
  }

  // 添加图片
  async addImage(
    imageData: Omit<ImageData, "id" | "createdAt" | "updatedAt">,
  ): Promise<DBResult<ImageData>> {
    await this.ensureInitialized();
    try {
      const dbInstance = getDb();
      const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);

      const docData = {
        ...imageData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(imagesRef, docData);

      // 获取刚创建的文档
      const newDoc = await getDoc(docRef);
      const newImageData = this.convertImageDocument(newDoc);

      if (!newImageData) {
        throw new Error("创建图片后无法获取数据");
      }

      return {
        success: true,
        data: newImageData,
      };
    } catch (error) {
      console.error("添加图片失败:", error);
      return {
        success: false,
        error: "添加图片失败",
      };
    }
  }

  // 更新图片
  async updateImage(
    id: string,
    updates: Partial<ImageData>,
  ): Promise<DBResult<ImageData>> {
    await this.ensureInitialized();
    try {
      const dbInstance = getDb();
      const imageRef = doc(dbInstance, COLLECTIONS.IMAGES, id);

      // 移除不应该更新的字段
      const updateData = { ...updates };
      delete updateData.id;
      delete updateData.createdAt;

      const docData = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(imageRef, docData);

      // 获取更新后的文档
      const updatedDoc = await getDoc(imageRef);
      const updatedImageData = this.convertImageDocument(updatedDoc);

      if (!updatedImageData) {
        throw new Error("更新图片后无法获取数据");
      }

      return {
        success: true,
        data: updatedImageData,
      };
    } catch (error) {
      console.error("更新图片失败:", error);
      return {
        success: false,
        error: "更新图片失败",
      };
    }
  }

  // 删除图片
  async deleteImage(id: string): Promise<DBResult<void>> {
    try {
      await this.ensureInitialized();

      const imageRef = doc(db, COLLECTIONS.IMAGES, id);
      await deleteDoc(imageRef);

      return {
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("删除图片失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "删除图片失败",
        timestamp: new Date(),
      };
    }
  }

  // 批量删除图片
  async deleteImages(ids: string[]): Promise<BatchResult> {
    try {
      await this.ensureInitialized();

      const batch = writeBatch(db);
      const results: DBResult[] = [];

      for (const id of ids) {
        const imageRef = doc(db, COLLECTIONS.IMAGES, id);
        batch.delete(imageRef);
        results.push({
          success: true,
          timestamp: new Date(),
        });
      }

      await batch.commit();

      return {
        success: ids.length,
        failed: 0,
        errors: [],
        results,
      };
    } catch (error) {
      console.error("批量删除图片失败:", error);
      const errorMessage =
        error instanceof Error ? error.message : "批量删除失败";

      return {
        success: 0,
        failed: ids.length,
        errors: [errorMessage],
        results: ids.map(() => ({
          success: false,
          error: errorMessage,
          timestamp: new Date(),
        })),
      };
    }
  }

  // ==================== 标签相关操作 ====================

  // 获取所有标签
  async getAllTags(): Promise<DBResult<Tag[]>> {
    try {
      await this.ensureInitialized();

      const tagsRef = collection(db, COLLECTIONS.TAGS);
      const q = query(tagsRef, orderBy("name"));
      const snapshot = await getDocs(q);

      const tags: Tag[] = [];
      snapshot.docs.forEach((doc) => {
        const tagData = this.convertTagDocument(doc);
        if (tagData) {
          tags.push(tagData);
        }
      });

      return {
        success: true,
        data: tags,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("获取标签失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "获取标签失败",
        timestamp: new Date(),
      };
    }
  }

  // 根据ID获取标签
  async getTagById(id: string): Promise<DBResult<Tag | null>> {
    try {
      await this.ensureInitialized();

      const tagRef = doc(db, COLLECTIONS.TAGS, id);
      const tagDoc = await getDoc(tagRef);

      const tagData = this.convertTagDocument(tagDoc);

      return {
        success: true,
        data: tagData,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("获取标签失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "获取标签失败",
        timestamp: new Date(),
      };
    }
  }

  // 添加标签
  async addTag(
    tagData: Omit<Tag, "id" | "createdAt" | "updatedAt">,
  ): Promise<DBResult<Tag>> {
    try {
      await this.ensureInitialized();

      const tagsRef = collection(db, COLLECTIONS.TAGS);

      const docData: Omit<TagDocument, "createdAt" | "updatedAt"> = {
        name: tagData.name,
        color: tagData.color,
        groupId: tagData.groupId,
        usageCount: tagData.usageCount || 0,
      };

      const docRef = await addDoc(tagsRef, {
        ...docData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const newDoc = await getDoc(docRef);
      const newTagData = this.convertTagDocument(newDoc);

      if (!newTagData) {
        throw new Error("创建标签后无法获取数据");
      }

      return {
        success: true,
        data: newTagData,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("添加标签失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "添加标签失败",
        timestamp: new Date(),
      };
    }
  }

  // 更新标签
  async updateTag(id: string, updates: Partial<Tag>): Promise<DBResult<Tag>> {
    try {
      await this.ensureInitialized();

      const tagRef = doc(db, COLLECTIONS.TAGS, id);

      const updateData: Partial<TagDocument> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.groupId !== undefined) updateData.groupId = updates.groupId;
      if (updates.usageCount !== undefined)
        updateData.usageCount = updates.usageCount;

      updateData.updatedAt = Timestamp.now();

      await updateDoc(tagRef, updateData);

      const updatedDoc = await getDoc(tagRef);
      const updatedTagData = this.convertTagDocument(updatedDoc);

      if (!updatedTagData) {
        throw new Error("更新标签后无法获取数据");
      }

      return {
        success: true,
        data: updatedTagData,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("更新标签失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "更新标签失败",
        timestamp: new Date(),
      };
    }
  }

  // 删除标签
  async deleteTag(id: string): Promise<DBResult<void>> {
    try {
      await this.ensureInitialized();

      const tagRef = doc(db, COLLECTIONS.TAGS, id);
      await deleteDoc(tagRef);

      return {
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("删除标签失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "删除标签失败",
        timestamp: new Date(),
      };
    }
  }

  // ==================== 标签分组相关操作 ====================

  // 获取所有标签分组
  async getAllTagGroups(): Promise<DBResult<TagGroup[]>> {
    try {
      await this.ensureInitialized();

      const tagGroupsRef = collection(db, COLLECTIONS.TAG_GROUPS);
      const q = query(tagGroupsRef, orderBy("name"));
      const snapshot = await getDocs(q);

      const tagGroups: TagGroup[] = [];
      snapshot.docs.forEach((doc) => {
        const tagGroupData = this.convertTagGroupDocument(doc);
        if (tagGroupData) {
          tagGroups.push(tagGroupData);
        }
      });

      return {
        success: true,
        data: tagGroups,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("获取标签分组失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "获取标签分组失败",
        timestamp: new Date(),
      };
    }
  }

  // 根据ID获取标签分组
  async getTagGroupById(id: string): Promise<DBResult<TagGroup | null>> {
    try {
      await this.ensureInitialized();

      const tagGroupRef = doc(db, COLLECTIONS.TAG_GROUPS, id);
      const tagGroupDoc = await getDoc(tagGroupRef);

      const tagGroupData = this.convertTagGroupDocument(tagGroupDoc);

      return {
        success: true,
        data: tagGroupData,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("获取标签分组失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "获取标签分组失败",
        timestamp: new Date(),
      };
    }
  }

  // 添加标签分组
  async addTagGroup(
    tagGroupData: Omit<TagGroup, "id" | "createdAt" | "updatedAt">,
  ): Promise<DBResult<TagGroup>> {
    try {
      await this.ensureInitialized();

      const tagGroupsRef = collection(db, COLLECTIONS.TAG_GROUPS);

      const docData: Omit<TagGroupDocument, "createdAt" | "updatedAt"> = {
        name: tagGroupData.name,
        color: tagGroupData.color,
        description: tagGroupData.description,
      };

      const docRef = await addDoc(tagGroupsRef, {
        ...docData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const newDoc = await getDoc(docRef);
      const newTagGroupData = this.convertTagGroupDocument(newDoc);

      if (!newTagGroupData) {
        throw new Error("创建标签分组后无法获取数据");
      }

      return {
        success: true,
        data: newTagGroupData,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("添加标签分组失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "添加标签分组失败",
        timestamp: new Date(),
      };
    }
  }

  // 更新标签分组
  async updateTagGroup(
    id: string,
    updates: Partial<TagGroup>,
  ): Promise<DBResult<TagGroup>> {
    try {
      await this.ensureInitialized();

      const tagGroupRef = doc(db, COLLECTIONS.TAG_GROUPS, id);

      const updateData: Partial<TagGroupDocument> = {};

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.color !== undefined) updateData.color = updates.color;
      if (updates.description !== undefined)
        updateData.description = updates.description;

      updateData.updatedAt = Timestamp.now();

      await updateDoc(tagGroupRef, updateData);

      const updatedDoc = await getDoc(tagGroupRef);
      const updatedTagGroupData = this.convertTagGroupDocument(updatedDoc);

      if (!updatedTagGroupData) {
        throw new Error("更新标签分组后无法获取数据");
      }

      return {
        success: true,
        data: updatedTagGroupData,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("更新标签分组失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "更新标签分组失败",
        timestamp: new Date(),
      };
    }
  }

  // 删除标签分组
  async deleteTagGroup(id: string): Promise<DBResult<void>> {
    try {
      await this.ensureInitialized();

      const tagGroupRef = doc(db, COLLECTIONS.TAG_GROUPS, id);
      await deleteDoc(tagGroupRef);

      return {
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("删除标签分组失败:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "删除标签分组失败",
        timestamp: new Date(),
      };
    }
  }

  // ==================== 辅助方法 ====================

  // 转换图片文档
  private convertImageDocument(doc: DocumentSnapshot): ImageData | null {
    if (!doc.exists()) {
      return null;
    }

    const data = doc.data() as ImageDocument;

    return {
      id: doc.id,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      title: data.title,
      description: data.description,
      tags: data.tags || [],
      prompt: data.prompt,
      size: {
        width: data.width,
        height: data.height,
        fileSize: data.fileSize,
      },
      metadata: {
        format: data.format,
        colorSpace: data.colorSpace,
        hasTransparency: data.hasTransparency,
      },
      createdAt:
        data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt:
        data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }

  // 转换标签文档
  private convertTagDocument(doc: DocumentSnapshot): Tag | null {
    if (!doc.exists()) {
      return null;
    }

    const data = doc.data() as TagDocument;

    return {
      id: doc.id,
      name: data.name,
      color: data.color,
      groupId: data.groupId,
      usageCount: data.usageCount || 0,
      createdAt:
        data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt:
        data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }

  // 转换标签分组文档
  private convertTagGroupDocument(doc: DocumentSnapshot): TagGroup | null {
    if (!doc.exists()) {
      return null;
    }

    const data = doc.data() as TagGroupDocument;

    return {
      id: doc.id,
      name: data.name,
      color: data.color,
      description: data.description,
      createdAt:
        data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt:
        data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }
}

// 注意：AdminDatabase 类已移至 API 路由中，避免在客户端引入服务端依赖
