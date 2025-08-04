import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ImageData } from '@/types';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * 模态框状态管理 Hook
 * 负责管理各种模态框的开关状态和选中的图片
 */
export function useModalState() {
  // 路由和URL参数
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 模态框状态
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // 记录是否通过URL直接访问
  const [isDirectUrlAccess, setIsDirectUrlAccess] = useState(false);

  // 视图状态
  const [activeView, setActiveView] = useState('grid');

  // 记录弹窗打开前的边栏状态
  const [sidebarStateBeforeModal, setSidebarStateBeforeModal] = useState<boolean | null>(null);
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();

  // 处理图片点击 - 使用 useCallback 确保稳定的回调函数
  const handleImageClick = useCallback((image: ImageData) => {
    console.log('🖼️ 打开图片详情:', image.id);
    setSelectedImage(image);
    setIsImageModalOpen(true);
    setIsDirectUrlAccess(false); // 主页点击不是直接访问
    
    // 更新URL参数，使用replace避免页面刷新
    const params = new URLSearchParams(searchParams.toString());
    params.set('image', image.id);
    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // 模态框控制函数 - 清理状态
  const closeImageModal = useCallback(() => {
    console.log('🔒 关闭图片详情弹窗');
    setIsImageModalOpen(false);
    setSelectedImage(null);
  }, []);

  // onClose函数 - 清理modal状态并处理URL
  const onCloseImageModal = useCallback(() => {
    console.log('🔒 onClose: 清理modal状态并处理URL');
    
    // 先清理状态
    setIsImageModalOpen(false);
    setSelectedImage(null);
    
    // 延迟处理URL，避免与useEffect冲突
    setTimeout(() => {
      const currentImageId = searchParams.get('image');
      if (currentImageId) {
        // 清除URL参数，使用replace避免页面刷新
        const params = new URLSearchParams(searchParams.toString());
        params.delete('image');
        const newUrl = params.toString() ? `/?${params.toString()}` : '/';
        router.replace(newUrl, { scroll: false });
      }
      setIsDirectUrlAccess(false);
    }, 0);
  }, [router, searchParams]);

  const closeUploadModal = useCallback(() => setIsUploadModalOpen(false), []);

  const handleUpload = useCallback(() => setIsUploadModalOpen(true), []);

  // 通过图片ID打开弹窗（用于URL直接访问）
  const openImageById = useCallback((imageId: string, image: ImageData) => {
    console.log('🔗 通过URL直接打开图片:', imageId);
    setSelectedImage(image);
    setIsImageModalOpen(true);
    setIsDirectUrlAccess(true); // 标记为直接访问
  }, []);

  // 使用ref来存储边栏状态，避免依赖循环
  const sidebarOpenRef = useRef(sidebarOpen);
  sidebarOpenRef.current = sidebarOpen;

  // 监听弹窗状态变化，控制边栏显示
  useEffect(() => {
    const isAnyModalOpen = isImageModalOpen || isUploadModalOpen;
    
    if (isAnyModalOpen) {
      // 只在弹窗刚打开时记录边栏状态
      if (sidebarStateBeforeModal === null) {
        setSidebarStateBeforeModal(sidebarOpenRef.current);
        // 收起边栏
        setSidebarOpen(false);
      }
    } else {
      // 恢复之前的边栏状态
      if (sidebarStateBeforeModal !== null) {
        setSidebarOpen(sidebarStateBeforeModal);
        setSidebarStateBeforeModal(null);
      }
    }
  }, [isImageModalOpen, isUploadModalOpen, sidebarStateBeforeModal, setSidebarOpen]);

  return {
    // 状态
    selectedImage,
    isImageModalOpen,
    isUploadModalOpen,
    isDirectUrlAccess,

    activeView,

    // 状态更新函数
    setSelectedImage,
    setIsImageModalOpen,
    setActiveView,
    handleImageClick,
    closeImageModal,
    onCloseImageModal,
    closeUploadModal,
    openImageById,

    handleUpload,
  };
}
