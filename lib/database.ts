import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { firestoreConnectionManager } from './firestore-connection';
import {
  ImageData,
  Tag,
  Prompt,
  DBResult,
  ExportData,
  ImportOptions,
  ImportResult,
  ImageDocument,
  PromptDocument,
  TagDocument,
  ImageTagDocument,
  COLLECTIONS
} from '@/types';
import { deleteImageFromStorage } from './image-storage';
import { generateId } from './utils';

// Firestore 数据库操作类
export class Database {
  private static instance: Database;



  // ==================== 图片操作 ====================
  
  // 保存图片元数据
  static async saveImageMetadata(imageData: Omit<ImageData, 'id'>, imageId: string): Promise<void> {
    const imageDoc: Omit<ImageDocument, 'id'> = {
      url: imageData.url,
      title: imageData.title,
      createdAt: imageData.createdAt,
      updatedAt: imageData.updatedAt,
      usageCount: imageData.usageCount || 0
    };
    
    const docRef = doc(db, COLLECTIONS.IMAGES, imageId);
    await updateDoc(docRef, imageDoc);
    
    // 保存提示词
    if (imageData.prompts && imageData.prompts.length > 0) {
      await this.savePrompts(imageId, imageData.prompts);
    }
    
    // 保存标签关联
    if (imageData.tags && imageData.tags.length > 0) {
      await this.saveImageTags(imageId, imageData.tags);
    }
  }
  
  // 创建图片记录
  static async createImage(imageData: Omit<ImageData, 'id'>): Promise<string> {
    return await firestoreConnectionManager.withRetry(async () => {
      const imageId = generateId();
      const imageDoc: ImageDocument = {
        id: imageId,
        url: imageData.url,
        title: imageData.title,
        createdAt: imageData.createdAt,
        updatedAt: imageData.updatedAt,
        usageCount: imageData.usageCount || 0
      };
      
      const docRef = doc(db, COLLECTIONS.IMAGES, imageId);
      await setDoc(docRef, imageDoc);
      
      // 保存提示词
      if (imageData.prompts && imageData.prompts.length > 0) {
        await this.savePrompts(imageId, imageData.prompts);
      }
      
      // 保存标签关联
      if (imageData.tags && imageData.tags.length > 0) {
        await this.saveImageTags(imageId, imageData.tags);
      }
      
      return imageId;
    });
  }
  
