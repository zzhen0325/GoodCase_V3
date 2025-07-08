import { ImageData, Tag, DBResult } from '@/types';

// IndexedDB数据库管理类
class ImageDatabase {
  private dbName = 'GooodCaseDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  // 初始化数据库
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建图片存储
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('title', 'title', { unique: false });
          imageStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // 创建标签存储
        if (!db.objectStoreNames.contains('tags')) {
          const tagStore = db.createObjectStore('tags', { keyPath: 'id' });
          tagStore.createIndex('name', 'name', { unique: true });
        }
      };
    });
  }

  // 确保数据库已初始化
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // 添加图片
  async addImage(image: Omit<ImageData, 'id'>): Promise<ImageData> {
    const db = await this.ensureDB();
    const now = new Date().toISOString();
    const newImage: ImageData = {
      ...image,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.add(newImage);

      request.onsuccess = () => {
        resolve(newImage);
      };
      request.onerror = () => {
        reject(new Error(request.error?.message || '添加图片失败'));
      };
    });
  }

  // 获取所有图片
  async getAllImages(): Promise<ImageData[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.getAll();

      request.onsuccess = () => {
        const images = request.result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(images);
      };
      request.onerror = () => {
        reject(new Error(request.error?.message || '获取图片失败'));
      };
    });
  }

  // 更新图片
  async updateImage(id: string, updates: Partial<ImageData>): Promise<ImageData> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const existingImage = getRequest.result;
        if (!existingImage) {
          reject(new Error('图片不存在'));
          return;
        }

        const updatedImage = {
          ...existingImage,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        const putRequest = store.put(updatedImage);
        putRequest.onsuccess = () => {
          resolve(updatedImage);
        };
        putRequest.onerror = () => {
          reject(new Error(putRequest.error?.message || '更新图片失败'));
        };
      };
      getRequest.onerror = () => {
        reject(new Error(getRequest.error?.message || '获取图片失败'));
      };
    });
  }

  // 删除图片
  async deleteImage(id: string): Promise<DBResult<boolean>> {
    try {
      const db = await this.ensureDB();
      
      return new Promise((resolve) => {
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve({ success: true, data: true });
        };
        request.onerror = () => {
          resolve({ success: false, error: request.error?.message });
        };
      });
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  // 添加标签
  async addTag(tag: Omit<Tag, 'id'>): Promise<Tag> {
    const db = await this.ensureDB();
    const newTag: Tag = {
      ...tag,
      id: crypto.randomUUID(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tags'], 'readwrite');
      const store = transaction.objectStore('tags');
      const request = store.add(newTag);

      request.onsuccess = () => {
        resolve(newTag);
      };
      request.onerror = () => {
        reject(new Error(request.error?.message || '添加标签失败'));
      };
    });
  }

  // 获取所有标签
  async getAllTags(): Promise<Tag[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tags'], 'readonly');
      const store = transaction.objectStore('tags');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(new Error(request.error?.message || '获取标签失败'));
      };
    });
  }

  // 删除标签
  async deleteTag(id: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['tags'], 'readwrite');
      const store = transaction.objectStore('tags');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(new Error(request.error?.message || '删除标签失败'));
      };
    });
  }

  // 导出所有数据
  async exportData(): Promise<{ images: ImageData[], tags: Tag[] }> {
    const [images, tags] = await Promise.all([
      this.getAllImages(),
      this.getAllTags()
    ]);
    
    return { images, tags };
  }

  // 导入数据
  async importData(data: { images: ImageData[], tags: Tag[] }): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['images', 'tags'], 'readwrite');
      const imageStore = transaction.objectStore('images');
      const tagStore = transaction.objectStore('tags');
      
      let completed = 0;
      const total = data.images.length + data.tags.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      const checkComplete = () => {
        completed++;
        if (completed === total) {
          resolve();
        }
      };
      
      // 导入标签
      data.tags.forEach(tag => {
        const request = tagStore.put(tag);
        request.onsuccess = checkComplete;
        request.onerror = () => reject(new Error(`导入标签失败: ${tag.name}`));
      });
      
      // 导入图片
      data.images.forEach(image => {
        const request = imageStore.put(image);
        request.onsuccess = checkComplete;
        request.onerror = () => reject(new Error(`导入图片失败: ${image.title}`));
      });
    });
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['images', 'tags'], 'readwrite');
      const imageStore = transaction.objectStore('images');
      const tagStore = transaction.objectStore('tags');
      
      let completed = 0;
      
      const checkComplete = () => {
        completed++;
        if (completed === 2) {
          resolve();
        }
      };
      
      const clearImages = imageStore.clear();
      clearImages.onsuccess = checkComplete;
      clearImages.onerror = () => reject(new Error('清空图片数据失败'));
      
      const clearTags = tagStore.clear();
      clearTags.onsuccess = checkComplete;
      clearTags.onerror = () => reject(new Error('清空标签数据失败'));
    });
  }
}

// 导出类
export { ImageDatabase };