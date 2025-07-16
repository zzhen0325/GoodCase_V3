"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FileImage, ChevronLeft, X, Plus, Edit3, Save, Copy, Check, Trash2, Files, Calendar, Tag as TagIcon } from 'lucide-react';
import { PromptBlock } from './prompt-block';
import { TagManager } from './tag-manager';
import { ImageData, Prompt, Tag, PROMPT_COLORS } from '@/types';
import { generateId, copyToClipboard, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

// 类型定义
export interface ImageModalProps {
  image: ImageData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ImageData>) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (image: ImageData) => void;
  availableTags: Tag[];
  onCreateTag: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
  onCopyPrompt?: (content: string) => void;
  isPanel?: boolean;
}

interface ImagePreviewProps {
  image: ImageData;
  onClose: () => void;
  isPanel?: boolean;
}

interface PromptManagerProps {
  prompts: Prompt[];
  isEditing: boolean;
  onPromptsChange: (prompts: Prompt[]) => void;
  onCopyPrompt?: (content: string) => void;
}

interface ImageActionsProps {
  isEditing: boolean;
  prompts: Prompt[];
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCopyAll: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  copyAllStatus: 'idle' | 'success' | 'error';
  duplicateStatus: 'idle' | 'success' | 'error';
  deleteStatus: 'idle' | 'confirming' | 'deleting';
}

interface ImageInfoProps {
  image: ImageData;
  tags: Tag[];
  availableTags: Tag[];
  isEditing: boolean;
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
}

// 样式常量
const MODAL_STYLES = {
  dialog: "w-[95vw] max-w-7xl h-[90vh] p-0 rounded-2xl",
  content: "grid grid-cols-1 md:grid-cols-2 h-full overflow-hidden",
  infoArea: "bg-white p-6 md:p-8 flex flex-col overflow-y-auto",
  promptArea: "flex-grow mb-6",
  buttonArea: "flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100",
};

const PREVIEW_STYLES = {
  container: "bg-muted  w-[100%] flex items-center justify-center p-4 md:p-6 overflow-hidden relative",
  image: "max-w-full max-h-full object-contain rounded-xl items-center justify-center",
  placeholder: "flex flex-col items-center justify-center text-center p-8",
  closeButton: "absolute top-4 right-4 z-10 bg-white/80 backdrop-blur-sm hover:bg-white",
  backButton: "absolute top-4 left-4 z-10 bg-white hover:bg-white shadow-lg",
};

