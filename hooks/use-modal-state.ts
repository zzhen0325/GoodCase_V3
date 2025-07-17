import { useState, useCallback } from "react";
import { ImageData } from "@/types";

/**
 * 模态框状态管理 Hook
 * 负责管理各种模态框的开关状态和选中的图片
 */
export function useModalState() {
  // 模态框状态
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // 视图状态
  const [activeView, setActiveView] = useState("grid");

  // 处理图片点击
  const handleImageClick = useCallback((image: ImageData) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
  }, []);

  // 模态框控制函数
  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  }, []);

  const closeUploadModal = useCallback(() => setIsUploadModalOpen(false), []);

  const handleUpload = useCallback(() => setIsUploadModalOpen(true), []);

  return {
    // 状态
    selectedImage,
    isImageModalOpen,
    isUploadModalOpen,

    activeView,

    // 状态更新函数
    setSelectedImage,
    setActiveView,
    handleImageClick,
    closeImageModal,
    closeUploadModal,

    handleUpload,
  };
}
