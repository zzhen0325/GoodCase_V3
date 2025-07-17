import { useState, useCallback } from "react";
import { ImageData } from "@/types";

/**
 * 无限滚动加载 Hook
 * 管理分页加载状态和逻辑
 */
export function useInfiniteScroll(
  allImages: ImageData[],
  pageSize: number = 20,
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // 计算当前显示的图片
  const displayedImages = allImages.slice(0, currentPage * pageSize);

  // 是否还有更多图片
  const hasMore = displayedImages.length < allImages.length;

  // 加载更多图片
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    // 模拟加载延迟，提供更好的用户体验
    await new Promise((resolve) => setTimeout(resolve, 500));

    setCurrentPage((prev) => prev + 1);
    setLoadingMore(false);
  }, [loadingMore, hasMore]);

  // 重置分页（当搜索条件改变时）
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setLoadingMore(false);
  }, []);

  return {
    displayedImages,
    hasMore,
    loadingMore,
    loadMore,
    resetPagination,
    currentPage,
    totalPages: Math.ceil(allImages.length / pageSize),
  };
}
