"use client";

import {
  onSnapshot,
  doc,
  collection,
  query,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { db, getDb } from "@/lib/firebase";
import {
  ImageData,
  Tag,
  TagGroup,
  ConnectionStatus,
  PerformanceMetrics,
} from "@/types";
import { CacheManager } from "./cache-manager";

interface ListenerOptions {
  enableCache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
}

class ListenerManager {
  private listeners: Map<string, Unsubscribe> = new Map();
  private connectionStatus: ConnectionStatus = "disconnected";
  private statusCallbacks: Set<(status: ConnectionStatus) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1秒
  private cacheManager: CacheManager;
  private performanceMetrics: PerformanceMetrics = {
    loadTime: 0,
    searchTime: 0,
    renderTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    totalRequests: 0,
    errorCount: 0,
    averageResponseTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastUpdated: new Date(),
  };

  constructor() {
    this.cacheManager = CacheManager.getInstance();
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.handleNetworkChange(true);
      });

      window.addEventListener("offline", () => {
        this.handleNetworkChange(false);
      });
    }
  }

  private handleNetworkChange(isOnline: boolean) {
    if (isOnline) {
      this.setConnectionStatus("reconnecting");
      this.reconnectListeners();
    } else {
      this.setConnectionStatus("disconnected");
    }
  }

  private setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.statusCallbacks.forEach((callback) => callback(status));
  }

  private async reconnectListeners() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("达到最大重连次数，停止重连");
      this.setConnectionStatus("disconnected");
      return;
    }

    try {
      // 等待一段时间后重连
      await new Promise((resolve) => setTimeout(resolve, this.reconnectDelay));

      // 重新建立所有监听器
      // 这里可以添加重连逻辑

      this.reconnectAttempts = 0;
      this.setConnectionStatus("connected");
    } catch (error) {
      console.error("重连失败:", error);
      this.reconnectAttempts++;
      this.reconnectDelay *= 2; // 指数退避
      this.reconnectListeners();
    }
  }

  private updatePerformanceMetrics(
    isError: boolean = false,
    responseTime?: number,
  ) {
    this.performanceMetrics.totalRequests++;

    if (isError) {
      this.performanceMetrics.errorCount++;
    }

    if (responseTime) {
      const currentAvg = this.performanceMetrics.averageResponseTime;
      const totalRequests = this.performanceMetrics.totalRequests;
      this.performanceMetrics.averageResponseTime =
        (currentAvg * (totalRequests - 1) + responseTime) / totalRequests;
    }

    this.performanceMetrics.lastUpdated = new Date();
  }

  // 订阅连接状态变化
  onConnectionStatusChange(
    callback: (status: ConnectionStatus) => void,
  ): () => void {
    this.statusCallbacks.add(callback);
    // 立即调用一次回调，传递当前状态
    callback(this.connectionStatus);

    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  // 获取当前连接状态
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  // 获取性能指标
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  // 订阅所有图片
  subscribeToImages(
    onUpdate: (images: ImageData[]) => void,
    onError?: (error: Error) => void,
    options?: ListenerOptions,
  ): () => void {
    const listenerId = "images";
    const cacheKey = options?.cacheKey || "all-images";
    const startTime = Date.now();

    // 如果已经有监听器，先取消
    this.unsubscribe(listenerId);

    // 如果启用缓存，先尝试从缓存获取
    if (options?.enableCache) {
      const cachedData = this.cacheManager.get<ImageData[]>(cacheKey);
      if (cachedData) {
        onUpdate(cachedData);
        this.performanceMetrics.cacheHits++;
      } else {
        this.performanceMetrics.cacheMisses++;
      }
    }

    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error("Database not initialized");
      }
      const q = query(collection(dbInstance, "images"), orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const images: ImageData[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              images.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
              } as ImageData);
            });

            // 更新缓存
            if (options?.enableCache) {
              this.cacheManager.set(cacheKey, images, options.cacheTTL);
            }

            onUpdate(images);
            this.setConnectionStatus("connected");
            this.updatePerformanceMetrics(false, Date.now() - startTime);
          } catch (error) {
            console.error("处理图片数据时出错:", error);
            this.updatePerformanceMetrics(true);
            onError?.(error as Error);
          }
        },
        (error) => {
          console.error("监听图片失败:", error);
          this.setConnectionStatus("disconnected");
          this.updatePerformanceMetrics(true);
          onError?.(error);

          // 尝试重连
          this.handleNetworkChange(navigator.onLine);
        },
      );

      this.listeners.set(listenerId, unsubscribe);

      return () => this.unsubscribe(listenerId);
    } catch (error) {
      console.error("创建图片监听器失败:", error);
      this.updatePerformanceMetrics(true);
      onError?.(error as Error);
      return () => {};
    }
  }

  // 订阅单个图片
  subscribeToImage(
    id: string,
    onUpdate: (image: ImageData | null) => void,
    onError?: (error: Error) => void,
    options?: ListenerOptions,
  ): () => void {
    const listenerId = `image-${id}`;
    const cacheKey = options?.cacheKey || `image-${id}`;
    const startTime = Date.now();

    // 如果已经有监听器，先取消
    this.unsubscribe(listenerId);

    // 如果启用缓存，先尝试从缓存获取
    if (options?.enableCache) {
      const cachedData = this.cacheManager.get<ImageData>(cacheKey);
      if (cachedData) {
        onUpdate(cachedData);
        this.performanceMetrics.cacheHits++;
      } else {
        this.performanceMetrics.cacheMisses++;
      }
    }

    try {
       const dbInstance = getDb();
       if (!dbInstance) {
         throw new Error("Database not initialized");
       }
       const unsubscribe = onSnapshot(
         doc(dbInstance, "images", id),
        (doc) => {
          try {
            if (doc.exists()) {
              const data = doc.data();
              const image: ImageData = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
              } as ImageData;

              // 更新缓存
              if (options?.enableCache) {
                this.cacheManager.set(cacheKey, image, options.cacheTTL);
              }

              onUpdate(image);
            } else {
              // 从缓存中删除不存在的图片
              if (options?.enableCache) {
                this.cacheManager.delete(cacheKey);
              }
              onUpdate(null);
            }

            this.setConnectionStatus("connected");
            this.updatePerformanceMetrics(false, Date.now() - startTime);
          } catch (error) {
            console.error("处理图片数据时出错:", error);
            this.updatePerformanceMetrics(true);
            onError?.(error as Error);
          }
        },
        (error) => {
          console.error("监听图片失败:", error);
          this.setConnectionStatus("disconnected");
          this.updatePerformanceMetrics(true);
          onError?.(error);
        },
      );

      this.listeners.set(listenerId, unsubscribe);

      return () => this.unsubscribe(listenerId);
    } catch (error) {
      console.error("创建图片监听器失败:", error);
      this.updatePerformanceMetrics(true);
      onError?.(error as Error);
      return () => {};
    }
  }

  // 订阅所有标签
  subscribeToTags(
    onUpdate: (tags: Tag[]) => void,
    onError?: (error: Error) => void,
    options?: ListenerOptions,
  ): () => void {
    const listenerId = "tags";
    const cacheKey = options?.cacheKey || "all-tags";
    const startTime = Date.now();

    this.unsubscribe(listenerId);

    if (options?.enableCache) {
      const cachedData = this.cacheManager.get<Tag[]>(cacheKey);
      if (cachedData) {
        onUpdate(cachedData);
        this.performanceMetrics.cacheHits++;
      } else {
        this.performanceMetrics.cacheMisses++;
      }
    }

    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error("Database not initialized");
      }
      const q = query(collection(dbInstance, "tags"), orderBy("name", "asc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const tags: Tag[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              tags.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
              } as Tag);
            });

            if (options?.enableCache) {
              this.cacheManager.set(cacheKey, tags, options.cacheTTL);
            }

            onUpdate(tags);
            this.setConnectionStatus("connected");
            this.updatePerformanceMetrics(false, Date.now() - startTime);
          } catch (error) {
            console.error("处理标签数据时出错:", error);
            this.updatePerformanceMetrics(true);
            onError?.(error as Error);
          }
        },
        (error) => {
          console.error("监听标签失败:", error);
          this.setConnectionStatus("disconnected");
          this.updatePerformanceMetrics(true);
          onError?.(error);
        },
      );

      this.listeners.set(listenerId, unsubscribe);

      return () => this.unsubscribe(listenerId);
    } catch (error) {
      console.error("创建标签监听器失败:", error);
      this.updatePerformanceMetrics(true);
      onError?.(error as Error);
      return () => {};
    }
  }

  // 订阅所有标签分组
  subscribeToTagGroups(
    onUpdate: (tagGroups: TagGroup[]) => void,
    onError?: (error: Error) => void,
    options?: ListenerOptions,
  ): () => void {
    const listenerId = "tag-groups";
    const cacheKey = options?.cacheKey || "all-tag-groups";
    const startTime = Date.now();

    this.unsubscribe(listenerId);

    if (options?.enableCache) {
      const cachedData = this.cacheManager.get<TagGroup[]>(cacheKey);
      if (cachedData) {
        onUpdate(cachedData);
        this.performanceMetrics.cacheHits++;
      } else {
        this.performanceMetrics.cacheMisses++;
      }
    }

    try {
      const dbInstance = getDb();
      if (!dbInstance) {
        throw new Error("Database not initialized");
      }
      const q = query(collection(dbInstance, "tag-groups"), orderBy("name", "asc"));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const tagGroups: TagGroup[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              tagGroups.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
              } as TagGroup);
            });

            if (options?.enableCache) {
              this.cacheManager.set(cacheKey, tagGroups, options.cacheTTL);
            }

            onUpdate(tagGroups);
            this.setConnectionStatus("connected");
            this.updatePerformanceMetrics(false, Date.now() - startTime);
          } catch (error) {
            console.error("处理标签分组数据时出错:", error);
            this.updatePerformanceMetrics(true);
            onError?.(error as Error);
          }
        },
        (error) => {
          console.error("监听标签分组失败:", error);
          this.setConnectionStatus("disconnected");
          this.updatePerformanceMetrics(true);
          onError?.(error);
        },
      );

      this.listeners.set(listenerId, unsubscribe);

      return () => this.unsubscribe(listenerId);
    } catch (error) {
      console.error("创建标签分组监听器失败:", error);
      this.updatePerformanceMetrics(true);
      onError?.(error as Error);
      return () => {};
    }
  }

  // 取消特定监听器
  unsubscribe(listenerId: string) {
    const unsubscribe = this.listeners.get(listenerId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  // 取消所有监听器
  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  // 清理缓存
  clearCache() {
    this.cacheManager.clear();
  }

  // 清理资源
  destroy() {
    this.unsubscribeAll();
    this.statusCallbacks.clear();
    this.clearCache();
  }
}

// 导出单例实例
export const listenerManager = new ListenerManager();
export default listenerManager;
