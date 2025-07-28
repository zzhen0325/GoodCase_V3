import { useState, useEffect } from 'react';
import { ImageData, PromptBlock } from '@/types';

interface UseImageModalStateProps {
  image: ImageData | null;
  isOpen: boolean;
  autoEdit?: boolean; // 是否自动进入编辑模式
}

export function useImageModalState({ image, isOpen, autoEdit = false }: UseImageModalStateProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [promptBlocks, setPrompts] = useState<PromptBlock[]>([]);
  const [editedTagIds, setEditedTagIds] = useState<string[]>([]);
  const [tagSelectorOpen, setTagSelectorOpen] = useState(false);
  const [lastInitializedImageId, setLastInitializedImageId] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [copyAllStatus, setCopyAllStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [deleteStatus, setDeleteStatus] = useState<
    'idle' | 'confirming' | 'deleting'
  >('idle');
  const [duplicateStatus, setDuplicateStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  // 初始化数据 - 只在弹窗打开或切换图片时初始化
  useEffect(() => {
    if (image && isOpen && lastInitializedImageId !== image.id) {
      console.log('🔄 初始化图片数据:', image);
      
      // 设置标题 - 优先使用name字段，然后是title字段
      setEditedTitle(image.name || image.title || '');
      
      // 设置提示词 - 确保数据格式正确
      if (image.promptBlocks && Array.isArray(image.promptBlocks) && image.promptBlocks.length > 0) {
        console.log('📝 设置提示词:', image.promptBlocks);
        setPrompts(image.promptBlocks);
      } else {
        console.log('📝 无提示词数据');
        setPrompts([]);
      }
      
      // 设置标签 - 确保数据格式正确
      if (image.tags && Array.isArray(image.tags) && image.tags.length > 0) {
        console.log('🏷️ 设置标签:', image.tags);
        const tagIds = image.tags
          .filter((tag: any) => tag !== null && tag !== undefined)
          .map((tag: any) => {
            if (typeof tag === 'string') {
              return tag;
            } else if (tag && typeof tag === 'object' && tag.id) {
              return tag.id;
            }
            return null;
          })
          .filter((id: string | null) => id !== null);
        setEditedTagIds(tagIds);
      } else {
        console.log('🏷️ 无标签数据');
        setEditedTagIds([]);
      }
      
      setLastInitializedImageId(image.id);
    }
  }, [image?.id, isOpen, lastInitializedImageId]);

  // 重置状态当弹窗关闭时
  useEffect(() => {
    if (!isOpen) {
      setDeleteStatus('idle');
      setDuplicateStatus('idle');
      setIsEditing(false);
      setLastInitializedImageId(null);
    }
  }, [isOpen]);

  // 弹窗打开时初始化编辑状态
  useEffect(() => {
    if (isOpen && image && autoEdit) {
      // 如果是自动编辑模式，则自动进入编辑状态
      console.log('🔧 自动进入编辑模式');
      setIsEditing(true);
    }
  }, [isOpen, autoEdit, image?.id]);

  return {
    // 状态
    isEditing,
    editedTitle,
    promptBlocks,
    editedTagIds,
    tagSelectorOpen,
    activeId,
    copyAllStatus,
    deleteStatus,
    duplicateStatus,
    
    // 设置函数
    setIsEditing,
    setEditedTitle,
    setPrompts,
    setPromptBlocks: setPrompts,
    setEditedTagIds,
    setTagSelectorOpen,
    setActiveId,
    setCopyAllStatus,
    setDeleteStatus,
    setDuplicateStatus,
    setLastInitializedImageId,
  };
}