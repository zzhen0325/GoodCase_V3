// lib/indexed-db.ts
import {
  ImageData,
  Tag,
  TagCategory,
  PromptBlock,
  DEFAULT_PROMPT_BLOCKS,
} from '@/types';
import { VersionManager } from '@/lib/version-manager';

const DB_NAME = 'ImageGalleryDB';
const DB_VERSION = 6;
const STORES = {
  IMAGES: 'images',
  PROMPT_BLOCKS: 'prompt_blocks',
  IMAGE_CACHE: 'image_cache',
} as const;

interface CachedImageData {
  id: string;
  blob: Blob;
  extension: string;
  cachedAt: string;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private isClient: boolean;

  constructor() {
    this.isClient =
      typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
    if (this.isClient) {
      this.init();
    }
  }

  private init(): Promise<void> {
    if (!this.isClient) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = (event as any).oldVersion;
        const newVersion = (event as any).newVersion;
        
        console.log(`IndexedDB 版本升级: ${oldVersion} -> ${newVersion}`);

        // 版本6的升级逻辑
        if (oldVersion < 6) {
          // 检查版本兼容性
          const compatibility = VersionManager.checkCompatibility(oldVersion);
          console.log(`版本兼容性检查: ${compatibility.message}`);
          
          // 删除所有现有存储以重新创建（保持向后兼容）
          Object.values(STORES).forEach((storeName) => {
            if (db.objectStoreNames.contains(storeName)) {
              db.deleteObjectStore(storeName);
            }
          });

          // 重新创建所有存储和索引
          Object.values(STORES).forEach((storeName) => {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });

            // 为不同存储创建索引
            switch (storeName) {
              case STORES.IMAGES:
                store.createIndex('sortOrder', 'sortOrder');
                store.createIndex('createdAt', 'createdAt');
                store.createIndex('tags', 'tags', { multiEntry: true });
                store.createIndex('updatedAt', 'updatedAt');
                break;
              case STORES.PROMPT_BLOCKS:
                store.createIndex('imageId', 'imageId');
                store.createIndex('sortOrder', 'sortOrder');
                break;
            }
          });
          