  // 更新图片元数据
  static async updateImageMetadata(imageId: string, updates: Partial<ImageData>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.IMAGES, imageId);
    const updateData: Partial<ImageDocument> = {
      updatedAt: new Date().toISOString()
    };
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.usageCount !== undefined) updateData.usageCount = updates.usageCount;
    
    await updateDoc(docRef, updateData);
    
    // 更新提示词
    if (updates.prompts !== undefined) {
      await this.updatePrompts(imageId, updates.prompts);
    }
    
    // 更新标签关联
    if (updates.tags !== undefined) {
      await this.updateImageTags(imageId, updates.tags);
    }
  }
  
  // 删除图片元数据
  static async deleteImageMetadata(imageId: string): Promise<void> {
    const batch = writeBatch(db);
    
    // 删除图片文档
    const imageRef = doc(db, COLLECTIONS.IMAGES, imageId);
    batch.delete(imageRef);
    
    // 删除相关提示词
    const promptsQuery = query(
      collection(db, COLLECTIONS.PROMPTS),
      where('imageId', '==', imageId)
    );
    const promptsSnapshot = await getDocs(promptsQuery);
    promptsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 删除相关标签关联
    const imageTagsQuery = query(
      collection(db, COLLECTIONS.IMAGE_TAGS),
      where('imageId', '==', imageId)
    );
    const imageTagsSnapshot = await getDocs(imageTagsQuery);
    imageTagsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }
  
  // 获取图片元数据
  static async getImageMetadata(imageId: string): Promise<ImageData | null> {
    try {
      const docRef = doc(db, COLLECTIONS.IMAGES, imageId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const imageDoc = docSnap.data() as ImageDocument;
      
      // 获取提示词
      const prompts = await this.getPromptsByImageId(imageId);
      
      // 获取标签
      const tags = await this.getTagsByImageId(imageId);
      
      return {
        id: imageId,
        url: imageDoc.url,
        title: imageDoc.title,
        prompts,
        tags,
        createdAt: imageDoc.createdAt,
        updatedAt: imageDoc.updatedAt,
        usageCount: imageDoc.usageCount
      };
    } catch (error) {
      console.error(`Error fetching metadata for ${imageId}:`, error);
      return null;
    }
  }
  
  // 获取所有图片元数据
  static async getAllImagesMetadata(): Promise<ImageData[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.IMAGES),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const images: ImageData[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const imageDoc = docSnap.data() as ImageDocument;
        const imageId = docSnap.id;
        
        // 获取提示词
        const prompts = await this.getPromptsByImageId(imageId);
        
        // 获取标签
        const tags = await this.getTagsByImageId(imageId);
        
        images.push({
          id: imageId,
          url: imageDoc.url,
          title: imageDoc.title,
          prompts,
          tags,
          createdAt: imageDoc.createdAt,
          updatedAt: imageDoc.updatedAt,
          usageCount: imageDoc.usageCount
        });
      }
      
      return images;
    } catch (error) {
      console.error('Error fetching all images metadata:', error);
      return [];
    }
  }
  
  // ==================== 提示词操作 ====================
  
  // 保存提示词
  static async savePrompts(imageId: string, prompts: Prompt[]): Promise<void> {
    const batch = writeBatch(db);
    
    // 先删除现有提示词
    const existingQuery = query(
      collection(db, COLLECTIONS.PROMPTS),
      where('imageId', '==', imageId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    existingSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 添加新提示词
    prompts.forEach(prompt => {
      const promptDoc: PromptDocument = {
        id: prompt.id,
        imageId,
        title: prompt.title,
        content: prompt.content,
        color: prompt.color,
        order: prompt.order,
        createdAt: prompt.createdAt || new Date().toISOString(),
        updatedAt: prompt.updatedAt || new Date().toISOString()
      };
      
      const docRef = doc(db, COLLECTIONS.PROMPTS, prompt.id);
      batch.set(docRef, promptDoc);
    });
    
    await batch.commit();
  }
  
  // 更新提示词
  static async updatePrompts(imageId: string, prompts: Prompt[]): Promise<void> {
    await this.savePrompts(imageId, prompts);
  }
  
  // 根据图片ID获取提示词
  static async getPromptsByImageId(imageId: string): Promise<Prompt[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PROMPTS),
        where('imageId', '==', imageId),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const promptDoc = doc.data() as PromptDocument;
        return {
          id: promptDoc.id,
          title: promptDoc.title,
          content: promptDoc.content,
          color: promptDoc.color,
          order: promptDoc.order,
          createdAt: promptDoc.createdAt,
          updatedAt: promptDoc.updatedAt
        };
      });
    } catch (error) {
      console.error(`Error fetching prompts for image ${imageId}:`, error);
      return [];
    }
  }
  
  // 获取所有提示词
  static async getPrompts(): Promise<Prompt[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PROMPTS),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const promptsMap = new Map<string, Prompt>();
      
      querySnapshot.docs.forEach(doc => {
        const promptDoc = doc.data() as PromptDocument;
        const prompt: Prompt = {
          id: promptDoc.id,
          title: promptDoc.title,
          content: promptDoc.content,
          color: promptDoc.color,
          order: promptDoc.order,
          createdAt: promptDoc.createdAt,
          updatedAt: promptDoc.updatedAt
        };
        
        // 去重，保留最新的
        if (!promptsMap.has(prompt.id) || 
            new Date(prompt.updatedAt || prompt.createdAt || '') > 
            new Date(promptsMap.get(prompt.id)?.updatedAt || promptsMap.get(prompt.id)?.createdAt || '')) {
          promptsMap.set(prompt.id, prompt);
        }
      });
      
      return Array.from(promptsMap.values());
    } catch (error) {
      console.error('Error fetching all prompts:', error);
      return [];
    }
  }
  
  // ==================== 标签操作 ====================
  
  // 保存图片标签关联
  static async saveImageTags(imageId: string, tags: Tag[]): Promise<void> {
    const batch = writeBatch(db);
    
    // 先删除现有关联
    const existingQuery = query(
      collection(db, COLLECTIONS.IMAGE_TAGS),
      where('imageId', '==', imageId)
    );
    const existingSnapshot = await getDocs(existingQuery);
    existingSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // 添加新关联
    for (const tag of tags) {
      // 确保标签存在
      await this.ensureTagExists(tag);
      
      const imageTagDoc: ImageTagDocument = {
        id: generateId(),
        imageId,
        tagId: tag.id,
        createdAt: new Date().toISOString()
      };
      
      const docRef = doc(db, COLLECTIONS.IMAGE_TAGS, imageTagDoc.id);
      batch.set(docRef, imageTagDoc);
    }
    
    await batch.commit();
  }
  
  // 更新图片标签关联
  static async updateImageTags(imageId: string, tags: Tag[]): Promise<void> {
    await this.saveImageTags(imageId, tags);
  }
  
  // 确保标签存在
  static async ensureTagExists(tag: Tag): Promise<void> {
    const docRef = doc(db, COLLECTIONS.TAGS, tag.id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      const tagDoc: TagDocument = {
        id: tag.id,
        name: tag.name,
        color: tag.color,
        usageCount: tag.usageCount || 0,
        createdAt: tag.createdAt || new Date().toISOString(),
        updatedAt: tag.updatedAt || new Date().toISOString()
      };
      
      await setDoc(docRef, tagDoc);
    }
  }
  
  // 根据图片ID获取标签
  static async getTagsByImageId(imageId: string): Promise<Tag[]> {
    try {
      const imageTagsQuery = query(
        collection(db, COLLECTIONS.IMAGE_TAGS),
        where('imageId', '==', imageId)
      );
      const imageTagsSnapshot = await getDocs(imageTagsQuery);
      
      const tagIds = imageTagsSnapshot.docs.map(doc => {
        const imageTagDoc = doc.data() as ImageTagDocument;
        return imageTagDoc.tagId;
      });
      
      if (tagIds.length === 0) {
        return [];
      }
      
      const tags: Tag[] = [];
      
      // 批量获取标签信息
      for (const tagId of tagIds) {
        const tagRef = doc(db, COLLECTIONS.TAGS, tagId);
        const tagSnap = await getDoc(tagRef);
        
        if (tagSnap.exists()) {
          const tagDoc = tagSnap.data() as TagDocument;
          tags.push({
            id: tagDoc.id,
            name: tagDoc.name,
            color: tagDoc.color,
            usageCount: tagDoc.usageCount,
            createdAt: tagDoc.createdAt,
            updatedAt: tagDoc.updatedAt
          });
        }
      }
      
      return tags;
    } catch (error) {
      console.error(`Error fetching tags for image ${imageId}:`, error);
      return [];
    }
  }
  
  // 获取所有标签
  static async getTags(): Promise<Tag[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.TAGS),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const tagDoc = doc.data() as TagDocument;
        return {
          id: tagDoc.id,
          name: tagDoc.name,
          color: tagDoc.color,
          usageCount: tagDoc.usageCount,
          createdAt: tagDoc.createdAt,
          updatedAt: tagDoc.updatedAt
        };
      });
    } catch (error) {
      console.error('Error fetching all tags:', error);
      return [];
    }
  }
  
  // ==================== 复合操作 ====================
  
  // 获取所有图片
  static async getAllImages(): Promise<DBResult<ImageData[]>> {
    try {
      const images = await this.getAllImagesMetadata();
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
  
  // 更新图片
  static async updateImage(id: string, updates: Partial<ImageData>): Promise<DBResult<ImageData>> {
    try {
      await this.updateImageMetadata(id, updates);
      const updatedImage = await this.getImageMetadata(id);
      if (!updatedImage) {
        return { success: false, error: 'Image not found after update' };
      }
      return { success: true, data: updatedImage };
    } catch (error) {
      console.error('Failed to update image metadata:', error);
      return { success: false, error: 'Failed to update image metadata' };
    }
  }
  
  // 添加图片
  static async addImage(imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBResult<ImageData>> {
    try {
      const now = new Date().toISOString();
      const fullImageData: Omit<ImageData, 'id'> = {
        ...imageData,
        createdAt: now,
        updatedAt: now,
        usageCount: 0
      };
      
      const imageId = await this.createImage(fullImageData);
      const createdImage = await this.getImageMetadata(imageId);
      
      if (!createdImage) {
        return { success: false, error: 'Failed to create image' };
      }
      
      return { success: true, data: createdImage };
    } catch (error) {
      console.error('Failed to add image:', error);
      return { success: false, error: 'Failed to add image' };
    }
  }
  
  // 删除图片
  static async deleteImage(imageId: string): Promise<DBResult<void>> {
    try {
      // 同时删除 Storage 中的图片文件和 Firestore 中的元数据
      await deleteImageFromStorage(imageId);
      await this.deleteImageMetadata(imageId);
      return { success: true, data: undefined };
    } catch (error) {
      console.error('Failed to delete image:', error);
      return { success: false, error: 'Failed to delete image' };
    }
  }
  
  // 导出所有数据
  static async exportAllData(): Promise<DBResult<ExportData>> {
    try {
      // 获取所有图片数据
      const imagesResult = await this.getAllImages();
      if (!imagesResult.success) {
        return {
          success: false,
          error: imagesResult.error,
        };
      }
      
      // 获取所有标签数据
      const tags = await this.getTags();
      
      const images = imagesResult.data || [];
      
      // 计算总的提示词数量
      const totalPrompts = images.reduce((sum, image) => sum + (image.prompts?.length || 0), 0);
      
      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        images,
        tags,
        metadata: {
          totalImages: images.length,
          totalTags: tags.length,
          totalPrompts,
        },
      };
      
      return {
        success: true,
        data: exportData,
      };
    } catch (error) {
      console.error('导出数据失败:', error);
      return {
        success: false,
        error: '导出数据失败',
      };
    }
  }
  
  // 导入数据
  static async importData(data: ExportData, options: ImportOptions): Promise<DBResult<ImportResult>> {
    try {
      const result: ImportResult = {
        importedImages: 0,
        importedTags: 0,
        importedPrompts: 0,
        skippedImages: 0,
        errors: []
      };
      
      const batch = writeBatch(db);
      let batchCount = 0;
      const BATCH_SIZE = 500; // Firestore批处理限制
      
      // 如果是替换模式，先清空现有数据
      if (options.mode === 'replace') {
        // 清空所有集合
        const collections = [COLLECTIONS.IMAGES, COLLECTIONS.PROMPTS, COLLECTIONS.TAGS, COLLECTIONS.IMAGE_TAGS];
        
        for (const collectionName of collections) {
          const q = query(collection(db, collectionName));
          const snapshot = await getDocs(q);
          
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
            batchCount++;
            
            if (batchCount >= BATCH_SIZE) {
              // 执行当前批次并重置
              batch.commit();
              batchCount = 0;
            }
          });
        }
        
        if (batchCount > 0) {
          await batch.commit();
          batchCount = 0;
        }
      }
      
      // 导入标签
      for (const tag of data.tags) {
        try {
          const tagId = options.preserveIds ? tag.id : generateId();
          
          // 检查是否跳过重复项
          if (options.skipDuplicates && options.mode === 'merge') {
            const existingTag = await getDoc(doc(db, COLLECTIONS.TAGS, tagId));
            if (existingTag.exists()) {
              continue;
            }
          }
          
          const tagDoc: TagDocument = {
            id: tagId,
            name: tag.name,
            color: tag.color,
            usageCount: tag.usageCount || 0,
            createdAt: tag.createdAt || new Date().toISOString(),
            updatedAt: tag.updatedAt || new Date().toISOString()
          };
          
          const tagRef = doc(db, COLLECTIONS.TAGS, tagId);
          batch.set(tagRef, tagDoc);
          batchCount++;
          result.importedTags++;
          
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            batchCount = 0;
          }
        } catch (error) {
          result.errors.push(`导入标签失败: ${tag.name} - ${error}`);
        }
      }
      
      // 导入图片和相关数据
      for (const image of data.images) {
        try {
          const imageId = options.preserveIds ? image.id : generateId();
          
          // 检查是否跳过重复项
          if (options.skipDuplicates && options.mode === 'merge') {
            const existingImage = await getDoc(doc(db, COLLECTIONS.IMAGES, imageId));
            if (existingImage.exists()) {
              result.skippedImages++;
              continue;
            }
          }
          
          // 创建图片文档
          const imageDoc: ImageDocument = {
            id: imageId,
            url: image.url,
            title: image.title,
            createdAt: image.createdAt,
            updatedAt: image.updatedAt,
            usageCount: image.usageCount || 0
          };
          
          const imageRef = doc(db, COLLECTIONS.IMAGES, imageId);
          batch.set(imageRef, imageDoc);
          batchCount++;
          result.importedImages++;
          
          // 导入提示词
          if (image.prompts && image.prompts.length > 0) {
            for (const prompt of image.prompts) {
              const promptId = options.preserveIds ? prompt.id : generateId();
              
              const promptDoc: PromptDocument = {
                id: promptId,
                imageId,
                title: prompt.title,
                content: prompt.content,
                color: prompt.color,
                order: prompt.order,
                createdAt: prompt.createdAt || new Date().toISOString(),
                updatedAt: prompt.updatedAt || new Date().toISOString()
              };
              
              const promptRef = doc(db, COLLECTIONS.PROMPTS, promptId);
              batch.set(promptRef, promptDoc);
              batchCount++;
              result.importedPrompts++;
              
              if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                batchCount = 0;
              }
            }
          }
          
          // 导入图片标签关联
          if (image.tags && image.tags.length > 0) {
            for (const tag of image.tags) {
              const imageTagId = generateId();
              const tagId = options.preserveIds ? tag.id : 
                // 如果不保留ID，需要根据标签名称查找新的标签ID
                (await this.findTagByName(tag.name))?.id || tag.id;
              
              const imageTagDoc: ImageTagDocument = {
                id: imageTagId,
                imageId,
                tagId,
                createdAt: new Date().toISOString()
              };
              
              const imageTagRef = doc(db, COLLECTIONS.IMAGE_TAGS, imageTagId);
              batch.set(imageTagRef, imageTagDoc);
              batchCount++;
              
              if (batchCount >= BATCH_SIZE) {
                await batch.commit();
                batchCount = 0;
              }
            }
          }
          
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            batchCount = 0;
          }
        } catch (error) {
          result.errors.push(`导入图片失败: ${image.title} - ${error}`);
          result.skippedImages++;
        }
      }
      
      // 提交剩余的批次
      if (batchCount > 0) {
        await batch.commit();
      }
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('导入数据失败:', error);
      return {
        success: false,
        error: '导入数据失败'
      };
    }
  }
  
  // 根据名称查找标签
  private static async findTagByName(name: string): Promise<Tag | null> {
    try {
      const q = query(
        collection(db, COLLECTIONS.TAGS),
        where('name', '==', name)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const tagDoc = querySnapshot.docs[0].data() as TagDocument;
      return {
        id: tagDoc.id,
        name: tagDoc.name,
        color: tagDoc.color,
        usageCount: tagDoc.usageCount,
        createdAt: tagDoc.createdAt,
        updatedAt: tagDoc.updatedAt
      };
    } catch (error) {
      console.error('查找标签失败:', error);
      return null;
    }
  }
}