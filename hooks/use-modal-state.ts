import { useState, useCallback } from 'react';
import { ImageData } from '@/types';

/**
 * 模态框状态管理 Hook
 * 负责管理各种模态框的开关状态和选中的图片
 */
export function useModalState() {
  // 模态框状态
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLemoTaggerOpen, setIsLemoTaggerOpen] = useState(false);
  
  // 视图状态
  const [activeView, setActiveView] = useState('grid');

  // 处理图片点击
  const handleImageClick = useCallback((image: ImageData) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
  }, []);

  // 关闭图片详情弹窗
  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  }, []);

  // 关闭上传弹窗
  const closeUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  // 处理 Lemo Tagger
  const handleLemoTagger = useCallback(() => {
    setIsLemoTaggerOpen(true);
  }, []);

  // 关闭 Lemo Tagger
  const closeLemoTagger = useCallback(() => {
    setIsLemoTaggerOpen(false);
  }, []);

  // 处理上传
  const handleUpload = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  return {
    // 状态
    selectedImage,
    isImageModalOpen,
    isUploadModalOpen,
    isLemoTaggerOpen,
    activeView,
    
    // 状态更新函数
    setSelectedImage,
    setActiveView,
    handleImageClick,
    closeImageModal,
    closeUploadModal,
    handleLemoTagger,
    closeLemoTagger,
    handleUpload,
  };
}