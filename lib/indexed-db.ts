// lib/indexed-db.ts
import {
  ImageData,
  Tag,
  TagGroup,
  PromptBlock,
  DEFAULT_PROMPT_BLOCKS,
} from '@/types';

const DB_NAME = 'ImageGalleryDB';
const DB_VERSION = 5;
const STORES = {
  IMAGES: 'images',
  TAGS: 'tags',
  TAG_GROUPS: 'tag_groups',
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

        // 删除所有现有存储以重新创建
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
              break;
            case STORES.TAGS:
              store.createIndex('groupId', 'groupId');
              store.createIndex('sortOrder', 'sortOrder');
              store.createIndex('name', 'name');
              break;
            case STORES.TAG_GROUPS:
              store.createIndex('sortOrder', 'sortOrder');
              store.createIndex('name', 'name');
              break;
            case STORES.PROMPT_BLOCKS:
              store.createIndex('imageId', 'imageId');
              store.createIndex('sortOrder', 'sortOrder');
              break;
          }
        });
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
    if (image.sortOrder === undefined) {
      const maxSortOrder = await this.getMaxSortOrder(STORES.IMAGES);
      image.sortOrder = maxSortOrder + 1;
    }

    // 添加图片
    imageStore.put(image);

    // 创建默认提示词块
    if (!image.prompts || image.prompts.length === 0) {
      const defaultPrompts = DEFAULT_PROMPT_BLOCKS.map((template, index) => ({
        id: `${image.id}_prompt_${index}`,
        title: template.title,
        text: template.text,
        imageId: image.id,
        sortOrder: index,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      defaultPrompts.forEach((prompt) => promptStore.put(prompt));
      image.prompts = defaultPrompts;
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
      const prompts = await new Promise<PromptBlock[]>((resolve, reject) => {
        const request = promptStore.index('imageId').getAll(image.id);
        request.onsuccess = () => {
          const result = request.result.sort(
            (a, b) => a.sortOrder - b.sortOrder
          );
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
      image.prompts = prompts;
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
      const prompts = await new Promise<PromptBlock[]>((resolve, reject) => {
        const request = promptStore.index('imageId').getAll(id);
        request.onsuccess = () => {
          const result = request.result.sort(
            (a, b) => a.sortOrder - b.sortOrder
          );
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
      image.prompts = prompts;
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
      promptRequest.result.forEach((prompt) => {
        promptStore.delete(prompt.id);
      });
    };

    // 删除缓存的图片
    cacheStore.delete(id);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 标签操作
  public async addTag(tag: Tag): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping addTag');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.TAGS], 'readwrite');
    const store = transaction.objectStore(STORES.TAGS);

    // 确保标签有sortOrder
    if (tag.sortOrder === undefined) {
      const maxSortOrder = await this.getMaxSortOrder(STORES.TAGS, tag.groupId);
      tag.sortOrder = maxSortOrder + 1;
    }

    store.put(tag);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async getTags(groupId?: string): Promise<Tag[]> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, returning empty array');
      return [];
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.TAGS], 'readonly');
    const store = transaction.objectStore(STORES.TAGS);

    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      if (groupId) {
        request = store.index('groupId').getAll(groupId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const result = request.result.sort((a, b) => a.sortOrder - b.sortOrder);
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async updateTag(tag: Tag): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping updateTag');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.TAGS], 'readwrite');
    const store = transaction.objectStore(STORES.TAGS);

    tag.updatedAt = new Date();
    store.put(tag);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async deleteTag(id: string): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping deleteTag');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.TAGS], 'readwrite');
    const store = transaction.objectStore(STORES.TAGS);

    store.delete(id);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 标签分组操作
  public async addTagGroup(tagGroup: TagGroup): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping addTagGroup');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.TAG_GROUPS], 'readwrite');
    const store = transaction.objectStore(STORES.TAG_GROUPS);

    // 确保分组有sortOrder
    if (tagGroup.sortOrder === undefined) {
      const maxSortOrder = await this.getMaxSortOrder(STORES.TAG_GROUPS);
      tagGroup.sortOrder = maxSortOrder + 1;
    }

    store.put(tagGroup);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async getTagGroups(): Promise<TagGroup[]> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, returning empty array');
      return [];
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.TAG_GROUPS], 'readonly');
    const store = transaction.objectStore(STORES.TAG_GROUPS);

    return new Promise((resolve, reject) => {
      const request = store.index('sortOrder').getAll();
      request.onsuccess = () => {
        const result = request.result.sort((a, b) => a.sortOrder - b.sortOrder);
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async updateTagGroup(tagGroup: TagGroup): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping updateTagGroup');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction([STORES.TAG_GROUPS], 'readwrite');
    const store = transaction.objectStore(STORES.TAG_GROUPS);

    tagGroup.updatedAt = new Date();
    store.put(tagGroup);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async deleteTagGroup(id: string): Promise<void> {
    if (!this.isClient) {
      console.warn('IndexedDB not available, skipping deleteTagGroup');
      return;
    }

    const db = await this.getDB();
    const transaction = db.transaction(
      [STORES.TAG_GROUPS, STORES.TAGS],
      'readwrite'
    );
    const groupStore = transaction.objectStore(STORES.TAG_GROUPS);
    const tagStore = transaction.objectStore(STORES.TAGS);

    // 删除分组
    groupStore.delete(id);

    // 将该分组下的标签的groupId设为undefined
    const tagRequest = tagStore.index('groupId').getAll(id);
    tagRequest.onsuccess = () => {
      tagRequest.result.forEach((tag) => {
        tag.groupId = undefined;
        tag.updatedAt = new Date();
        tagStore.put(tag);
      });
    };

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
    if (promptBlock.sortOrder === undefined) {
      const maxSortOrder = await this.getMaxSortOrderForImage(
        promptBlock.imageId
      );
      promptBlock.sortOrder = maxSortOrder + 1;
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

    promptBlock.updatedAt = new Date();
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
  private async getMaxSortOrder(
    storeName: string,
    groupId?: string
  ): Promise<number> {
    if (!this.isClient) return 0;

    const db = await this.getDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      if (groupId && storeName === STORES.TAGS) {
        request = store.index('groupId').getAll(groupId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const items = request.result;
        const maxOrder = items.reduce((max: number, item: any) => {
          return Math.max(max, item.sortOrder || 0);
        }, 0);
        resolve(maxOrder);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async getMaxSortOrderForImage(imageId: string): Promise<number> {
    if (!this.isClient) return 0;

    const db = await this.getDB();
    const transaction = db.transaction([STORES.PROMPT_BLOCKS], 'readonly');
    const store = transaction.objectStore(STORES.PROMPT_BLOCKS);

    return new Promise((resolve, reject) => {
      const request = store.index('imageId').getAll(imageId);
      request.onsuccess = () => {
        const prompts = request.result;
        const maxOrder = prompts.reduce((max, prompt) => {
          return Math.max(max, prompt.sortOrder || 0);
        }, 0);
        resolve(maxOrder);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 统计方法
  public async getTagCount(groupId?: string): Promise<number> {
    if (!this.isClient) return 0;

    const db = await this.getDB();
    const transaction = db.transaction([STORES.TAGS], 'readonly');
    const store = transaction.objectStore(STORES.TAGS);

    return new Promise((resolve, reject) => {
      let request: IDBRequest;
      if (groupId) {
        request = store.index('groupId').count(groupId);
      } else {
        request = store.count();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

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
          (image) => image.tags && image.tags.includes(tagName)
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
        image.title.toLowerCase().includes(query.toLowerCase()) ||
        image.description?.toLowerCase().includes(query.toLowerCase()) ||
        image.prompts.some(
          (prompt) =>
            prompt.title.toLowerCase().includes(query.toLowerCase()) ||
            prompt.text.toLowerCase().includes(query.toLowerCase())
        );

      // 标签过滤
      const tagMatch =
        tagFilters.length === 0 ||
        tagFilters.every((tag) => image.tags.includes(tag));

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
