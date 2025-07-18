'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  FileImage,
  X,
  Plus,
  Edit3,
  Save,
  Copy,
  Check,
  Trash2,
  Files,
  Calendar,
  Tag as TagIcon,
} from 'lucide-react';
import { PromptBlock } from './prompt-block';
import { TagSelector } from './tags/tag-selector';
import { useTagOperations } from '@/hooks/use-tag-operations';
import { database } from '@/lib/database';

import {
  ImageData,
  Prompt,
  Tag,
  AVAILABLE_COLORS,
} from '@/types';
import { generateId, copyToClipboard, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

// 类型定义
export interface ImageModalProps {
  image: ImageData | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<ImageData>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onDuplicate?: (image: ImageData) => Promise<void>;
  onCopyPrompt?: (content: string) => void;
}

interface ImagePreviewProps {
  image: ImageData;
  onClose: () => void;
}

interface ImageActionsProps {
  isEditing: boolean;
  prompts: Prompt[];
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCopyAll: () => void;
  onDuplicate?: () => void;
  copyAllStatus: 'idle' | 'success' | 'error';
  duplicateStatus: 'idle' | 'success' | 'error';
}

interface ImageInfoProps {
  image: ImageData;
  isEditing: boolean;
  onDelete?: () => void;
  deleteStatus: 'idle' | 'confirming' | 'deleting';
  onUpdate?: (updates: Partial<ImageData>) => void;
  tags: Tag[];
  editedTitle: string;
  editedTagIds: string[];
  onTitleChange: (title: string) => void;
  onTagIdsChange: (tagIds: string[]) => void;
  onRefetch: () => void;
}

// 图片预览组件
function ImagePreview({ image, onClose }: ImagePreviewProps) {
  if (!image?.url) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 relative bg-white">
        <div className="flex flex-col items-center justify-center text-center">
          <FileImage className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">图片加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-8 relative bg-white rounded-l-lg">
      <img
        src={image.url}
        alt={image.title || '图片'}
        className="max-w-full max-h-[calc(85vh-8rem)] object-contain rounded-lg"
        loading="lazy"
      />
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
  copyAllStatus,
  duplicateStatus,
}: ImageActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* 编辑相关按钮 */}
      {isEditing ? (
        <>
          <Button
            key="save"
            onClick={onSave}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
          <Button
            key="cancel"
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            取消
          </Button>
        </>
      ) : (
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit3 className="w-4 h-4 mr-2" />
          编辑
        </Button>
      )}

      {/* 复制全部提示词 - 编辑模式下隐藏 */}
      {!isEditing && (
        <Button
          onClick={onCopyAll}
          variant="outline"
          size="sm"
          disabled={prompts.length === 0}
          className={
            copyAllStatus === 'success' ? 'border-green-500 text-green-700' : ''
          }
        >
          {copyAllStatus === 'success' ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          {copyAllStatus === 'success' ? '已复制' : '复制全部'}
        </Button>
      )}

      {/* 复制图片 - 编辑模式下隐藏 */}
      {!isEditing && onDuplicate && (
        <Button
          onClick={onDuplicate}
          variant="outline"
          size="sm"
          className={
            duplicateStatus === 'success'
              ? 'border-green-500 text-green-700'
              : ''
          }
        >
          {duplicateStatus === 'success' ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Files className="w-4 h-4 mr-2" />
          )}
          {duplicateStatus === 'success' ? '已复制' : '复制图片'}
        </Button>
      )}
    </div>
  );
}

