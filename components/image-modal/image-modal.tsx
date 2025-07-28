'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTagOperations } from '@/hooks/use-tag-operations';
import { ImageData, PromptBlock } from '@/types';
import { toast } from 'sonner';
import { ImageActions } from './ImageActions';
import { ImagePreview } from './ImagePreview';
import { PromptList } from './PromptList';
import { ImageInfo } from './ImageInfo';
import { useImageModalState } from './useImageModalState';
import { useImageModalActions } from './useImageModalActions';

// 删除按钮组件
interface DeleteButtonProps {
  onDelete: () => void;
  deleteStatus: 'idle' | 'confirming' | 'deleting';
}

function DeleteButton({ onDelete, deleteStatus }: DeleteButtonProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);

  const handleDeleteClick = () => {
    if (!isConfirming) {
      setIsConfirming(true);
    } else {
      setIsConfirming(false);
      onDelete();
    }
  };

  // 重置确认状态当删除状态改变时
  React.useEffect(() => {
    if (deleteStatus === 'idle') {
      setIsConfirming(false);
    }
  }, [deleteStatus]);

  return (
    <Button
      onClick={handleDeleteClick}
      variant="outline"
      size="lg"
      disabled={deleteStatus === 'deleting'}
      className="px-3 text-black font-medium"
    >
      <Trash2 className="w-4 h-4" />
      {deleteStatus === 'deleting'
        ? '删除中...'
        : isConfirming
          ? '确认删除？'
          : '删除'}
    </Button>
  );
}

// 类型定义
export interface ImageModalProps {
  image: ImageData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ImageData>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onDuplicate?: (image: ImageData) => Promise<void>;
  onCopyPrompt?: (content: string) => void;
  onRefetch?: () => Promise<void>;
  autoEdit?: boolean; // 是否自动进入编辑模式
}

// 主组件
export function ImageModal({
  image,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  onCopyPrompt,
  onRefetch,
  autoEdit = false,
}: ImageModalProps) {
  // 面板宽度状态
  const [leftPanelWidth, setLeftPanelWidth] = useState(35);
  const [isDragging, setIsDragging] = useState(false);
  // DnD sensors - 必须在组件顶层调用
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: ['Enter'],
        cancel: ['Escape'],
        end: ['Enter', 'Escape'],
      },
    })
  );

  // 状态管理
  const { tags, tagCategories, refreshAll: refreshTags } = useTagOperations();
  
  // 自定义 hooks 管理状态和操作
  const modalState = useImageModalState({ image, isOpen, autoEdit });
  const modalActions = useImageModalActions({
    image,
    onUpdate,
    onRefetch,
    refreshTags,
    modalState,
  });

  // 拖拽处理函数
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.querySelector('[data-modal-container]') as HTMLElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    // 限制宽度范围在 20% 到 80% 之间
    const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
    setLeftPanelWidth(clampedWidth);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);



  // ESC键退出功能
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const draggedPrompt = modalState.activeId 
    ? modalState.promptBlocks.find((p) => p.id === modalState.activeId) 
    : null;

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[70vw] h-[75vh] p-0 flex flex-col rounded-2xl overflow-hidden gap-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
        {/* 顶部标题区域 */}
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center gap-4">
            {/* 删除按钮 - 编辑模式第一个 */}
            {modalState.isEditing && onDelete && (
              <DeleteButton
                onDelete={() => onDelete(image.id)}
                deleteStatus={modalState.deleteStatus}
              />
            )}
            
            <DialogTitle className="text-lg font-semibold truncate flex-1">
              {image.name || image.title || '图片详情'}
            </DialogTitle>
            
            {/* 操作按钮区域 */}
            <div className="flex items-center">
              <ImageActions
                isEditing={modalState.isEditing}
                promptBlocks={modalState.promptBlocks}
                onEdit={modalActions.handleEdit}
                onSave={modalActions.handleSave}
                onCancel={modalActions.handleCancel}
                onCopyAll={modalActions.handleCopyAll}
                onDuplicate={onDuplicate ? () => onDuplicate(image) : undefined}
                copyAllStatus={modalState.copyAllStatus}
                duplicateStatus={modalState.duplicateStatus}
                onAddPrompt={modalActions.handleAddPrompt}
                tags={tags}
                tagCategories={tagCategories}
                editedTagIds={modalState.editedTagIds}
                onTagIdsChange={modalActions.handleTagIdsChange}
                onRefetch={refreshTags}
                tagSelectorOpen={modalState.tagSelectorOpen}
                setTagSelectorOpen={modalActions.handleTagSelectorOpen}
                onDelete={onDelete ? () => onDelete(image.id) : undefined}
                deleteStatus={modalState.deleteStatus}
              />
            </div>
          </div>
          <DialogDescription className="sr-only">
            查看和编辑图片的详细信息，包括提示词和标签
          </DialogDescription>
        </DialogHeader>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={modalActions.handleDragStart}
          onDragEnd={modalActions.handleDragEnd}
        >
          <div className="flex h-full" data-modal-container>
            {/* 图片预览区域 */}
            <div 
              className="min-w-0 flex-shrink-0" 
              style={{ width: `${leftPanelWidth}%` }}
            >
              <ImagePreview image={image} onClose={onClose} />
            </div>

            {/* 拖拽分隔条 */}
            <div 
              className={`w-[1px] bg-border hover:bg-border cursor-col-resize flex-shrink-0 relative group ${
                isDragging ? 'bg-border' : ''
              }`}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute inset-y-0 -left-2 -right-2 flex items-center justify-center">
                <div className="bg-white border  rounded px-1 py-2 opacity-0 group-hover:opacity-100 transition-opacity ">
                  <GripVertical className="w-3 h-6 text-border" />
                </div>
              </div>
            </div>

            {/* 信息面板区域 */}
            <div 
              className=" bg-white flex flex-col min-w-0" 
              style={{ width: `${100 - leftPanelWidth}%` }}
            >
              {/* 提示词管理区域 */}
              <div className="flex-1 flex flex-col min-h-0 max-h-[calc(75vh-220px)]">
                <PromptList
                  promptBlocks={modalState.promptBlocks}
                  isEditing={modalState.isEditing}
                  onUpdate={modalActions.handleUpdatePrompt}
                  onDelete={modalActions.handleDeletePrompt}
                  onCopy={modalActions.handleCopyPrompt}
                />
              </div>

              {/* 底部标签和按钮区域 */}
              <div className="flex-shrink-0">
                <ImageInfo
                  image={image}
                  isEditing={modalState.isEditing}
                  onDelete={onDelete ? () => onDelete(image.id) : undefined}
                  deleteStatus={modalState.deleteStatus}
                  tags={tags}
                  tagCategories={tagCategories}
                  editedTitle={modalState.editedTitle}
                  editedTagIds={modalState.editedTagIds}
                  onTitleChange={modalActions.handleTitleChange}
                  onTagIdsChange={modalActions.handleTagIdsChange}
                  onRefetch={refreshTags}
                  tagSelectorOpen={modalState.tagSelectorOpen}
                  setTagSelectorOpen={modalActions.handleTagSelectorOpen}
                  onSave={modalActions.handleSave}
                  onCancel={modalActions.handleCancel}
                />
              </div>
            </div>
          </div>

          <DragOverlay>
            {draggedPrompt ? (
              <PromptList.DragOverlay
                promptBlock={draggedPrompt}
                isEditing={modalState.isEditing}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </DialogContent>
    </Dialog>
  );
}