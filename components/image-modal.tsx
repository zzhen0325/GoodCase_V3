"use client"

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FileImage, X, Plus, Edit3, Save, Copy, Check, Trash2, Files, Calendar, Tag as TagIcon } from 'lucide-react';
import { PromptBlock } from './prompt-block';
import { TagManager } from './tag-manager';
import { ImageData, Prompt, Tag, AVAILABLE_COLORS } from '@/types';
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
  tags: Tag[];
  availableTags: Tag[];
  isEditing: boolean;
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
  onDelete?: () => void;
  deleteStatus: 'idle' | 'confirming' | 'deleting';
}



// 图片预览组件
function ImagePreview({ image, onClose }: ImagePreviewProps) {
  if (!image?.url) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 relative bg-muted/50">
        <div className="flex flex-col items-center justify-center text-center">
          <FileImage className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">图片加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-8 relative bg-muted/50">
      <img
        src={image.url}
        alt={image.title || '图片'}
        className="max-w-full max-h-[calc(85vh-8rem)] object-contain rounded-lg shadow-lg"
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
  duplicateStatus
}: ImageActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* 编辑相关按钮 */}
      {isEditing ? (
        <>
          <Button onClick={onSave} size="sm" className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
          <Button onClick={onCancel} variant="outline" size="sm">
            取消
          </Button>
        </>
      ) : (
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit3 className="w-4 h-4 mr-2" />
          编辑
        </Button>
      )}

      {/* 复制全部提示词 */}
      <Button
        onClick={onCopyAll}
        variant="outline"
        size="sm"
        disabled={prompts.length === 0}
        className={copyAllStatus === 'success' ? 'border-green-500 text-green-700' : ''}
      >
        {copyAllStatus === 'success' ? (
          <Check className="w-4 h-4 mr-2" />
        ) : (
          <Copy className="w-4 h-4 mr-2" />
        )}
        {copyAllStatus === 'success' ? '已复制' : '复制全部'}
      </Button>

      {/* 复制图片 */}
      {onDuplicate && (
        <Button
          onClick={onDuplicate}
          variant="outline"
          size="sm"
          className={duplicateStatus === 'success' ? 'border-green-500 text-green-700' : ''}
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
  tags,
  availableTags,
  isEditing,
  onTagsChange,
  onCreateTag,
  onDelete,
  deleteStatus
}: ImageInfoProps) {
  return (
    <div className="space-y-4">
      {/* 标签管理 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TagIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">标签</span>
        </div>
        <TagManager
           tags={tags}
           selectedTags={tags}
           availableTags={availableTags}
           isEditing={isEditing}
           onTagsChange={onTagsChange}
           onCreateTag={onCreateTag}
         />
      </div>

      {/* 编辑模式下的删除按钮 */}
      {isEditing && onDelete && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-red-600">危险操作</span>
          </div>
          <Button
            onClick={onDelete}
            variant={deleteStatus === 'confirming' ? 'destructive' : 'outline'}
            size="sm"
            disabled={deleteStatus === 'deleting'}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteStatus === 'confirming' ? '确认删除' : deleteStatus === 'deleting' ? '删除中...' : '删除图片'}
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
  availableTags,
  onCreateTag,
  onCopyPrompt
}: ImageModalProps) {
  // 状态管理
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[85vh] max-h-[85vh] p-0">
        <div className="h-full flex">
          {/* 图片预览区域 */}
          <div className="w-[40%] relative">
            <ImagePreview image={image} onClose={onClose} />
          </div>

          {/* 信息面板区域 */}
          <div className="w-[60%] border-l bg-background">
            <DialogHeader className="p-6 pb-4">
              {/* 移除标题，将在底部显示 */}
            </DialogHeader>
            
            <div className="h-[calc(85vh-180px)] flex flex-col">
              <div className="px-6 pb-4">
                {/* 提示词管理区域 */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Prompts</h4>
                  {isEditing && (
                    <Button size="sm" variant="outline" onClick={() => {
                      const newPrompt: Prompt = {
                        id: generateId(),
                        title: '',
                        content: '',
                        color: AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)],
                        order: prompts.length,
                        createdAt: new Date().toISOString()
                      };
                      setPrompts([...prompts, newPrompt]);
                    }}>
                      <Plus className="w-4 h-4 mr-1" />
                      添加
                    </Button>
                  )}
                </div>
              </div>
              
              {/* 提示词滚动区域 */}
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-3 pb-4">
                  <DndContext
                    sensors={useSensors(
                      useSensor(PointerSensor, {
                        activationConstraint: {
                          distance: 8,
                        },
                      }),
                      useSensor(KeyboardSensor, {
                        coordinateGetter: sortableKeyboardCoordinates,
                      })
                    )}
                    collisionDetection={closestCenter}
                    onDragStart={(event: any) => setActiveId(event.active.id)}
                    onDragEnd={(event: any) => {
                      const { active, over } = event;
                      if (active.id !== over?.id) {
                        const oldIndex = prompts.findIndex(item => item.id === active.id);
                        const newIndex = prompts.findIndex(item => item.id === over.id);
                        const reorderedPrompts = arrayMove(prompts, oldIndex, newIndex);
                        setPrompts(reorderedPrompts);
                      }
                      setActiveId(null);
                    }}
                  >
                    <SortableContext items={prompts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                      {prompts.map((prompt) => (
                        <PromptBlock
                          key={prompt.id}
                          prompt={prompt}
                          isEditing={isEditing}
                          onUpdate={(id: string, updates: Partial<Prompt>) => {
                            const updatedPrompts = prompts.map(prompt => 
                              prompt.id === id ? { ...prompt, ...updates } : prompt
                            );
                            setPrompts(updatedPrompts);
                          }}
                          onDelete={(id: string) => {
                            const updatedPrompts = prompts.filter(prompt => prompt.id !== id);
                            setPrompts(updatedPrompts);
                          }}
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
                          onClick={() => {
                            const newPrompt: Prompt = {
                              id: generateId(),
                              title: '',
                              content: '',
                              color: AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)],
                              order: prompts.length,
                              createdAt: new Date().toISOString()
                            };
                            setPrompts([...prompts, newPrompt]);
                          }}
                          className="mt-2"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          添加第一个提示词
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="px-6">
                <Separator className="mb-4" />
                {/* 图片信息 */}
                <ImageInfo
                  image={image}
                  tags={tags}
                  availableTags={availableTags}
                  isEditing={isEditing}
                  onTagsChange={setTags}
                  onCreateTag={onCreateTag}
                  onDelete={onDelete ? handleDelete : undefined}
                  deleteStatus={deleteStatus}
                />
                
                {/* 底部标题和按钮区域 */}
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold truncate">
                      {image.title || '未命名图片'}
                    </h2>
                  </div>
                  <div className="flex-shrink-0">
                    <ImageActions
                      isEditing={isEditing}
                      prompts={prompts}
                      onEdit={() => setIsEditing(true)}
                      onSave={saveChanges}
                      onCancel={cancelEdit}
                      onCopyAll={copyAllPrompts}
                      onDuplicate={onDuplicate ? handleDuplicate : undefined}
                      copyAllStatus={copyAllStatus}
                      duplicateStatus={duplicateStatus}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 导出类型
export type {
  ImagePreviewProps,
  ImageActionsProps,
  ImageInfoProps
};