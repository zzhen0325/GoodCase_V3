import { storage } from './firebase';
import { ref as storageRef, uploadString, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { ImageData, Tag, Prompt, DBResult, ExportData, ImportOptions, ImportResult } from '@/types';
import { deleteImageFromStorage } from './image-storage';
import { generateId } from './utils';



// Firebase 数据库操作类
export class Database {
  // ... (existing methods)

  static async saveImageMetadata(imageData: Omit<ImageData, 'id'>, imageId: string): Promise<void> {
    const metadataRef = storageRef(storage, `images/${imageId}.json`);
    const metadataString = JSON.stringify(imageData, null, 2);
    await uploadString(metadataRef, metadataString, 'raw', {
      contentType: 'application/json',
    });
  }

  static async updateImageMetadata(imageId: string, updates: Partial<ImageData>): Promise<void> {
    const existingMetadata = await this.getImageMetadata(imageId);
    if (!existingMetadata) {
      throw new Error('Image metadata not found');
    }
    const updatedMetadata = { ...existingMetadata, ...updates, updatedAt: new Date().toISOString() };
    await this.saveImageMetadata(updatedMetadata, imageId);
  }

  static async deleteImageMetadata(imageId: string): Promise<void> {
    const metadataRef = storageRef(storage, `images/${imageId}.json`);
    await deleteObject(metadataRef);
  }

  static async getImageMetadata(imageId: string): Promise<ImageData | null> {
    try {
      const metadataRef = storageRef(storage, `images/${imageId}.json`);
      const url = await getDownloadURL(metadataRef);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }
      const metadata = await response.json();
      return { id: imageId, ...metadata } as ImageData;
    } catch (error) {
      console.error(`Error fetching metadata for ${imageId}:`, error);
      return null;
    }
  }

  static async getAllImagesMetadata(): Promise<ImageData[]> {
    const listRef = storageRef(storage, 'images/');
    const res = await listAll(listRef);
    
    const metadataPromises = res.items
      .filter(itemRef => itemRef.name.endsWith('.json'))
      .map(async (itemRef) => {
        const imageId = itemRef.name.replace('.json', '');
        return this.getImageMetadata(imageId);
      });

    const results = await Promise.all(metadataPromises);
    return results.filter((p): p is ImageData => p !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }



  static async getTags(): Promise<Tag[]> {
    const allImages = await this.getAllImagesMetadata();
    const allTags = allImages.flatMap(image => image.tags);
    const uniqueTags = Array.from(new Map(allTags.map(tag => [tag.id, tag])).values());
    return uniqueTags;
  }

  static async getPrompts(): Promise<Prompt[]> {
    const allImages = await this.getAllImagesMetadata();
    const allPrompts = allImages.flatMap(image => image.prompts);
    const uniquePrompts = Array.from(new Map(allPrompts.map(prompt => [prompt.id, prompt])).values());
    return uniquePrompts;
  }

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

  static async deleteImage(imageId: string): Promise<void> {
    // 同时删除 Storage 中的图片文件和元数据文件
    await deleteImageFromStorage(imageId);
    await this.deleteImageMetadata(imageId);
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
}