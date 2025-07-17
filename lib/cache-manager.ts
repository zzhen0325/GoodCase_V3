"use client";

import { ImageData, Tag, TagGroup } from "@/types";

// 缓存配置
const CACHE_CONFIG = {
  IMAGES: {
    key: "images_cache",
    ttl: 5 * 60 * 1000, // 5分钟
  },
  TAGS: {
    key: "tags_cache",
    ttl: 10 * 60 * 1000, // 10分钟
  },
  TAG_GROUPS: {
    key: "tag_groups_cache",
    ttl: 10 * 60 * 1000, // 10分钟
  },
  SEARCH_RESULTS: {
    key: "search_cache",
    ttl: 2 * 60 * 1000, // 2分钟
  },
} as const;

// 缓存项接口
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// 搜索缓存键
interface SearchCacheKey {
  query: string;
  tagIds: string[];
  sortBy: string;
  sortOrder: string;
}

/**
 * 缓存管理器 - 提供内存和本地存储双层缓存
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache = new Map<string, CacheItem<any>>();
  private maxMemoryItems = 100; // 内存缓存最大项数

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // 生成缓存键
  private generateKey(prefix: string, identifier?: string): string {
    return identifier ? `${prefix}_${identifier}` : prefix;
  }

  // 检查缓存是否过期
  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  // 清理过期的内存缓存
  private cleanExpiredMemoryCache(): void {
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    }
  }

  // 限制内存缓存大小
  private limitMemoryCache(): void {
    if (this.memoryCache.size > this.maxMemoryItems) {
      // 删除最旧的项
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - this.maxMemoryItems);
      toDelete.forEach(([key]) => this.memoryCache.delete(key));
    }
  }

  // 设置缓存
  private setCache<T>(key: string, data: T, ttl: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // 设置内存缓存
    this.memoryCache.set(key, item);
    this.limitMemoryCache();

    // 设置本地存储缓存（仅在浏览器环境）
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        console.warn("本地存储缓存失败:", error);
      }
    }
  }

  // 获取缓存
  get<T>(key: string): T | null {
    return this.getCache<T>(key);
  }

  // 设置缓存
  set<T>(key: string, data: T, ttl?: number): void {
    const defaultTtl = 5 * 60 * 1000; // 5分钟默认TTL
    this.setCache(key, data, ttl || defaultTtl);
  }

  // 删除缓存
  delete(key: string): void {
    this.deleteCache(key);
  }

  // 清空所有缓存
  clear(): void {
    this.clearAll();
  }

  // 获取缓存（私有方法）
  private getCache<T>(key: string): T | null {
    // 先检查内存缓存
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && !this.isExpired(memoryItem)) {
      return memoryItem.data;
    }

    // 检查本地存储缓存
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const item: CacheItem<T> = JSON.parse(stored);
          if (!this.isExpired(item)) {
            // 恢复到内存缓存
            this.memoryCache.set(key, item);
            return item.data;
          } else {
            // 删除过期的本地存储
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn("读取本地存储缓存失败:", error);
      }
    }

    return null;
  }

  // 删除缓存（私有方法）
  private deleteCache(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.removeItem(key);
    }
  }

  // 图片缓存
  setImages(images: ImageData[]): void {
    this.setCache(CACHE_CONFIG.IMAGES.key, images, CACHE_CONFIG.IMAGES.ttl);
  }

  getImages(): ImageData[] | null {
    return this.getCache<ImageData[]>(CACHE_CONFIG.IMAGES.key);
  }

  invalidateImages(): void {
    this.deleteCache(CACHE_CONFIG.IMAGES.key);
    // 同时清理相关的搜索缓存
    this.clearSearchCache();
  }

  // 标签缓存
  setTags(tags: Tag[], groupId?: string): void {
    const key = this.generateKey(CACHE_CONFIG.TAGS.key, groupId);
    this.setCache(key, tags, CACHE_CONFIG.TAGS.ttl);
  }

  getTags(groupId?: string): Tag[] | null {
    const key = this.generateKey(CACHE_CONFIG.TAGS.key, groupId);
    return this.getCache<Tag[]>(key);
  }

  invalidateTags(groupId?: string): void {
    if (groupId) {
      const key = this.generateKey(CACHE_CONFIG.TAGS.key, groupId);
      this.deleteCache(key);
    } else {
      // 清理所有标签缓存
      const keysToDelete = Array.from(this.memoryCache.keys()).filter((key) =>
        key.startsWith(CACHE_CONFIG.TAGS.key),
      );
      keysToDelete.forEach((key) => this.deleteCache(key));
    }
  }

  // 标签分组缓存
  setTagGroups(tagGroups: TagGroup[]): void {
    this.setCache(
      CACHE_CONFIG.TAG_GROUPS.key,
      tagGroups,
      CACHE_CONFIG.TAG_GROUPS.ttl,
    );
  }

  getTagGroups(): TagGroup[] | null {
    return this.getCache<TagGroup[]>(CACHE_CONFIG.TAG_GROUPS.key);
  }

  invalidateTagGroups(): void {
    this.deleteCache(CACHE_CONFIG.TAG_GROUPS.key);
  }

  // 搜索结果缓存
  setSearchResults(searchKey: SearchCacheKey, results: ImageData[]): void {
    const key = this.generateSearchKey(searchKey);
    this.setCache(key, results, CACHE_CONFIG.SEARCH_RESULTS.ttl);
  }

  getSearchResults(searchKey: SearchCacheKey): ImageData[] | null {
    const key = this.generateSearchKey(searchKey);
    return this.getCache<ImageData[]>(key);
  }

  private generateSearchKey(searchKey: SearchCacheKey): string {
    const keyString = JSON.stringify({
      query: searchKey.query.toLowerCase().trim(),
      tagIds: searchKey.tagIds.sort(),
      sortBy: searchKey.sortBy,
      sortOrder: searchKey.sortOrder,
    });
    return `${CACHE_CONFIG.SEARCH_RESULTS.key}_${btoa(keyString)}`;
  }

  clearSearchCache(): void {
    const keysToDelete = Array.from(this.memoryCache.keys()).filter((key) =>
      key.startsWith(CACHE_CONFIG.SEARCH_RESULTS.key),
    );
    keysToDelete.forEach((key) => this.deleteCache(key));
  }

  // 清理所有缓存
  clearAll(): void {
    this.memoryCache.clear();
    if (typeof window !== "undefined" && window.localStorage) {
      Object.values(CACHE_CONFIG).forEach((config) => {
        localStorage.removeItem(config.key);
      });
    }
  }

  // 获取缓存统计信息
  getStats() {
    this.cleanExpiredMemoryCache();
    return {
      memoryItems: this.memoryCache.size,
      maxMemoryItems: this.maxMemoryItems,
      cacheKeys: Array.from(this.memoryCache.keys()),
    };
  }

  // 定期清理过期缓存
  startCleanupTimer(): void {
    if (typeof window !== "undefined") {
      setInterval(() => {
        this.cleanExpiredMemoryCache();
      }, 60000); // 每分钟清理一次
    }
  }
}

// 启动清理定时器
if (typeof window !== "undefined") {
  CacheManager.getInstance().startCleanupTimer();
}