// 图片预览组件
function ImagePreview({ image, onClose, isPanel = false }: ImagePreviewProps) {
  return (
    <div className={PREVIEW_STYLES.container}>
      {/* 关闭/返回按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className={isPanel ? PREVIEW_STYLES.backButton : PREVIEW_STYLES.closeButton}
      >
        {isPanel ? (
          <>
            <ChevronLeft className="w-4 h-4 mr-1" />
          </>
        ) : (
          <X className="w-4 h-4" />
        )}
      </Button>

      {/* 图片内容 */}
      <div className="w-full h-full flex items-center justify-center">
        {image.url ? (
          <img
            src={image.url}
            alt={image.title || 'Image'}
            className={PREVIEW_STYLES.image}
          />
        ) : (
          <div className={PREVIEW_STYLES.placeholder}>
            <FileImage className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">
              {isPanel ? '暂无图片' : '图片加载中...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 提示词管理组件
function PromptManager({
  prompts,
  isEditing,
  onPromptsChange,
  onCopyPrompt
}: PromptManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 添加提示词
  const addPrompt = () => {
    const newPrompt: Prompt = {
      id: generateId(),
      title: '',
      content: '',
      color: PROMPT_COLORS[Math.floor(Math.random() * PROMPT_COLORS.length)],
      order: prompts.length,
      createdAt: new Date().toISOString()
    };
    onPromptsChange([...prompts, newPrompt]);
  };

  // 更新提示词
  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    const updatedPrompts = prompts.map(prompt => 
      prompt.id === id ? { ...prompt, ...updates } : prompt
    );
    onPromptsChange(updatedPrompts);
  };

  // 删除提示词
  const deletePrompt = (id: string) => {
    const updatedPrompts = prompts.filter(prompt => prompt.id !== id);
    onPromptsChange(updatedPrompts);
  };

  // 处理拖拽开始
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  // 处理拖拽结束
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = prompts.findIndex(item => item.id === active.id);
      const newIndex = prompts.findIndex(item => item.id === over.id);
      const reorderedPrompts = arrayMove(prompts, oldIndex, newIndex);
      onPromptsChange(reorderedPrompts);
    }
    
    setActiveId(null);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-800">Prompts</h4>
        {isEditing && (
          <Button size="sm" variant="outline" onClick={addPrompt}>
            <Plus className="w-4 h-4 mr-1" />
            添加
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={prompts.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {prompts.map((prompt) => (
              <PromptBlock
                key={prompt.id}
                prompt={prompt}
                isEditing={isEditing}
                onUpdate={updatePrompt}
                onDelete={deletePrompt}
                onCopy={onCopyPrompt || (() => {})}
              />
            ))}
          </SortableContext>
          
          <DragOverlay>
            {activeId ? (
              <PromptBlock
                prompt={prompts.find(p => p.id === activeId)!}
                isEditing={isEditing}
                onUpdate={() => {}}
                onDelete={() => {}}
                onCopy={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>

        {prompts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>暂无提示词</p>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={addPrompt}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                添加第一个提示词
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 操作按钮组件
function ImageActions({
  isEditing,
  prompts,
  onEdit,
  onSave,
  onCancel,
  onCopyAll,
  onDuplicate,
  onDelete,
  copyAllStatus,
  duplicateStatus,
  deleteStatus
}: ImageActionsProps) {
  if (isEditing) {
    return (
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button onClick={onSave}>
          <Save className="w-4 h-4 mr-1" />
          保存
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {prompts.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCopyAll}
          disabled={copyAllStatus !== 'idle'}
        >
          {copyAllStatus === 'success' ? (
            <Check className="w-4 h-4 mr-1 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 mr-1" />
          )}
          {copyAllStatus === 'success' ? '已复制' : '复制全部'}
        </Button>
      )}
      
      {onDuplicate && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          disabled={duplicateStatus !== 'idle'}
        >
          {duplicateStatus === 'success' ? (
            <Check className="w-4 h-4 mr-1 text-green-600" />
          ) : (
            <Files className="w-4 h-4 mr-1" />
          )}
          {duplicateStatus === 'success' ? '已复制' : '复制图片'}
        </Button>
      )}
      
      {onDelete && (
        <Button
          variant={deleteStatus === 'confirming' ? 'destructive' : 'outline'}
          size="sm"
          onClick={onDelete}
          disabled={deleteStatus === 'deleting'}
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {deleteStatus === 'confirming' ? '确认删除' : '删除'}
        </Button>
      )}
      
      <Button onClick={onEdit}>
        <Edit3 className="w-4 h-4 mr-1" />
        编辑
      </Button>
    </div>
  );
}

// 图片信息组件
function ImageInfo({
  image,
  tags,
  availableTags,
  isEditing,
  onTagsChange,
  onCreateTag
}: ImageInfoProps) {
  return (
    <div className="space-y-6">
      {/* 标签区域 */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
          <TagIcon className="w-5 h-5" />
          <span>Tags</span>
        </div>
        
        <TagManager
          tags={tags}
          selectedTags={tags}
          availableTags={availableTags}
          onTagsChange={onTagsChange}
          onCreateTag={onCreateTag}
          isEditing={isEditing}
        />
      </div>

      {/* 图片信息 */}
      <div className="text-sm text-gray-500 space-y-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(new Date(image.createdAt))}</span>
        </div>
      </div>
    </div>
  );
}

// 主组件
export function ImageModal({
  image,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  availableTags,
  onCreateTag,
  onCopyPrompt,
  isPanel = false
}: ImageModalProps) {
  // 状态管理
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [copyAllStatus, setCopyAllStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'confirming' | 'deleting'>('idle');
  const [duplicateStatus, setDuplicateStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 初始化数据
  useEffect(() => {
    if (image && isOpen) {
      setEditedTitle(image.title);
      setPrompts([...image.prompts]);
      setTags([...image.tags]);
      setIsEditing(false);
    }
  }, [image, isOpen]);

  // 重置状态当弹窗关闭时
  useEffect(() => {
    if (!isOpen) {
      setDeleteStatus('idle');
      setDuplicateStatus('idle');
    }
  }, [isOpen]);

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

  // 保存更改
  const saveChanges = async () => {
    if (!image) return;

    try {
      const updateData = {
        title: editedTitle,
        prompts: prompts,
        tags: tags
      };
      
      await onUpdate(image.id, updateData);
      toast.success('保存成功');
      setIsEditing(false);
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    if (image) {
      setEditedTitle(image.title);
      setPrompts([...image.prompts]);
      setTags([...image.tags]);
    }
    setIsEditing(false);
  };

  // 复制全部提示词
  const copyAllPrompts = async () => {
    if (prompts.length === 0) {
      toast.error('没有提示词可复制');
      return;
    }

    const allPromptsText = prompts.map(p => p.content).filter(Boolean).join('\n\n');
    
    if (!allPromptsText.trim()) {
      toast.error('没有有效的提示词内容');
      return;
    }

    try {
      setCopyAllStatus('success');
      await copyToClipboard(allPromptsText);
      toast.success('所有提示词已复制到剪贴板');
      
      if (onCopyPrompt) {
        onCopyPrompt(allPromptsText);
      }
    } catch (error) {
      setCopyAllStatus('error');
      toast.error('复制失败，请重试');
    }

    setTimeout(() => setCopyAllStatus('idle'), 2000);
  };

  // 删除图片
  const handleDelete = async () => {
    if (!image || !onDelete) return;

    if (deleteStatus === 'idle') {
      setDeleteStatus('confirming');
      return;
    }

    if (deleteStatus === 'confirming') {
      try {
        setDeleteStatus('deleting');
        await onDelete(image.id);
        toast.success('图片已删除');
        onClose();
      } catch (error) {
        console.error('删除失败:', error);
        toast.error('删除失败，请重试');
        setDeleteStatus('idle');
      }
    }
  };

  // 复制图片
  const handleDuplicate = async () => {
    if (!image || !onDuplicate) return;

    try {
      setDuplicateStatus('success');
      await onDuplicate(image);
      toast.success('图片已复制');
    } catch (error) {
      setDuplicateStatus('error');
      console.error('复制失败:', error);
      toast.error('复制失败，请重试');
    } finally {
      setTimeout(() => setDuplicateStatus('idle'), 2000);
    }
  };

  if (!image) return null;

  // 面板模式的内容
  const panelContent = (
    <div className="h-full max-h-[100vh] w-3/4 flex flex-col rounded-3xl bg-white  gap-4">
      {/* 上部分：左右两栏 */}
      <div className="flex-1 flex gap-4  overflow-hidden">
        {/* 左栏：图片预览区域 - 50% */}
        <div className="w-[50%]">
          <ImagePreview image={image} onClose={onClose} isPanel={true} />
        </div>
        
        {/* 右栏：详情信息 - 50% */}
        <div className="w-[50%] overflow-y-auto p-6 bg-muted max-h-full flex flex-col">
          {/* 按钮区域 */}
          <div className="mb-4">
            <ImageActions
              isEditing={isEditing}
              prompts={prompts}
              onEdit={() => setIsEditing(true)}
              onSave={saveChanges}
              onCancel={cancelEdit}
              onCopyAll={copyAllPrompts}
              onDuplicate={onDuplicate ? handleDuplicate : undefined}
              onDelete={onDelete ? handleDelete : undefined}
              copyAllStatus={copyAllStatus}
              duplicateStatus={duplicateStatus}
              deleteStatus={deleteStatus}
            />
          </div>
          
          {/* 提示词管理区域 */}
          <PromptManager
            prompts={prompts}
            isEditing={isEditing}
            onPromptsChange={setPrompts}
            onCopyPrompt={onCopyPrompt}
          />
     
          {/* 图片信息 */}
          <ImageInfo
            image={image}
            tags={tags}
            availableTags={availableTags}
            isEditing={isEditing}
            onTagsChange={setTags}
            onCreateTag={onCreateTag}
          />
        </div>
      </div>
    </div>
  );

  // 如果是面板模式，直接返回面板内容
  if (isPanel) {
    return panelContent;
  }

  // 弹窗模式
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={MODAL_STYLES.dialog}>
        <div className={MODAL_STYLES.content}>
          {/* 图片区域 */}
          <ImagePreview image={image} onClose={onClose} isPanel={false} />

          {/* 信息区域 */}
          <div className={MODAL_STYLES.infoArea}>
            {/* 提示词管理区域 */}
            <div className={MODAL_STYLES.promptArea}>
              <PromptManager
                prompts={prompts}
                isEditing={isEditing}
                onPromptsChange={setPrompts}
                onCopyPrompt={onCopyPrompt}
              />
            </div>

            {/* 图片信息 */}
            <ImageInfo
              image={image}
              tags={tags}
              availableTags={availableTags}
              isEditing={isEditing}
              onTagsChange={setTags}
              onCreateTag={onCreateTag}
            />

            {/* 按钮区域 */}
            <div className={MODAL_STYLES.buttonArea}>
              <ImageActions
                isEditing={isEditing}
                prompts={prompts}
                onEdit={() => setIsEditing(true)}
                onSave={saveChanges}
                onCancel={cancelEdit}
                onCopyAll={copyAllPrompts}
                onDuplicate={onDuplicate ? handleDuplicate : undefined}
                onDelete={onDelete ? handleDelete : undefined}
                copyAllStatus={copyAllStatus}
                duplicateStatus={duplicateStatus}
                deleteStatus={deleteStatus}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 导出类型以保持向后兼容性
export type {
  ImagePreviewProps,
  PromptManagerProps,
  ImageActionsProps,
  ImageInfoProps
};