import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase';
import { ImageData, Tag, TagGroup, Prompt, DBResult } from '@/types';

// Firestore集合名称
const COLLECTIONS = {
  IMAGES: 'images',
  PROMPTS: 'prompts',
  CATEGORIES: 'categories', // 原 TAG_GROUPS
  TAGS: 'tags',
  IMAGE_TAGS: 'image-tags', // 新增：图片标签关联表
  // 保持向后兼容
  TAG_GROUPS: 'categories',
} as const;

// 客户端数据库操作类
export class Database {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // 获取所有图片（实时监听）
  subscribeToImages(
    callback: (images: ImageData[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const dbInstance = getDb();
    if (!dbInstance) {
      onError?.(new Error('Firestore 未初始化'));
      return () => {};
    }
    const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);
    const q = query(imagesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      async (snapshot) => {
        const images: ImageData[] = [];

        for (const docSnap of snapshot.docs) {
          const imageData = docSnap.data();
          const image: ImageData = {
            id: docSnap.id,
            title: imageData.title,
            url: imageData.url,
            prompts: imageData.prompts || [],
            tags: imageData.tags || [],
            createdAt:
              imageData.createdAt?.toDate?.()?.toISOString() ||
              imageData.createdAt,
            updatedAt:
              imageData.updatedAt?.toDate?.()?.toISOString() ||
              imageData.updatedAt,
          };
          images.push(image);
        }

        callback(images);
      },
      (error) => {
        console.error('图片监听错误:', error);
        if (onError) onError(error);
      }
    );
  }

  // 获取所有标签（实时监听）- 从独立的tags集合获取
  subscribeToTags(
    callback: (tags: Tag[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const dbInstance = getDb();
    if (!dbInstance) {
      onError?.(new Error('Firestore 未初始化'));
      return () => {};
    }
    const tagsRef = collection(dbInstance, COLLECTIONS.TAGS);
    // 临时使用单一排序避免索引问题，等待手动创建复合索引后可恢复
    // const q = query(tagsRef, orderBy('usageCount', 'desc'), orderBy('name', 'asc'));
    const q = query(tagsRef, orderBy('name', 'asc'));

    return onSnapshot(
      q,
      async (snapshot) => {
        const tags: Tag[] = [];
        const categoryIds = new Set<string>();

        // 收集所有分类ID
        snapshot.docs.forEach((doc) => {
          const tagData = doc.data();
          if (tagData.categoryId) {
            categoryIds.add(tagData.categoryId);
          }
        });

        // 获取分类信息
        const categoryMap = new Map<string, string>();
        if (categoryIds.size > 0) {
          const categoriesRef = collection(dbInstance, COLLECTIONS.CATEGORIES);
          const categoriesQuery = query(categoriesRef, where('__name__', 'in', Array.from(categoryIds)));
          const categoriesSnapshot = await getDocs(categoriesQuery);
          
          categoriesSnapshot.docs.forEach((doc) => {
            const categoryData = doc.data();
            categoryMap.set(doc.id, categoryData.name);
          });
        }

        // 构建标签数据
        snapshot.docs.forEach((doc) => {
          const tagData = doc.data();
          const tag: Tag = {
            id: doc.id,
            name: tagData.name,
            color: tagData.color || '#3b82f6',
            categoryId: tagData.categoryId,
            usageCount: tagData.usageCount || 0,
            order: tagData.order || 0,
            createdAt: tagData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: tagData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            // 添加分类名称用于显示
            categoryName: tagData.categoryId ? categoryMap.get(tagData.categoryId) : undefined,
          };
          tags.push(tag);
        });

        callback(tags);
      },
      (error) => {
        console.error('标签监听错误:', error);
        if (onError) onError(error);
      }
    );
  }

  // 获取所有分类（实时监听）- 从独立的categories集合获取
  subscribeToTagGroups(
    callback: (tagGroups: TagGroup[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const dbInstance = getDb();
    if (!dbInstance) {
      onError?.(new Error('Firestore 未初始化'));
      return () => {};
    }
    const categoriesRef = collection(dbInstance, COLLECTIONS.CATEGORIES);
    // 临时使用单一排序避免索引问题，等待手动创建复合索引后可恢复
    // const q = query(categoriesRef, orderBy('order', 'asc'), orderBy('name', 'asc'));
    const q = query(categoriesRef, orderBy('name', 'asc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const tagGroups: TagGroup[] = snapshot.docs.map((doc) => {
          const categoryData = doc.data();
          return {
            id: doc.id,
            name: categoryData.name,
            description: categoryData.description,
            color: categoryData.color,
            order: categoryData.order || 0,
            tagCount: categoryData.tagCount || 0,
            createdAt: categoryData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: categoryData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        });

        callback(tagGroups);
      },
      (error) => {
        console.error('分类监听错误:', error);
        if (onError) onError(error);
      }
    );
  }

  // 获取分类（别名方法，保持向后兼容）
  subscribeToCategories(
    callback: (categories: TagGroup[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.subscribeToTagGroups(callback, onError);
  }

  // 监听特定图片的变化
  subscribeToImage(
    id: string,
    callback: (image: ImageData | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    const dbInstance = getDb();
    if (!dbInstance) {
      onError?.(new Error('Firestore 未初始化'));
      return () => {};
    }
    const docRef = doc(dbInstance, COLLECTIONS.IMAGES, id);

    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const image: ImageData = {
            id: docSnap.id,
            title: data.title,
            url: data.url,
            prompts: data.prompts || [],
            tags: data.tags || [],
            createdAt:
              data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          };
          callback(image);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('单个图片监听错误:', error);
        if (onError) onError(error);
      }
    );
  }

  // 添加图片到 Firestore
  async addImage(
    imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DBResult<ImageData>> {
    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }

      const imageDocRef = await addDoc(
        collection(dbInstance, COLLECTIONS.IMAGES),
        {
          ...imageData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      const newImageDoc = await getDoc(imageDocRef);
      const newImageData = {
        id: newImageDoc.id,
        ...newImageDoc.data(),
        createdAt:
          newImageDoc.data()?.createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        updatedAt:
          newImageDoc.data()?.updatedAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      } as ImageData;

      return {
        success: true,
        data: newImageData,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('添加图片失败:', error);
      return {
        success: false,
        error: '添加图片失败',
        timestamp: new Date(),
      };
    }
  }

  // 获取所有图片（一次性）
  async getAllImages(): Promise<DBResult<ImageData[]>> {
    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }

      const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);
      const q = query(imagesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const images: ImageData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          url: data.url,
          prompts: data.prompts || [],
          tags: data.tags || [],
          createdAt:
            data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt:
            data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        };
      });

      return {
        success: true,
        data: images,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: '获取图片失败',
        timestamp: new Date(),
      };
    }
  }

  // 根据ID获取单个图片
  async getImageById(id: string): Promise<DBResult<ImageData>> {
    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }

      const docRef = doc(dbInstance, COLLECTIONS.IMAGES, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: '图片不存在',
          timestamp: new Date(),
        };
      }

      const data = docSnap.data();
      const image: ImageData = {
        id: docSnap.id,
        title: data.title,
        url: data.url,
        prompts: data.prompts || [],
        tags: data.tags || [],
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };

      return {
        success: true,
        data: image,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: '获取图片失败',
        timestamp: new Date(),
      };
    }
  }

  // 更新图片
  async updateImage(
    id: string,
    updates: Partial<ImageData>
  ): Promise<DBResult<ImageData>> {
    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }

      const docRef = doc(dbInstance, COLLECTIONS.IMAGES, id);

      // 检查图片是否存在
      const originalDoc = await getDoc(docRef);
      if (!originalDoc.exists()) {
        return {
          success: false,
          error: '图片不存在',
          timestamp: new Date(),
        };
      }

      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // 移除不需要的字段
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(docRef, updateData);

      // 获取更新后的数据
      const updatedDoc = await getDoc(docRef);
      const updatedData = updatedDoc.data()!;

      const updatedImage: ImageData = {
        id: updatedDoc.id,
        title: updatedData.title,
        url: updatedData.url,
        prompts: updatedData.prompts || [],
        tags: updatedData.tags || [],
        createdAt:
          updatedData.createdAt?.toDate?.()?.toISOString() ||
          updatedData.createdAt,
        updatedAt:
          updatedData.updatedAt?.toDate?.()?.toISOString() ||
          updatedData.updatedAt,
      };

      return {
        success: true,
        data: updatedImage,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('更新图片失败:', error);
      return {
        success: false,
        error: '更新图片失败',
        timestamp: new Date(),
      };
    }
  }

  // 删除图片
  async deleteImage(id: string): Promise<DBResult<void>> {
    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }

      const docRef = doc(dbInstance, COLLECTIONS.IMAGES, id);

      // 获取图片数据以删除存储中的图片
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          error: '图片不存在',
          timestamp: new Date(),
        };
      }

      const imageData = docSnap.data();

      // 先删除Firebase Storage中的图片文件
      if (imageData.url) {
        try {
          const imageStorageModule = await import('./image-storage');
          await imageStorageModule.ImageStorageService.deleteImage(
            imageData.url
          );
        } catch (storageError) {
          console.warn(
            '删除存储中的图片失败，但继续删除数据库记录:',
            storageError
          );
          // 不阻止删除流程，即使存储删除失败也要删除数据库记录
        }
      }

      // 删除Firestore中的文档
      await deleteDoc(docRef);

      return {
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: '删除图片失败',
        timestamp: new Date(),
      };
    }
  }

  // 批量删除图片
  async deleteImages(ids: string[]): Promise<DBResult<void>> {
    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }

      const batch = writeBatch(dbInstance);

      for (const id of ids) {
        const docRef = doc(dbInstance, COLLECTIONS.IMAGES, id);
        batch.delete(docRef);
      }

      await batch.commit();

      return {
        success: true,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('批量删除图片失败:', error);
      return {
        success: false,
        error: '批量删除图片失败',
        timestamp: new Date(),
      };
    }
  }

  // 创建标签
  async createTag(data: {
    name: string;
    color: string;
    groupId?: string;
  }): Promise<DBResult<{ tag: Tag }>> {
    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }

      // 如果没有指定分类ID，使用null（未分类）
      const finalCategoryId = data.groupId || null;

      const tagRef = await addDoc(
        collection(dbInstance, COLLECTIONS.TAGS),
        {
          name: data.name,
          color: data.color,
          categoryId: finalCategoryId,
          usageCount: 0,
          order: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      const newTagDoc = await getDoc(tagRef);
      const newTagData = {
        id: newTagDoc.id,
        ...newTagDoc.data(),
        createdAt:
          newTagDoc.data()?.createdAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
        updatedAt:
          newTagDoc.data()?.updatedAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      } as Tag;

      return {
        success: true,
        data: { tag: newTagData },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('创建标签失败:', error);
      return {
        success: false,
        error: '创建标签失败',
        timestamp: new Date(),
      };
    }
  }
}

// 导出单例实例
export const database = Database.getInstance();
export default database;
