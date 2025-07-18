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
import { ImageData, Tag, Prompt, DBResult } from '@/types';

// Firestore集合名称
const COLLECTIONS = {
  IMAGES: 'images',
  PROMPTS: 'prompts',
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

  // 获取所有标签（实时监听）- 从图片数据中提取
  subscribeToTags(
    callback: (tags: Tag[]) => void,
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
      (snapshot) => {
        const tagMap = new Map<string, Tag>();

        // 从所有图片中提取标签
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const imageTags = data.tags || [];

          imageTags.forEach((tag: Tag) => {
            if (tagMap.has(tag.name)) {
              const existingTag = tagMap.get(tag.name)!;
              existingTag.usageCount = (existingTag.usageCount || 0) + 1;
              // 保持最新的更新时间
              if (
                tag.updatedAt &&
                (!existingTag.updatedAt ||
                  tag.updatedAt > existingTag.updatedAt)
              ) {
                existingTag.updatedAt = tag.updatedAt;
              }
            } else {
              tagMap.set(tag.name, {
                ...tag,
                usageCount: 1,
              });
            }
          });
        });

        // 转换为数组并按使用次数排序
        const tags = Array.from(tagMap.values()).sort(
          (a, b) => (b.usageCount || 0) - (a.usageCount || 0)
        );

        callback(tags);
      },
      (error) => {
        console.error('标签监听错误:', error);
        if (onError) onError(error);
      }
    );
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
      };
    } catch (error) {
      console.error('添加图片失败:', error);
      return {
        success: false,
        error: '添加图片失败',
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
      };
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: '获取图片失败',
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
      };
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: '获取图片失败',
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
      };
    } catch (error) {
      console.error('更新图片失败:', error);
      return {
        success: false,
        error: '更新图片失败',
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
      };
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: '删除图片失败',
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
      };
    } catch (error) {
      console.error('批量删除图片失败:', error);
      return {
        success: false,
        error: '批量删除图片失败',
      };
    }
  }
}

// 导出单例实例
export const database = Database.getInstance();
export default database;