          // 记录版本升级日志
          VersionManager.logVersionUpgrade(oldVersion, 6);
          console.log('IndexedDB schema 已升级到版本 6');
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error(
          'IndexedDB error:',
          (event.target as IDBOpenDBRequest).error
        );
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isClient) {
      throw new Error('IndexedDB is not available in server environment');
    }
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // 图片操作
  public async addImage(image: ImageData): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping addImage');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction(
      [STORES.IMAGES, STORES.PROMPT_BLOCKS],
      'readwrite'
    );
    const imageStore = transaction.objectStore(STORES.IMAGES);
    const promptStore = transaction.objectStore(STORES.PROMPT_BLOCKS);

    // 确保图片有sortOrder
    if ((image as any).order === undefined) {
      const maxSortOrder = await this.getMaxSortOrder(STORES.IMAGES);
      (image as any).order = maxSortOrder + 1;
    }

    // 添加图片
    imageStore.put(image);

    // 创建默认提示词块
    if (!image.promptBlocks || image.promptBlocks.length === 0) {
      const defaultPrompts: PromptBlock[] = DEFAULT_PROMPT_BLOCKS.map((template, index) => ({
        id: `${image.id}_prompt_${index}`,
        content: template.content,
        color: 'pink' as const,
        order: index
      }));

      defaultPrompts.forEach((prompt) => promptStore.put(prompt));
      image.promptBlocks = defaultPrompts;
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async getImages(): Promise<ImageData[]> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, returning empty array');
      return [];
    }

    const db = await this.getDB();
    const transaction = db.transaction(
      [STORES.IMAGES, STORES.PROMPT_BLOCKS],
      'readonly'
    );
    const imageStore = transaction.objectStore(STORES.IMAGES);
    const promptStore = transaction.objectStore(STORES.PROMPT_BLOCKS);

    const images = await new Promise<ImageData[]>((resolve, reject) => {
      const request = imageStore.index('sortOrder').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // 为每个图片加载提示词块
    for (const image of images) {
      const promptBlocks = await new Promise<PromptBlock[]>((resolve, reject) => {
        const request = promptStore.index('imageId').getAll(image.id);
        request.onsuccess = () => {
          const result = request.result.sort(
            (a, b) => a.sortOrder - b.sortOrder
          );
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
      image.promptBlocks = promptBlocks.map(prompt => ({
        id: prompt.id,
        content: prompt.content || '',
        color: prompt.color,
        
        order: prompt.order || 0,
        
        
      }));
    }

    return images.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  }

  public async getImageById(id: string): Promise<ImageData | null> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, returning null');
      return null;
    }

    const db = await this.getDB();
    const transaction = db.transaction(
      [STORES.IMAGES, STORES.PROMPT_BLOCKS],
      'readonly'
    );
    const imageStore = transaction.objectStore(STORES.IMAGES);
    const promptStore = transaction.objectStore(STORES.PROMPT_BLOCKS);

    const image = await new Promise<ImageData | null>((resolve, reject) => {
      const request = imageStore.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (image) {
      const promptBlocks = await new Promise<PromptBlock[]>((resolve, reject) => {
        const request = promptStore.index('imageId').getAll(id);
        request.onsuccess = () => {
          const result = request.result.sort(
            (a, b) => a.sortOrder - b.sortOrder
          );
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
      image.promptBlocks = promptBlocks.map(prompt => ({
        id: prompt.id,
        content: prompt.content || '',
        color: prompt.color,
        
        order: prompt.order || 0,
        
        
      }));
    }

    return image;
  }

  public async deleteImage(id: string): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping deleteImage');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction(
      [STORES.IMAGES, STORES.PROMPT_BLOCKS, STORES.IMAGE_CACHE],
      'readwrite'
    );
    const imageStore = transaction.objectStore(STORES.IMAGES);
    const promptStore = transaction.objectStore(STORES.PROMPT_BLOCKS);
    const cacheStore = transaction.objectStore(STORES.IMAGE_CACHE);

    // 删除图片
    imageStore.delete(id);

    // 删除关联的提示词块
    const promptRequest = promptStore.index('imageId').getAll(id);
    promptRequest.onsuccess = () => {
      promptRequest.result.forEach((promptBlock) => {
        promptStore.delete(promptBlock.id);
      });
    };

    // 删除缓存的图片
    cacheStore.delete(id);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }



  // 缓存图片blob数据
  public async cacheImageBlob(
    id: string,
    blob: Blob,
    extension: string
  ): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping cacheImageBlob');
      return;
    }

    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORES.IMAGE_CACHE], 'readwrite');
      const store = transaction.objectStore(STORES.IMAGE_CACHE);

      const cacheData: CachedImageData = {
        id,
        blob,
        extension,
        cachedAt: new Date().toISOString(),
      };

      store.put(cacheData);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to cache image blob:', error);
    }
  }

  // 获取缓存的图片blob数据
  public async getCachedImageBlob(id: string): Promise<CachedImageData | null> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, returning null');
      return null;
    }

    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORES.IMAGE_CACHE], 'readonly');
      const store = transaction.objectStore(STORES.IMAGE_CACHE);
      const request = store.get(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get cached image blob:', error);
      return null;
    }
  }

  // 提示词块操作
  public async addPromptBlock(promptBlock: PromptBlock): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping addPromptBlock');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.PROMPT_BLOCKS], 'readwrite');
    const store = transaction.objectStore(STORES.PROMPT_BLOCKS);

    // 确保提示词块有sortOrder
    if (promptBlock.order === undefined) {
      const maxSortOrder = await this.getMaxSortOrderForImage(
        promptBlock.id || ''
      );
      promptBlock.order = maxSortOrder + 1;
    }

    store.put(promptBlock);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async getPromptBlocks(imageId: string): Promise<PromptBlock[]> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, returning empty array');
      return [];
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.PROMPT_BLOCKS], 'readonly');
    const store = transaction.objectStore(STORES.PROMPT_BLOCKS);

    return new Promise((resolve, reject) => {
      const request = store.index('imageId').getAll(imageId);
      request.onsuccess = () => {
        const result = request.result.sort((a, b) => a.sortOrder - b.sortOrder);
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async updatePromptBlock(promptBlock: PromptBlock): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping updatePromptBlock');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.PROMPT_BLOCKS], 'readwrite');
    const store = transaction.objectStore(STORES.PROMPT_BLOCKS);

    promptBlock.id = new Date().toISOString();
    store.put(promptBlock);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async deletePromptBlock(id: string): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping deletePromptBlock');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.PROMPT_BLOCKS], 'readwrite');
    const store = transaction.objectStore(STORES.PROMPT_BLOCKS);

    store.delete(id);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 辅助方法
  private async getMaxSortOrder(storeName: string): Promise<number> {
    if (!this.isClient) return 0;

    const db = await this.getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result;
        const maxOrder = items.reduce((max: number, item: any) => {
          return Math.max(max, item.sortOrder || item.order || 0);
        }, 0);
        resolve(maxOrder);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 获取提示词方法（兼容旧接口）
  public async getPrompts(imageId: string): Promise<any[]> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, returning empty array');
      return [];
    }

    const promptBlocks = await this.getPromptBlocks(imageId);
    // 转换PromptBlock为Prompt格式
    const prompts = promptBlocks.map(block => ({
      id: block.id,
      content: block.content || '',
      color: block.color || '#3b82f6',
      order: block.order || 0,
      
      
    }));
    return prompts;
  }

  // 添加提示词方法（兼容旧接口）
  public async addPrompt(imageId: string, prompt: any): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping addPrompt');
      return;
    }

    const maxSortOrder = await this.getMaxSortOrderForImage(imageId);
    
    const promptBlock: PromptBlock = {
      id: `${imageId}_prompt_${Date.now()}`,
      content: prompt.content || '',
      color: 'pink' as const,
      order: prompt.order !== undefined ? prompt.order : maxSortOrder + 1,
      
    };

    await this.addPromptBlock(promptBlock);
  }

  // 更新提示词方法（兼容旧接口）
  public async updatePrompt(prompt: any): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping updatePrompt');
      return;
    }

    const promptBlock: PromptBlock = {
      id: prompt.id,
      content: prompt.content || '',
      color: 'pink' as const,
      order: prompt.order || 0
    };

    await this.updatePromptBlock(promptBlock);
  }

  // 删除提示词方法（兼容旧接口）
  public async deletePrompt(id: string): Promise<void> {
    await this.deletePromptBlock(id);
  }

  private async getMaxSortOrderForImage(imageId: string): Promise<number> {
    if (!this.isClient) return 0;

    const db = await this.getDB();
    const transaction = db.transaction([STORES.PROMPT_BLOCKS], 'readonly');
    const store = transaction.objectStore(STORES.PROMPT_BLOCKS);

    return new Promise((resolve, reject) => {
      const request = store.index('imageId').getAll(imageId);
      request.onsuccess = () => {
        const promptBlocks = request.result;
        const maxOrder = promptBlocks.reduce((max, promptBlock) => {
          return Math.max(max, promptBlock.order || 0);
        }, 0);
        resolve(maxOrder);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 统计方法

  public async getImageCountByTag(tagName: string): Promise<number> {
    if (!this.isClient) return 0;

    const db = await this.getDB();
    const transaction = db.transaction([STORES.IMAGES], 'readonly');
    const store = transaction.objectStore(STORES.IMAGES);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const images = request.result;
        const count = images.filter(
          (image) => image.tags && image.tags.some((tag: any) => tag.name === tagName)
        ).length;
        resolve(count);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 搜索方法
  public async searchImages(
    query: string,
    tagFilters: string[] = []
  ): Promise<ImageData[]> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, returning empty array');
      return [];
    }

    const images = await this.getImages();

    return images.filter((image) => {
      // 文本搜索
      const textMatch =
        !query ||
        image.name?.toLowerCase().includes(query.toLowerCase()) ||
        (image as any).description?.toLowerCase().includes(query.toLowerCase()) ||
        image.promptBlocks.some(
          (promptBlock) =>
            promptBlock.content.toLowerCase().includes(query.toLowerCase()) ||
            (promptBlock.content || '').toLowerCase().includes(query.toLowerCase())
        );

      // 标签过滤
      const tagMatch =
        tagFilters.length === 0 ||
        (image.tags && tagFilters.every((tagName) => image.tags!.some((tag: any) => tag.name === tagName)));

      return textMatch && tagMatch;
    });
  }

  // 删除缓存的图片blob数据
  public async deleteCachedImageBlob(id: string): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping deleteCachedImageBlob');
      return;
    }

    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORES.IMAGE_CACHE], 'readwrite');
      const store = transaction.objectStore(STORES.IMAGE_CACHE);
      store.delete(id);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Failed to delete cached image blob:', error);
    }
  }

  // 获取所有缓存的图片
  public async getAllCachedImages(): Promise<any[]> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, returning empty array');
      return [];
    }

    try {
      const db = await this.getDB();
      const transaction = db.transaction([STORES.IMAGE_CACHE], 'readonly');
      const store = transaction.objectStore(STORES.IMAGE_CACHE);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get all cached images:', error);
      return [];
    }
  }

  // 清理过期的缓存（可选功能）
  public async cleanExpiredCache(maxAgeHours: number = 24 * 7): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping cleanExpiredCache');
      return;
    }

    try {
      const cachedImages = await this.getAllCachedImages();
      const now = new Date();
      const maxAge = maxAgeHours * 60 * 60 * 1000; // 转换为毫秒

      for (const cached of cachedImages) {
        const cachedAt = new Date(cached.cachedAt);
        if (now.getTime() - cachedAt.getTime() > maxAge) {
          await this.deleteCachedImageBlob(cached.id);
        }
      }
    } catch (error) {
      console.error('Failed to clean expired cache:', error);
    }
  }
}

export { IndexedDBManager };
export default new IndexedDBManager();
