// lib/indexed-db.ts

const DB_NAME = "ImageGalleryDB";
const DB_VERSION = 3;
const IMAGE_STORE_NAME = "images";
const IMAGE_CACHE_STORE_NAME = "image_cache";

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private isClient: boolean;

  constructor() {
    this.isClient =
      typeof window !== "undefined" && typeof indexedDB !== "undefined";
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
        if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
          db.createObjectStore(IMAGE_STORE_NAME, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(IMAGE_CACHE_STORE_NAME)) {
          db.createObjectStore(IMAGE_CACHE_STORE_NAME, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error(
          "IndexedDB error:",
          (event.target as IDBOpenDBRequest).error,
        );
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isClient) {
      throw new Error("IndexedDB is not available in server environment");
    }
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  public async addImage(image: any): Promise<void> {
    if (!this.isClient) {
      console.warn("IndexedDB not available, skipping addImage");
      return;
    }
    const db = await this.getDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    store.add(image);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async getImages(): Promise<any[]> {
    if (!this.isClient) {
      console.warn("IndexedDB not available, returning empty array");
      return [];
    }
    const db = await this.getDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], "readonly");
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async getImageById(id: string): Promise<any> {
    if (!this.isClient) {
      console.warn("IndexedDB not available, returning null");
      return null;
    }
    const db = await this.getDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], "readonly");
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  public async deleteImage(id: string): Promise<void> {
    if (!this.isClient) {
      console.warn("IndexedDB not available, skipping deleteImage");
      return;
    }
    const db = await this.getDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    store.delete(id);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 缓存图片blob数据
  public async cacheImageBlob(
    id: string,
    blob: Blob,
    extension?: string,
  ): Promise<void> {
    if (!this.isClient) {
      console.warn("IndexedDB not available, skipping cacheImageBlob");
      return;
    }

    try {
      const db = await this.getDB();
      const transaction = db.transaction([IMAGE_CACHE_STORE_NAME], "readwrite");
      const store = transaction.objectStore(IMAGE_CACHE_STORE_NAME);

      const cacheData = {
        id,
        blob,
        extension: extension || "jpg",
        cachedAt: new Date().toISOString(),
      };

      store.put(cacheData);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error("Failed to cache image blob:", error);
    }
  }

  // 获取缓存的图片blob数据
  public async getCachedImageBlob(id: string): Promise<any> {
    if (!this.isClient) {
      console.warn("IndexedDB not available, returning null");
      return null;
    }

    try {
      const db = await this.getDB();
      const transaction = db.transaction([IMAGE_CACHE_STORE_NAME], "readonly");
      const store = transaction.objectStore(IMAGE_CACHE_STORE_NAME);
      const request = store.get(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get cached image blob:", error);
      return null;
    }
  }

  // 删除缓存的图片blob数据
  public async deleteCachedImageBlob(id: string): Promise<void> {
    if (!this.isClient) {
      console.warn("IndexedDB not available, skipping deleteCachedImageBlob");
      return;
    }

    try {
      const db = await this.getDB();
      const transaction = db.transaction([IMAGE_CACHE_STORE_NAME], "readwrite");
      const store = transaction.objectStore(IMAGE_CACHE_STORE_NAME);
      store.delete(id);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error("Failed to delete cached image blob:", error);
    }
  }

  // 获取所有缓存的图片
  public async getAllCachedImages(): Promise<any[]> {
    if (!this.isClient) {
      console.warn("IndexedDB not available, returning empty array");
      return [];
    }

    try {
      const db = await this.getDB();
      const transaction = db.transaction([IMAGE_CACHE_STORE_NAME], "readonly");
      const store = transaction.objectStore(IMAGE_CACHE_STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("Failed to get all cached images:", error);
      return [];
    }
  }

  // 清理过期的缓存（可选功能）
  public async cleanExpiredCache(maxAgeHours: number = 24 * 7): Promise<void> {
    if (!this.isClient) {
      console.warn("IndexedDB not available, skipping cleanExpiredCache");
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
      console.error("Failed to clean expired cache:", error);
    }
  }
}

export default new IndexedDBManager();
