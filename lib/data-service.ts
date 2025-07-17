"use client";

import { Database } from "./database";
import { CacheManager } from "./cache-manager";
import {
  ImageData,
  Tag,
  TagGroup,
  Prompt,
  SearchFilters,
  SearchResult,
  DBResult,
  BatchResult,
  Pagination,
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_SEARCH_FILTERS,
} from "@/types";
import { filterImages } from "./utils";

/**
 * 数据服务层 - 整合缓存和数据库操作
 * 提供统一的数据访问接口，自动处理缓存逻辑
 */
export class DataService {
  private static instance: DataService;
  private database: Database;
  private isInitialized = false;

  private constructor() {
    this.database = Database.getInstance();
  }

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.database.initialize();
      this.isInitialized = true;
      console.log("✅ 数据服务初始化成功");
    } catch (error) {
      console.error("❌ 数据服务初始化失败:", error);
      throw error;
    }
  }

  // ==================== 图片相关操作 ====================

  /**
   * 获取所有图片（带缓存）
   */
  async getAllImages(useCache = true): Promise<ImageData[]> {
    const cacheManager = CacheManager.getInstance();

    if (useCache) {
      const cached = cacheManager.getImages();
      if (cached) {
        console.log("📦 从缓存获取图片数据");
        return cached;
      }
    }

    console.log("🌐 从数据库获取图片数据");
    const result = await this.database.getAllImages();

    if (result.success && result.data) {
      cacheManager.setImages(result.data);
      return result.data;
    }

    throw new Error(result.error || "获取图片失败");
  }

  /**
   * 根据ID获取图片
   */
  async getImageById(id: string): Promise<ImageData | null> {
    const cacheManager = CacheManager.getInstance();

    // 先从缓存的图片列表中查找
    const cachedImages = cacheManager.getImages();
    if (cachedImages) {
      const found = cachedImages.find((img) => img.id === id);
      if (found) {
        console.log("📦 从缓存获取单个图片");
        return found;
      }
    }

    console.log("🌐 从数据库获取单个图片");
    const result = await this.database.getImageById(id);
    return result.success ? result.data || null : null;
  }

  /**
   * 添加图片
   */
  async addImage(
    imageData: Omit<ImageData, "id" | "createdAt" | "updatedAt">,
  ): Promise<DBResult<ImageData>> {
    const result = await this.database.addImage(imageData);

    if (result.success) {
      // 清除缓存，强制下次重新获取
      const cacheManager = CacheManager.getInstance();
      cacheManager.invalidateImages();
      console.log("✅ 图片添加成功，缓存已清除");
    }

    return result;
  }

  /**
   * 更新图片
   */
  async updateImage(
    id: string,
    updates: Partial<ImageData>,
  ): Promise<DBResult<ImageData>> {
    const result = await this.database.updateImage(id, updates);

    if (result.success) {
      const cacheManager = CacheManager.getInstance();
      cacheManager.invalidateImages();
      console.log("✅ 图片更新成功，缓存已清除");
    }

    return result;
  }

  /**
   * 删除图片
   */
  async deleteImage(id: string): Promise<DBResult<void>> {
    const result = await this.database.deleteImage(id);

    if (result.success) {
      const cacheManager = CacheManager.getInstance();
      cacheManager.invalidateImages();
      console.log("✅ 图片删除成功，缓存已清除");
    }

    return result;
  }

  /**
   * 批量删除图片
   */
  async deleteImages(ids: string[]): Promise<BatchResult> {
    const results: DBResult[] = [];
    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const result = await this.database.deleteImage(id);
        results.push(result);

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          if (result.error) errors.push(result.error);
        }
      } catch (error) {
        failedCount++;
        errors.push(`删除图片 ${id} 失败: ${error}`);
        results.push({
          success: false,
          error: String(error),
          timestamp: new Date(),
        });
      }
    }

    if (successCount > 0) {
      const cacheManager = CacheManager.getInstance();
      cacheManager.invalidateImages();
      console.log(`✅ 批量删除完成: ${successCount} 成功, ${failedCount} 失败`);
    }

    return {
      success: successCount,
      failed: failedCount,
      errors,
      results,
    };
  }

  // ==================== 搜索相关操作 ====================

  /**
   * 搜索图片（带缓存）
   */
  async searchImages(
    filters: Partial<SearchFilters> = {},
    pagination: Partial<Pagination> = {},
  ): Promise<SearchResult> {
    const startTime = Date.now();

    // 合并默认筛选条件
    const searchFilters: SearchFilters = {
      ...DEFAULT_SEARCH_FILTERS,
      ...filters,
    };

    const cacheManager = CacheManager.getInstance();

    // 生成缓存键
    const cacheKey = {
      query: searchFilters.query,
      tagIds: searchFilters.tagIds,
      sortBy: searchFilters.sortBy,
      sortOrder: searchFilters.sortOrder,
    };

    // 检查缓存
    const cachedResults = cacheManager.getSearchResults(cacheKey);
    if (cachedResults) {
      console.log("📦 从缓存获取搜索结果");
      return this.paginateResults(
        cachedResults,
        searchFilters,
        pagination,
        Date.now() - startTime,
      );
    }

    // 获取所有图片数据
    const allImages = await this.getAllImages();

    // 执行筛选
    const filteredImages = filterImages(allImages, searchFilters);

    // 缓存搜索结果
    cacheManager.setSearchResults(cacheKey, filteredImages);

    const searchTime = Date.now() - startTime;
    console.log(
      `🔍 搜索完成，耗时 ${searchTime}ms，找到 ${filteredImages.length} 个结果`,
    );

    return this.paginateResults(
      filteredImages,
      searchFilters,
      pagination,
      searchTime,
    );
  }

  /**
   * 分页处理搜索结果
   */
  private paginateResults(
    images: ImageData[],
    filters: SearchFilters,
    pagination: Partial<Pagination>,
    searchTime: number,
  ): SearchResult {
    const page = pagination.page || 1;
    const limit = pagination.limit || DEFAULT_PAGINATION_LIMIT;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedImages = images.slice(startIndex, endIndex);
    const total = images.length;

    return {
      images: paginatedImages,
      pagination: {
        page,
        limit,
        total,
        hasNext: endIndex < total,
        hasPrev: page > 1,
      },
      filters,
      totalMatches: total,
      searchTime,
    };
  }

  // ==================== 标签相关操作 ====================

  /**
   * 获取所有标签（带缓存）
   */
  async getAllTags(groupId?: string, useCache = true): Promise<Tag[]> {
    if (useCache) {
      const cacheManager = CacheManager.getInstance();
      const cached = cacheManager.getTags(groupId);
      if (cached) {
        console.log("📦 从缓存获取标签数据");
        return cached;
      }
    }

    // 这里需要实现数据库的标签获取方法
    // 暂时返回空数组，等待数据库方法实现
    console.log("🌐 从数据库获取标签数据");
    const tags: Tag[] = [];

    if (useCache) {
      const cacheManager = CacheManager.getInstance();
      cacheManager.setTags(tags, groupId);
    }

    return tags;
  }

  /**
   * 创建标签
   */
  async createTag(
    tagData: Omit<Tag, "id" | "createdAt" | "updatedAt">,
  ): Promise<DBResult<Tag>> {
    // 这里需要实现数据库的标签创建方法
    const result: DBResult<Tag> = {
      success: false,
      error: "标签创建方法待实现",
      timestamp: new Date(),
    };

    if (result.success) {
      const cacheManager = CacheManager.getInstance();
      cacheManager.invalidateTags(tagData.groupId);
    }

    return result;
  }

  /**
   * 更新标签
   */
  async updateTag(id: string, updates: Partial<Tag>): Promise<DBResult<Tag>> {
    // 这里需要实现数据库的标签更新方法
    const result: DBResult<Tag> = {
      success: false,
      error: "标签更新方法待实现",
      timestamp: new Date(),
    };

    if (result.success) {
      const cacheManager = CacheManager.getInstance();
      cacheManager.invalidateTags();
    }

    return result;
  }

  /**
   * 删除标签
   */
  async deleteTag(id: string): Promise<DBResult<void>> {
    // 这里需要实现数据库的标签删除方法
    const result: DBResult<void> = {
      success: false,
      error: "标签删除方法待实现",
      timestamp: new Date(),
    };

    if (result.success) {
      const cacheManager = CacheManager.getInstance();
      cacheManager.invalidateTags();
    }

    return result;
  }

  // ==================== 标签分组相关操作 ====================

  /**
   * 获取所有标签分组（带缓存）
   */
  async getAllTagGroups(useCache = true): Promise<TagGroup[]> {
    if (useCache) {
      const cacheManager = CacheManager.getInstance();
      const cached = cacheManager.getTagGroups();
      if (cached) {
        console.log("📦 从缓存获取标签分组数据");
        return cached;
      }
    }

    // 这里需要实现数据库的标签分组获取方法
    console.log("🌐 从数据库获取标签分组数据");
    const tagGroups: TagGroup[] = [];

    if (useCache) {
      const cacheManager = CacheManager.getInstance();
      cacheManager.setTagGroups(tagGroups);
    }

    return tagGroups;
  }

  /**
   * 创建标签分组
   */
  async createTagGroup(
    tagGroupData: Omit<TagGroup, "id" | "createdAt" | "updatedAt">,
  ): Promise<DBResult<TagGroup>> {
    await this.ensureInitialized();

    // 这里需要实现数据库的标签分组创建方法
    const result: DBResult<TagGroup> = {
      success: false,
      error: "标签分组创建功能尚未实现",
    };

    if (result.success) {
      const cacheManager = CacheManager.getInstance();
      cacheManager.invalidateTagGroups();
    }

    return result;
  }

  async updateTagGroup(
    id: string,
    updates: Partial<Omit<TagGroup, "id" | "createdAt" | "updatedAt">>,
  ): Promise<DBResult<TagGroup>> {
    await this.ensureInitialized();

    const result = await this.database.updateTagGroup(id, updates);

    if (result.success) {
      const cacheManager = CacheManager.getInstance();
      cacheManager.invalidateTagGroups();
    }

    return result;
  }

  // ==================== 实时监听 ====================

  /**
   * 订阅图片数据变化
   */
  subscribeToImages(
    callback: (images: ImageData[]) => void,
    errorCallback?: (error: Error) => void,
  ): () => void {
    return this.database.subscribeToImages((images) => {
      // 更新缓存
      const cacheManager = CacheManager.getInstance();
      cacheManager.setImages(images);
      callback(images);
    }, errorCallback);
  }

  /**
   * 订阅单个图片数据变化
   */
  subscribeToImage(
    id: string,
    callback: (image: ImageData | null) => void,
    errorCallback?: (error: Error) => void,
  ): () => void {
    return this.database.subscribeToImage(id, callback, errorCallback);
  }

  // ==================== 缓存管理 ====================

  /**
   * 清除所有缓存
   */
  clearAllCache(): void {
    const cacheManager = CacheManager.getInstance();
    cacheManager.clearAll();
    console.log("🗑️ 所有缓存已清除");
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats() {
    const cacheManager = CacheManager.getInstance();
    return cacheManager.getStats();
  }

  /**
   * 预加载数据
   */
  async preloadData(): Promise<void> {
    try {
      console.log("🚀 开始预加载数据...");

      // 预加载图片数据
      await this.getAllImages(true);

      // 预加载标签数据
      await this.getAllTags(undefined, true);

      // 预加载标签分组数据
      await this.getAllTagGroups(true);

      console.log("✅ 数据预加载完成");
    } catch (error) {
      console.error("❌ 数据预加载失败:", error);
    }
  }

  // ==================== 性能监控 ====================

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    const cacheStats = this.getCacheStats();

    return {
      cacheHitRate: 0, // 需要实现缓存命中率统计
      memoryUsage: cacheStats.memoryItems,
      maxMemoryItems: cacheStats.maxMemoryItems,
      activeListeners: 0, // 需要从 ListenerManager 获取
    };
  }
}

// 导出单例实例
export const dataService = DataService.getInstance();

// 自动初始化（在浏览器环境中）
if (typeof window !== "undefined") {
  dataService.initialize().catch(console.error);
}
