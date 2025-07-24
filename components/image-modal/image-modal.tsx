'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
}: ImageModalProps) {
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
  const modalState = useImageModalState({ image, isOpen });
  const modalActions = useImageModalActions({
    image,
    onUpdate,
    onRefetch,
    refreshTags,
    modalState,
  });



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
            <DialogTitle className="text-lg font-semibold truncate flex-1">
              {image.title || '图片详情'}
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
          <div className="flex h-full">
            {/* 图片预览区域 - 35% */}
            <div className="w-[35%] min-w-0">
              <ImagePreview image={image} onClose={onClose} />
            </div>

            {/* 信息面板区域 - 65% */}
            <div className="w-[65%] border-l bg-background flex flex-col">
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
              <div className="border-t flex-shrink-0">
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