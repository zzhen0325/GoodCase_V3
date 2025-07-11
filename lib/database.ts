import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  orderBy, 
  where, 
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase-client';
import { ImageData, Tag, Prompt, DBResult } from '@/types';

// Firestore集合名称
const COLLECTIONS = {
  IMAGES: 'images',
  PROMPTS: 'prompts'
} as const;

// 客户端数据库操作类
export class Database {
  // 获取所有图片（实时监听）
  static subscribeToImages(callback: (images: ImageData[]) => void, onError?: (error: Error) => void): () => void {
    const dbInstance = db;
    if (!dbInstance) {
      onError?.(new Error('Firestore 未初始化'));
      return () => {};
    }
    const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);
    const q = query(imagesRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, 
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
            createdAt: imageData.createdAt?.toDate?.()?.toISOString() || imageData.createdAt,
            updatedAt: imageData.updatedAt?.toDate?.()?.toISOString() || imageData.updatedAt
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
  static subscribeToTags(callback: (tags: Tag[]) => void, onError?: (error: Error) => void): () => void {
    const dbInstance = db;
    if (!dbInstance) {
      onError?.(new Error('Firestore 未初始化'));
      return () => {};
    }
    const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);
    const q = query(imagesRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q,
      (snapshot) => {
        const tagMap = new Map<string, Tag>();
        
        // 从所有图片中提取标签
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const imageTags = data.tags || [];
          
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
        
        // 转换为数组并按使用次数排序
        const tags = Array.from(tagMap.values()).sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        
        callback(tags);
      },
      (error) => {
        console.error('标签监听错误:', error);
        if (onError) onError(error);
      }
    );
  }

  // 监听特定图片的变化
  static subscribeToImage(id: string, callback: (image: ImageData | null) => void, onError?: (error: Error) => void): () => void {
    const dbInstance = db;
    if (!dbInstance) {
      onError?.(new Error('Firestore 未初始化'));
      return () => {};
    }
    const docRef = doc(dbInstance, COLLECTIONS.IMAGES, id);
    
    return onSnapshot(docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const image: ImageData = {
            id: docSnap.id,
            title: data.title,
            url: data.url,
            prompts: data.prompts || [],
            tags: data.tags || [],
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
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

  // 注意：搜索功能已移至前端实现，使用 filterImages 函数
  
  // 添加图片到 Firestore
  static async addImage(imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'> & { prompt_blocks?: any[] }): Promise<DBResult<ImageData>> {
    try {
      const { prompt_blocks, ...mainImageData } = imageData;

      const dbInstance = db;
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }
      
      const imageDocRef = await addDoc(collection(dbInstance, COLLECTIONS.IMAGES), {
        ...mainImageData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        is_valid: true, // 标记为已验证
      });

      // 如果有 prompt_blocks，批量添加到子集合
      if (prompt_blocks && prompt_blocks.length > 0) {
        const batch = writeBatch(dbInstance);
        const promptsRef = collection(dbInstance, COLLECTIONS.IMAGES, imageDocRef.id, 'prompt_blocks');
        
        prompt_blocks.forEach(block => {
          const newPromptRef = doc(promptsRef);
          batch.set(newPromptRef, {
            ...block,
            create_time: serverTimestamp(),
            update_time: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      const newImageDoc = await getDoc(imageDocRef);
      const newImageData = {
        id: newImageDoc.id,
        ...newImageDoc.data(),
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
  static async getAllImages(): Promise<DBResult<ImageData[]>> {
    try {
      const dbInstance = db;
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }
      
      const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);
      const q = query(imagesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const images: ImageData[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          url: data.url,
          prompts: data.prompts || [],
          tags: data.tags || [],
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
      });
      
      return {
        success: true,
        data: images
      };
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: '获取图片失败'
      };
    }
  }
  
  // 根据ID获取单个图片
  static async getImageById(id: string): Promise<DBResult<ImageData>> {
    try {
      const dbInstance = db;
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }
      
      const docRef = doc(dbInstance, COLLECTIONS.IMAGES, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          error: '图片不存在'
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
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
      
      return {
        success: true,
        data: image
      };
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: '获取图片失败'
      };
    }
  }
  

  
  // 更新图片
  static async updateImage(id: string, updates: Partial<ImageData>): Promise<DBResult<ImageData>> {
    try {
      const dbInstance = db;
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }
      
      const docRef = doc(dbInstance, COLLECTIONS.IMAGES, id);
      
      // 获取原始数据以比较标签变化
      const originalDoc = await getDoc(docRef);
      if (!originalDoc.exists()) {
        return {
          success: false,
          error: '图片不存在'
        };
      }
      
      const originalData = originalDoc.data();
      const originalTags = originalData.tags || [];
      const newTags = updates.tags || originalTags;
      
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
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
        createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || updatedData.createdAt,
        updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || updatedData.updatedAt
      };
      
      return {
        success: true,
        data: updatedImage
      };
    } catch (error) {
      console.error('更新图片失败:', error);
      return {
        success: false,
        error: '更新图片失败'
      };
    }
  }
  
  // 删除图片
  static async deleteImage(id: string): Promise<DBResult<void>> {
    try {
      const dbInstance = db;
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }
      
      const docRef = doc(dbInstance, COLLECTIONS.IMAGES, id);
      
      // 获取图片数据以删除存储中的图片和更新标签
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          success: false,
          error: '图片不存在'
        };
      }
      
      const imageData = docSnap.data();
      
      // 删除Firestore中的文档
      await deleteDoc(docRef);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: '删除图片失败'
      };
    }
  }
  
  // 获取所有标签 - 从图片数据中提取
  static async getAllTags(): Promise<DBResult<Tag[]>> {
    try {
      const dbInstance = db;
      if (!dbInstance) {
        throw new Error('Firestore 未初始化');
      }
      
      const imagesRef = collection(dbInstance, COLLECTIONS.IMAGES);
      const q = query(imagesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const tagMap = new Map<string, Tag>();
      
      // 从所有图片中提取标签
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const imageTags = data.tags || [];
        
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
      
      // 转换为数组并按使用次数排序
      const tags = Array.from(tagMap.values()).sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      
      return {
        success: true,
        data: tags
      };
    } catch (error) {
      console.error('获取标签失败:', error);
      return {
        success: false,
        error: '获取标签失败'
      };
    }
  }

  // 创建新标签对象
  static async addTag(tagData: Omit<Tag, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<DBResult<Tag>> {
    try {
      // 检查标签是否已存在（从现有图片中查找）
      const existingTags = await this.getAllTags();
      if (existingTags.success && existingTags.data && existingTags.data.some(tag => tag.name === tagData.name)) {
        return { success: false, error: `标签 "${tagData.name}" 已存在` };
      }

      // 创建新标签对象（不保存到独立集合）
      const createdTag: Tag = {
        id: tagData.name,
        ...tagData,
        usageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: createdTag,
      };
    } catch (error) {
      console.error('创建标签失败:', error);
      return { success: false, error: '创建标签失败' };
    }
  }
  
  // 注意：搜索功能已移至前端实现，使用 filterImages 函数
  
  // 标签使用次数现在通过图片数据自动计算，无需单独更新
}

// 注意：AdminDatabase 类已移至 API 路由中，避免在客户端引入服务端依赖