import { useCallback } from 'react';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { ImageData, PromptBlock, AVAILABLE_COLORS } from '@/types';
import { generateId, copyToClipboard } from '@/lib/utils';
import { toast } from 'sonner';

interface UseImageModalActionsProps {
  image: ImageData | null;
  onUpdate: (id: string, updates: Partial<ImageData> | { name?: string; tagIds?: string[]; promptBlocks?: PromptBlock[] }) => Promise<void>;
  onRefetch?: () => Promise<void>;
  refreshTags?: () => void;
  modalState: {
    editedTitle: string;
    editedTagIds: string[];
    editedLink: string;
    promptBlocks: PromptBlock[];
    isEditing: boolean;
    activeId: string | null;
    copyAllStatus: 'idle' | 'success' | 'error';
    tagSelectorOpen: boolean;
    setEditedTitle: (title: string) => void;
    setEditedTagIds: (tagIds: string[]) => void;
    setEditedLink: (link: string) => void;
    setPromptBlocks: (promptBlocks: PromptBlock[]) => void;
    setIsEditing: (isEditing: boolean) => void;
    setLastInitializedImageId: (id: string | null) => void;
    setActiveId: (id: string | null) => void;
    setCopyAllStatus: (status: 'idle' | 'success' | 'error') => void;
    setTagSelectorOpen: (open: boolean) => void;
  };
}

export function useImageModalActions({
  image,
  onUpdate,
  onRefetch,
  refreshTags,
  modalState,
}: UseImageModalActionsProps) {
  
  // 保存更改
  const handleSave = useCallback(async () => {
    if (!image) return;

    try {
      // 更新图片数据（提示词块现在是图片的一部分）
      const updatedPromptBlocks = modalState.promptBlocks.map((block, index) => ({
        ...block,
        order: index,
        id: block.id.startsWith('temp_') ? generateId() : block.id
      }));

      // 更新图片
      await onUpdate(image.id, {
        name: modalState.editedTitle,
        tags: modalState.editedTagIds,
        promptBlocks: updatedPromptBlocks,
        link: modalState.editedLink
      });

      toast.success('保存成功');
      
      // onUpdate 已经更新了本地状态，不需要重新获取数据
      // 移除 onRefetch 调用以避免页面刷新
      
      // 只刷新标签数据（如果需要）
      if (refreshTags) {
        refreshTags();
      }
      
      // 强制重新初始化数据
      modalState.setLastInitializedImageId(null);
      
      // 延迟重置编辑状态，确保数据更新完成
      setTimeout(() => {
        modalState.setIsEditing(false);
      }, 100);
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
    }
  }, [image, onUpdate, onRefetch, refreshTags, modalState]);

  // 取消编辑
  const handleCancel = useCallback(() => {
    if (image) {
      // 重置为编辑前的状态
      modalState.setEditedTitle(image.name || '');
      
      // 重置链接
      modalState.setEditedLink(image.link || '');
      
      // 重置提示词
      if (image.promptBlocks && Array.isArray(image.promptBlocks) && image.promptBlocks.length > 0) {
        modalState.setPromptBlocks(image.promptBlocks);
      } else {
        modalState.setPromptBlocks([]);
      }
      
      // 重置标签
      if (image.tags && Array.isArray(image.tags) && image.tags.length > 0) {
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
        modalState.setEditedTagIds(tagIds);
      } else {
        modalState.setEditedTagIds([]);
      }
      
      toast.info('已取消编辑');
    }
    modalState.setIsEditing(false);
  }, [image, modalState]);

  // 复制全部提示词
  const handleCopyAll = useCallback(async () => {
    if (modalState.promptBlocks.length === 0) {
      toast.error('没有提示词可复制');
      return;
    }

    const allPromptsText = modalState.promptBlocks
      .map((p: PromptBlock) => p.content || '')
      .filter(Boolean)
      .join('\n\n');

    if (!allPromptsText.trim()) {
      toast.error('没有有效的提示词内容');
      return;
    }

    try {
      modalState.setCopyAllStatus('success');
      await copyToClipboard(allPromptsText);
      toast.success('所有提示词已复制到剪贴板');
    } catch (error) {
      modalState.setCopyAllStatus('error');
      toast.error('复制失败，请重试');
    }

    setTimeout(() => modalState.setCopyAllStatus('idle'), 2000);
  }, [modalState]);

  // 添加新提示词
  const handleAddPrompt = useCallback(() => {
    const newPrompt: PromptBlock = {
      id: `temp_${generateId()}`,
      
      content: '',
      color: AVAILABLE_COLORS[0],
      order: modalState.promptBlocks.length,
      
      
    };
    modalState.setPromptBlocks([...modalState.promptBlocks, newPrompt]);
  }, [modalState]);

  // 更新提示词
  const handleUpdatePrompt = useCallback((id: string, updates: Partial<PromptBlock>) => {
    modalState.setPromptBlocks(
      modalState.promptBlocks.map((promptBlock: PromptBlock) =>
        promptBlock.id === id
          ? { ...promptBlock, ...updates }
          : promptBlock
      )
    );
  }, [modalState]);

  // 删除提示词
  const handleDeletePrompt = useCallback((id: string) => {
    modalState.setPromptBlocks(modalState.promptBlocks.filter((promptBlock: PromptBlock) => promptBlock.id !== id));
  }, [modalState]);

  // 复制提示词内容
  const handleCopyPrompt = useCallback(async (content: string) => {
    try {
      await copyToClipboard(content);
      toast.success('提示词已复制');
    } catch (error) {
      toast.error('复制失败');
    }
  }, []);

  // 拖拽事件处理
  const handleDragStart = useCallback((event: DragStartEvent) => {
    modalState.setActiveId(String(event.active.id));
  }, [modalState]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const currentPrompts = modalState.promptBlocks;
      const oldIndex = currentPrompts.findIndex((item) => item.id === String(active.id));
      const newIndex = currentPrompts.findIndex((item) => item.id === String(over.id));

      const newItems = arrayMove(currentPrompts, oldIndex, newIndex);
      const updatedPrompts = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));
      
      modalState.setPromptBlocks(updatedPrompts);
    }

    modalState.setActiveId(null);
  }, [modalState]);

  // 编辑相关操作
  const handleEdit = useCallback(() => {
    modalState.setIsEditing(true);
  }, [modalState]);

  const handleTitleChange = useCallback((title: string) => {
    modalState.setEditedTitle(title);
  }, [modalState]);

  const handleTagIdsChange = useCallback((tagIds: string[]) => {
    modalState.setEditedTagIds(tagIds);
  }, [modalState]);

  const handleTagSelectorOpen = useCallback((open: boolean) => {
    modalState.setTagSelectorOpen(open);
  }, [modalState]);

  const handleLinkChange = useCallback((link: string) => {
    modalState.setEditedLink(link);
  }, [modalState]);

  return {
    handleSave,
    handleCancel,
    handleCopyAll,
    handleAddPrompt,
    handleUpdatePrompt,
    handleDeletePrompt,
    handleCopyPrompt,
    handleDragStart,
    handleDragEnd,
    handleEdit,
    handleTitleChange,
    handleTagIdsChange,
    handleLinkChange,
    handleTagSelectorOpen,
  };
}