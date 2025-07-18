import { useImageState } from "./use-image-state";
import { useModalState } from "./use-modal-state";
import { useEditMode } from "./use-edit-mode";
import { useImageOperations } from "./use-image-operations";

import { useBatchOperations } from "./use-batch-operations";
import { useNavigation } from "./use-navigation";
import { useDataSync } from "./use-data-sync";
import { useDownloadProgress } from "@/components/download-progress-toast";
import { useInfiniteScroll } from "./use-infinite-scroll";
import { listenerManager } from "@/lib/listeners";
import { useEffect } from "react";

/**
 * 主页面状态管理 Hook
 * 整合所有子 hooks，提供完整的页面状态和操作
 */
export function useHomePage() {
  // 基础状态管理
  const imageState = useImageState();
  const modalState = useModalState();
  const editMode = useEditMode();

  // 下载进度管理
  const downloadProgress = useDownloadProgress();

  // 数据同步
  const dataSync = useDataSync({
    setImages: imageState.setImages,
    setConnectionStatus: imageState.setConnectionStatus,
  });

  // 图片操作
  const imageOperations = useImageOperations({
    selectedImage: modalState.selectedImage,
    setImages: imageState.setImages,
    setSelectedImage: modalState.setSelectedImage,
    setIsImageModalOpen: modalState.setIsImageModalOpen,
    onRefresh: imageState.refetch,
  });

  // 批量操作
  const batchOperations = useBatchOperations({
    selectedImageIds: editMode.selectedImageIds,
    filteredImages: imageState.filteredImages,
    setSelectedImageIds: editMode.setSelectedImageIds,
  });

  // 导航操作
  const navigation = useNavigation({
    searchFilters: imageState.searchFilters,
    handleSearchChange: imageState.handleSearchChange,
    setActiveView: modalState.setActiveView,
  });

  // 无限滚动
  const infiniteScroll = useInfiniteScroll(imageState.filteredImages, 20);

  // 当搜索条件改变时重置分页
  useEffect(() => {
    infiniteScroll.resetPagination();
  }, [imageState.searchFilters, infiniteScroll.resetPagination]);

  // 获取监听器状态
  const getConnectionInfo = () => {
    const status = listenerManager.getConnectionStatus();
    console.log("📊 监听器状态:", status);
    return status;
  };

  return {
    // 状态
    ...imageState,
    ...modalState,
    ...editMode,
    downloadProgress,

    // 操作函数
    ...imageOperations,

    ...batchOperations,
    ...navigation,
    ...dataSync,

    // 无限滚动
    displayedImages: infiniteScroll.displayedImages,
    hasMore: infiniteScroll.hasMore,
    loadingMore: infiniteScroll.loadingMore,
    loadMore: infiniteScroll.loadMore,

    // 工具函数
    getConnectionInfo,
  };
}
