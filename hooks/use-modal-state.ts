import { useState, useCallback, useEffect, useRef } from 'react';
import { ImageData } from '@/types';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * 模态框状态管理 Hook
 * 负责管理各种模态框的开关状态和选中的图片
 */
export function useModalState() {
  
  // 模态框状态
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const previousSidebarState = useRef<boolean | null>(null);
  


  // 视图状态
  const [activeView, setActiveView] = useState('grid');

  // 边栏控制
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();

  // 处理图片点击 - 使用 useCallback 确保稳定的回调函数
  const handleImageClick = useCallback((image: ImageData) => {
    console.log('🖼️ 打开图片详情:', image.id);
    setSelectedImage(image);
    setIsImageModalOpen(true);
  }, []);

  // 模态框控制函数 - 清理状态
  const closeImageModal = useCallback(() => {
    console.log('🔒 关闭图片详情弹窗');
    setIsImageModalOpen(false);
    setSelectedImage(null);
  }, []);

  // onClose函数 - 只清理modal相关状态，不主动跳转路由
  const onCloseImageModal = useCallback(() => {
    console.log('🔒 onClose: 只清理modal状态');
    setIsImageModalOpen(false);
    setSelectedImage(null);
  }, []);

  const closeUploadModal = useCallback(() => setIsUploadModalOpen(false), []);

  const handleUpload = useCallback(() => setIsUploadModalOpen(true), []);

  // 监听图片模态框状态变化，自动控制边栏
  useEffect(() => {
    if (isImageModalOpen) {
      // 打开模态框时，记录当前边栏状态并收起边栏
      previousSidebarState.current = sidebarOpen;
      setSidebarOpen(false);
    } else if (previousSidebarState.current !== null) {
      // 关闭模态框时，自动展开边栏
      setSidebarOpen(true);
      previousSidebarState.current = null; // 重置状态
    }
  }, [isImageModalOpen, setSidebarOpen]);



  return {
    // 状态
    selectedImage,
    isImageModalOpen,
    isUploadModalOpen,

    activeView,

    // 状态更新函数
    setSelectedImage,
    setIsImageModalOpen,
    setActiveView,
    handleImageClick,
    closeImageModal,
    onCloseImageModal,
    closeUploadModal,

    handleUpload,
  };
}
