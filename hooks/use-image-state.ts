"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ImageData, SearchFilters, DEFAULT_SEARCH_FILTERS } from "@/types";
import { dataService } from "@/lib/data-service";
import { listenerManager } from "@/lib/listeners";

interface ImageState {
  images: ImageData[];
  filteredImages: ImageData[];
  isLoading: boolean;
  searchFilters: SearchFilters;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  cacheStatus: "hit" | "miss" | "loading";
}

interface ImageActions {
  handleSearchChange: (filters: Partial<SearchFilters>) => void;
  refreshImages: (useCache?: boolean) => Promise<void>;
  clearSearch: () => void;
  clearCache: () => void;
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
  setConnectionStatus: React.Dispatch<React.SetStateAction<"connected" | "disconnected" | "reconnecting">>;
}

export function useImageState(): ImageState & ImageActions {
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "reconnecting"
  >("disconnected");
  const [cacheStatus, setCacheStatus] = useState<"hit" | "miss" | "loading">(
    "loading",
  );
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(
    DEFAULT_SEARCH_FILTERS,
  );

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setConnectionStatus("connected");
    const handleOffline = () => setConnectionStatus("disconnected");

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      setConnectionStatus(navigator.onLine ? "connected" : "disconnected");

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // 加载图片数据
  const loadImages = useCallback(async (useCache = true) => {
    try {
      setIsLoading(true);
      setCacheStatus("loading");

      const startTime = Date.now();
      const imageData = await dataService.getAllImages(useCache);
      const loadTime = Date.now() - startTime;

      setImages(imageData);
      setConnectionStatus("connected");

      // 判断是否来自缓存（简单的时间判断）
      setCacheStatus(loadTime < 50 ? "hit" : "miss");

      console.log(`📸 加载了 ${imageData.length} 张图片，耗时 ${loadTime}ms`);
    } catch (error) {
      console.error("❌ 加载图片失败:", error);
      setConnectionStatus("disconnected");
      setCacheStatus("miss");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化数据加载
  useEffect(() => {
    loadImages(true);
  }, [loadImages]);

  // 订阅实时数据变化
  useEffect(() => {
    console.log("🔄 开始监听图片数据变化");

    const unsubscribe = dataService.subscribeToImages(
      (newImages: ImageData[]) => {
        console.log(`📸 实时更新: 接收到 ${newImages.length} 张图片`);
        setImages(newImages);
        setConnectionStatus("connected");
      },
      (error) => {
        console.error("❌ 实时监听错误:", error);
        setConnectionStatus("disconnected");
      },
    );

    return () => {
      console.log("🔇 取消图片数据监听");
      unsubscribe();
    };
  }, []);

  // 执行搜索和筛选
  const performSearch = useCallback(async () => {
    if (!searchFilters.query && searchFilters.tags.length === 0) {
      // 没有搜索条件时，显示所有图片
      setFilteredImages(images);
      return;
    }

    try {
      const searchResult = await dataService.searchImages(searchFilters, {
        page: 1,
        limit: 1000,
      });
      setFilteredImages(searchResult.images);
      console.log(
        `🔍 搜索完成: 找到 ${searchResult.total} 个结果，耗时 ${searchResult.searchTime}ms`,
      );
    } catch (error) {
      console.error("❌ 搜索失败:", error);
      setFilteredImages([]);
    }
  }, [images, searchFilters]);

  // 当图片数据或搜索条件变化时执行搜索
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // 处理搜索变化
  const handleSearchChange = useCallback(
    (newFilters: Partial<SearchFilters>) => {
      setSearchFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );

  // 刷新图片数据
  const refreshImages = useCallback(
    async (useCache = false) => {
      await loadImages(useCache);
    },
    [loadImages],
  );

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchFilters(DEFAULT_SEARCH_FILTERS);
  }, []);

  // 清除缓存
  const clearCache = useCallback(() => {
    dataService.clearAllCache();
    setCacheStatus("miss");
  }, []);

  return {
    images,
    filteredImages,
    isLoading,
    searchFilters,
    connectionStatus,
    cacheStatus,
    handleSearchChange,
    refreshImages,
    clearSearch,
    clearCache,
    setImages,
    setConnectionStatus,
  };
}