// 图片信息组件
function ImageInfo({
  image,
  isEditing,
  onDelete,
  deleteStatus,
  onUpdate,
  tags,
  editedTitle,
  editedTagIds,
  onTitleChange,
  onTagIdsChange,
  onRefetch,
}: ImageInfoProps) {
  const { tagGroups, createTag } = useTagOperations();

  // 移除标签
  const removeTag = (tagId: string) => {
    onTagIdsChange(editedTagIds.filter((id) => id !== tagId));
  };

  return (
    <div className="space-y-6">
     
      {/* 标签显示 */}
      <div>
        <label className="text-sm font-medium text-muted-foreground mb-3 block">
          图片标签
        </label>

        {/* 编辑模式下的标签操作 */}
        {isEditing && (
          <div className="mb-4">
            <TagSelector
              tags={tags}
              tagGroups={tagGroups}
              selectedTagIds={editedTagIds}
              onTagsChange={onTagIdsChange}
              onCreateTag={async (name: string, groupId: string) => {
                const result = await createTag({ name, color: '#3b82f6', groupId });
                if (result.success) {
                  await onRefetch();
                  toast.success(`标签 "${name}" 已创建`);
                } else {
                  toast.error('创建标签失败');
                }
              }}
              placeholder="选择或创建标签"
              className="w-full"
            />
          </div>
        )}

        {/* 当前标签显示 */}
        <div className="flex flex-wrap gap-2">
          {editedTagIds.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            return tag ? (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                {tag.name}
                {isEditing && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeTag(tag.id)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                )}
              </Badge>
            ) : null;
          })}
          {editedTagIds.length === 0 && (
            <span className="text-xs text-muted-foreground">暂无标签</span>
          )}
        </div>
      </div>

      {/* 图片信息 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>创建时间: {formatDate(image.createdAt)}</span>
        </div>
        {image.updatedAt && image.updatedAt !== image.createdAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>更新时间: {formatDate(image.updatedAt)}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TagIcon className="w-3 h-3" />
          
        </div>
      </div>

      {/* 删除按钮 - 仅编辑模式显示 */}
      {isEditing && onDelete && (
        <div className="pt-4 border-t">
          <Button
            onClick={onDelete}
            variant="destructive"
            size="sm"
            disabled={deleteStatus === 'deleting'}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteStatus === 'confirming'
              ? '确认删除？'
              : deleteStatus === 'deleting'
                ? '删除中...'
                : '删除图片'}
          </Button>
        </div>
      )}
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
  onCopyPrompt,
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
  const { tags, refreshAll } = useTagOperations();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editedTagIds, setEditedTagIds] = useState<string[]>([]);

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

  // 初始化数据
  useEffect(() => {
    if (image && isOpen) {
      setEditedTitle(image.title);
      // 优先使用prompts数组
      if (image.prompts && image.prompts.length > 0) {
        setPrompts(image.prompts);
      } else {
        setPrompts([]);
      }
      // 初始化编辑中的标签为图片当前标签
      setEditedTagIds(
        Array.isArray(image.tags)
          ? image.tags
              .filter((tag: any) => tag !== null && tag !== undefined)
              .map((tag: any) => (typeof tag === 'string' ? tag : tag.id))
          : []
      );
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
      const updatedTags = editedTagIds.map(tagId => {
        const tag = tags.find((t: Tag) => t.id === tagId);
        return tag || { id: tagId, name: tagId, color: '#3b82f6', groupId: 'default' };
      });
      
      const updateData = {
        title: editedTitle,
        prompts: prompts,
        tags: updatedTags,
      };

      // 所有标签变更同步到数据库
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
      // 重置为编辑前的状态
      setEditedTitle(image.title);
      if (image.prompts && Array.isArray(image.prompts) && image.prompts.length > 0) {
        setPrompts(image.prompts);
      } else {
        setPrompts([]);
      }
      setEditedTagIds(
        Array.isArray(image.tags)
          ? image.tags
              .filter((tag: any) => tag !== null && tag !== undefined)
              .map((tag: any) => (typeof tag === 'string' ? tag : tag.id))
          : []
      );
      toast.info('已取消编辑');
    }
    setIsEditing(false);
  };

  // 复制全部提示词
  const copyAllPrompts = async () => {
    if (prompts.length === 0) {
      toast.error('没有提示词可复制');
      return;
    }

    const allPromptsText = prompts
      .map((p) => p.content || '')
      .filter(Boolean)
      .join('\n\n');

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
      setTimeout(() => {
        setDeleteStatus(current => current === 'confirming' ? 'idle' : current);
      }, 3000);
    } else if (deleteStatus === 'confirming') {
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
      toast.error('复制失败，请重试');
    }

    setTimeout(() => setDuplicateStatus('idle'), 2000);
  };

  // DnD 事件处理
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPrompts((items) => {
        const oldIndex = items.findIndex((item) => item.id === String(active.id));
        const newIndex = items.findIndex((item) => item.id === String(over.id));

        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({
          ...item,
          sortOrder: index,
        }));
      });
    }

    setActiveId(null);
  };

  // 添加新提示词
  const addPrompt = () => {
    const newPrompt: Prompt = {
      id: generateId(),
      title: '新提示词',
      content: '',
      color: AVAILABLE_COLORS[0],
      order: prompts.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPrompts([...prompts, newPrompt]);
  };

  // 更新提示词
  const updatePrompt = (id: string, updates: Partial<Prompt>) => {
    setPrompts(
      prompts.map((prompt) =>
        prompt.id === id
          ? { ...prompt, ...updates, updatedAt: new Date().toISOString() }
          : prompt
      )
    );
  };

  // 删除提示词
  const deletePrompt = (id: string) => {
    setPrompts(prompts.filter((prompt) => prompt.id !== id));
  };

  // 复制提示词内容
  const copyPromptContent = async (content: string) => {
    try {
      await copyToClipboard(content);
      toast.success('提示词已复制');
      if (onCopyPrompt) {
        onCopyPrompt(content);
      }
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const draggedPrompt = activeId ? prompts.find((p) => p.id === activeId) : null;

  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 flex flex-col">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full">
            {/* 图片预览区域 */}
            <div className="flex-1 min-w-0">
              <ImagePreview image={image} onClose={onClose} />
            </div>

            {/* 信息面板区域 */}
            <div className="w-96 border-l bg-background flex flex-col">
              {/* 顶部标题区域 */}
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold truncate">
                    {image.title || '图片详情'}
                  </DialogTitle>
                  <Button size="icon" variant="ghost" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <DialogDescription className="sr-only">
                  查看和编辑图片的详细信息，包括提示词和标签
                </DialogDescription>
              </DialogHeader>

              {/* 提示词管理区域 */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* 操作按钮 */}
                <div className="p-6 pb-4 border-b">
                  <ImageActions
                    isEditing={isEditing}
                    prompts={prompts}
                    onEdit={() => setIsEditing(true)}
                    onSave={saveChanges}
                    onCancel={cancelEdit}
                    onCopyAll={copyAllPrompts}
                    onDuplicate={handleDuplicate}
                    copyAllStatus={copyAllStatus}
                    duplicateStatus={duplicateStatus}
                  />
                </div>

                {/* 提示词滚动区域 */}
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 pt-4 space-y-4">
                      {/* 提示词列表 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-muted-foreground">
                            提示词块 ({prompts.length})
                          </label>
                          {isEditing && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={addPrompt}
                              className="text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              添加
                            </Button>
                          )}
                        </div>

                        <SortableContext
                          items={prompts.map((p) => p.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {prompts.map((prompt) => (
                              <PromptBlock
                                key={prompt.id}
                                prompt={{
                                  id: prompt.id,
                                  title: prompt.title || '新提示词',
                                  content: prompt.content || '',
                                  color: prompt.color || 'default'
                                }}
                                isEditing={isEditing}
                                onUpdate={(id, updates) => {
                                  updatePrompt(id, {
                                    title: updates.title || prompt.title,
                                    content: updates.content || prompt.content,
                                    color: updates.color || prompt.color
                                  });
                                }}
                                onDelete={deletePrompt}
                                onCopy={copyPromptContent}
                              />
                            ))}
                          </div>
                        </SortableContext>

                        {prompts.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">暂无提示词</p>
                            {isEditing && (
                              <p className="text-xs mt-1">点击上方按钮添加提示词</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </div>

              {/* 底部标签和按钮区域 */}
              <div className="border-t bg-muted/30">
                <ScrollArea className="max-h-64">
                  <div className="p-6">
                    <ImageInfo
                      image={image}
                      isEditing={isEditing}
                      onDelete={handleDelete}
                      deleteStatus={deleteStatus}
                      tags={tags}
                      editedTitle={editedTitle}
                      editedTagIds={editedTagIds}
                      onTitleChange={setEditedTitle}
                      onTagIdsChange={setEditedTagIds}
                      onRefetch={refreshAll}
                    />
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <DragOverlay>
            {draggedPrompt ? (
              <PromptBlock
                prompt={{
                  id: draggedPrompt.id,
                  title: draggedPrompt.title || '新提示词',
                  content: draggedPrompt.content || '',
                  color: draggedPrompt.color || 'default'
                }}
                isEditing={isEditing}
                onUpdate={() => {}}
                onDelete={() => {}}
                onCopy={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </DialogContent>
    </Dialog>
  );
}

export type { ImagePreviewProps, ImageActionsProps, ImageInfoProps };
