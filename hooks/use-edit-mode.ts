import { useState, useEffect, useCallback } from 'react';
import { ImageData } from '@/types';

/**
 * 编辑模式状态管理 Hook
 * 负责管理批量编辑模式和选中的图片
 */
export function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSidebarEditMode, setIsSidebarEditMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(
    new Set()
  );

  // ESC键退出编辑模式
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditMode) {
        setIsEditMode(false);
        setSelectedImageIds(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditMode]);

  // 切换编辑模式
  const handleImport = useCallback(() => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // 退出编辑模式时清空选择
      setSelectedImageIds(new Set());
    }
  }, [isEditMode]);

  // 处理图片选择
  const handleSelectImage = useCallback(
    (imageId: string, selected: boolean) => {
      setSelectedImageIds((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(imageId);
        } else {
          newSet.delete(imageId);
        }
        return newSet;
      });
    },
    []
  );

  // 处理全选/取消全选
  const handleSelectAll = useCallback(
    (filteredImages: ImageData[]) => {
      if (selectedImageIds.size === filteredImages.length) {
        // 如果已全选，则取消全选
        setSelectedImageIds(new Set());
      } else {
        // 否则全选
        setSelectedImageIds(new Set(filteredImages.map((img) => img.id)));
      }
    },
    [selectedImageIds.size]
  );

  // 切换边栏编辑模式
  const handleSidebarEditModeToggle = useCallback(() => {
    setIsSidebarEditMode(!isSidebarEditMode);
  }, [isSidebarEditMode]);

  return {
    // 状态
    isEditMode,
    isSidebarEditMode,
    selectedImageIds,

    // 状态更新函数
    setIsEditMode,
    setIsSidebarEditMode,
    setSelectedImageIds,
    handleImport,
    handleSelectImage,
    handleSelectAll,
    handleSidebarEditModeToggle,
  };
}
