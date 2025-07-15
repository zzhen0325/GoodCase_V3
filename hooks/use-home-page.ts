import { useImageState } from './use-image-state';
import { useModalState } from './use-modal-state';
import { useEditMode } from './use-edit-mode';
import { useImageOperations } from './use-image-operations';
import { useTagOperations } from './use-tag-operations';
import { useBatchOperations } from './use-batch-operations';
import { useNavigation } from './use-navigation';
import { useDataSync } from './use-data-sync';
import { useDownloadProgress } from '@/components/download-progress-toast';
import { ListenerManager } from '@/lib/listeners';

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
    connectionStatus: imageState.connectionStatus,
    selectedImage: modalState.selectedImage,
    setImages: imageState.setImages,
    setSelectedImage: modalState.setSelectedImage,
    setIsImageModalOpen: () => {}, // 这个在 modalState 中处理
  });
  
  // 标签操作
  const tagOperations = useTagOperations({
    searchFilters: imageState.searchFilters,
    handleSearchChange: imageState.handleSearchChange,
  });
  
  // 批量操作
  const batchOperations = useBatchOperations({
    selectedImageIds: editMode.selectedImageIds,
    filteredImages: imageState.filteredImages,
    tags: imageState.tags,
    setSelectedImageIds: editMode.setSelectedImageIds,
    getFileExtensionFromUrl: imageOperations.getFileExtensionFromUrl,
  });
  
  // 导航操作
  const navigation = useNavigation({
    searchFilters: imageState.searchFilters,
    handleSearchChange: imageState.handleSearchChange,
    setActiveView: modalState.setActiveView,
  });
  
  // 获取监听器状态
  const getConnectionInfo = () => {
    const status = ListenerManager.getListenerStatus();
    console.log('📊 监听器状态:', status);
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
    ...tagOperations,
    ...batchOperations,
    ...navigation,
    ...dataSync,
    
    // 工具函数
    getConnectionInfo,
  };
}