// lib/indexed-db.ts

const DB_NAME = 'ImageGalleryDB';
const DB_VERSION = 1;
const IMAGE_STORE_NAME = 'images';

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  constructor() {
    this.init();
  }

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IMAGE_STORE_NAME)) {
          db.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  public async addImage(image: any): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    store.add(image);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  public async getImages(): Promise<any[]> {
    const db = await this.getDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

    public async getImageById(id: string): Promise<any> {
        const db = await this.getDB();
        const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly');
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
    const db = await this.getDB();
    const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    store.delete(id);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export default new IndexedDBManager();