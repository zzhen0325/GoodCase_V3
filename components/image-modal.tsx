'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Tag,
} from 'lucide-react';
import { PromptBlock } from './prompt-block';
import { useTagOperations } from '@/hooks/use-tag-operations';

import {
  ImageData,
  PromptBlock as PromptBlockType,
  AVAILABLE_COLORS,
} from '@/types';
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

  onCopyPrompt?: (content: string) => void;
}

interface ImagePreviewProps {
  image: ImageData;
  onClose: () => void;
}

interface ImageActionsProps {
  isEditing: boolean;
  prompts: PromptBlockType[];
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
}: ImageInfoProps) {
  const { tags, tagGroups, createTag, refreshTags } = useTagOperations();
  const [newTagName, setNewTagName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);

  // 获取图片当前的标签
  const imageTags = tags.filter((tag) => image.tags?.includes(tag.name));

  // 获取可选择的标签（排除已选择的）
  const availableTags = tags.filter((tag) => !image.tags?.includes(tag.name));

  // 处理添加新标签
  const handleAddNewTag = async () => {
    if (!newTagName.trim() || !selectedGroupId) {
      toast.error('请输入标签名称并选择分组');
      return;
    }

    try {
      const newTag = await createTag({
        name: newTagName.trim(),
        groupId: selectedGroupId,
        usageCount: 0,
        color: AVAILABLE_COLORS[0],
      });

      if (newTag) {
        // 将新标签添加到图片的本地状态
        const updatedTags = [...(image.tags || []), newTag.name];
        onUpdate?.({ tags: updatedTags });

        setNewTagName('');
        setSelectedGroupId('');
        setShowAddTag(false);
        // createTag 已经包含了刷新逻辑，无需重复调用
        toast.success('标签创建并添加成功');
      }
    } catch (error) {
      toast.error('创建标签失败');
    }
  };

  // 处理选择已有标签
  const handleSelectTag = (tagId: string) => {
    try {
      const tag = tags.find((t) => t.id === tagId);
      if (tag) {
        const updatedTags = [...(image.tags || []), tag.name];
        onUpdate?.({ tags: updatedTags });
        toast.success('标签已添加');
      }
    } catch (error) {
      toast.error('添加标签失败');
    }
  };

  // 处理移除标签
  const handleRemoveTag = (tagName: string) => {
    try {
      const updatedTags = (image.tags || []).filter((name) => name !== tagName);
      onUpdate?.({ tags: updatedTags });
      toast.success('标签已移除');
    } catch (error) {
      toast.error('移除标签失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* 标签区域 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">标签</span>
        </div>

        {/* 当前标签显示 */}
        {imageTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imageTags.map((tag) => {
              const group = tagGroups.find((g) => g.id === tag.groupId);
              return (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                  style={{
                    backgroundColor: group?.color + '20',
                    borderColor: group?.color,
                    color: group?.color,
                  }}
                >
                  {tag.name}
                  {isEditing && (
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-500"
                      onClick={() => handleRemoveTag(tag.name)}
                    />
                  )}
                </Badge>
              );
            })}
          </div>
        )}

        {/* 编辑模式下的标签操作 */}
        {isEditing && (
          <div className="space-y-3">
            {/* 选择已有标签 */}
            {availableTags.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  选择已有标签
                </label>
                <Select onValueChange={handleSelectTag}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择标签" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.map((tag) => {
                      const group = tagGroups.find((g) => g.id === tag.groupId);
                      return (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: group?.color }}
                            />
                            <span>{tag.name}</span>
                            <span className="text-xs text-gray-400">
                              ({group?.name})
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 新建标签 */}
            <div>
              {!showAddTag ? (
                <Button
                  onClick={() => setShowAddTag(true)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新建标签
                </Button>
              ) : (
                <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">新建标签</span>
                    <Button
                      onClick={() => {
                        setShowAddTag(false);
                        setNewTagName('');
                        setSelectedGroupId('');
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <Input
                    placeholder="输入标签名称"
                    value={newTagName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewTagName(e.target.value)
                    }
                    className="text-sm"
                  />

                  <Select
                    value={selectedGroupId}
                    onValueChange={setSelectedGroupId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分组" />
                    </SelectTrigger>
                    <SelectContent>
                      {tagGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleAddNewTag}
                    size="sm"
                    className="w-full"
                    disabled={!newTagName.trim() || !selectedGroupId}
                  >
                    创建并添加
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 编辑模式下的删除按钮 - 右下角 */}
      {isEditing && onDelete && (
        <div className="flex justify-end">
          <Button
            onClick={onDelete}
            variant={deleteStatus === 'confirming' ? 'destructive' : 'outline'}
            size="sm"
            disabled={deleteStatus === 'deleting'}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleteStatus === 'confirming'
              ? '确认删除'
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [prompts, setPrompts] = useState<PromptBlockType[]>([]);
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
      // 优先使用prompts数组，如果没有则使用description作为后备
      if (image.prompts && image.prompts.length > 0) {
        setPrompts(image.prompts);
      } else if (image.description) {
        setPrompts([
          {
            id: generateId(),
            text: image.description,
            title: '',
            imageId: image.id,
            sortOrder: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      } else {
        setPrompts([]);
      }
      // 初始化编辑中的标签为图片当前标签
      setEditedTagIds([...(image.tags || [])]);
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
        tags: editedTagIds,
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
      // 优先使用prompts数组，如果没有则使用description作为后备
      if (
        image.prompts &&
        Array.isArray(image.prompts) &&
        image.prompts.length > 0
      ) {
        setPrompts(image.prompts);
      } else if (image.description) {
        setPrompts([
          {
            id: generateId(),
            text: image.description,
            sortOrder: 0,
            createdAt: new Date(),
            title: '',
            imageId: image?.id || '',
            updatedAt: new Date(),
          },
        ]);
      } else {
        setPrompts([]);
      }
      setEditedTagIds([...(image.tags || [])]);
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
      .map((p) => p.text)
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
      <DialogContent className="max-w-7xl w-[95vw] h-[85vh] max-h-[85vh] p-0 ">
        <DialogTitle className="sr-only">
          {image.title || '图片详情'}
        </DialogTitle>
        <div className="h-full flex">
          {/* 图片预览区域 */}
          <div className="w-[40%] relative">
            <ImagePreview image={image} onClose={onClose} />
          </div>

          {/* 信息面板区域 */}
          <div className="w-[60%] border-l bg-background  h-[85vh] max-h-[85vh]  flex flex-col overflow-hidden rounded-r-lg">
            {/* 顶部标题区域 - 固定高度 */}
            <div className="flex-shrink-0 px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold truncate pr-4">
                  {image.title || '未命名图片'}
                </h2>
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

            {/* 中间提示词滚动区域 - 自适应高度 */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-shrink-0 px-6 py-4">
                {/* 提示词管理区域 */}
                <div className="flex items-center justify-between">
                  {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newPrompt: PromptBlockType = {
                          id: generateId(),
                          text: '',
                          title: '',
                          imageId: image?.id || '',
                          sortOrder: prompts.length,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        };
                        setPrompts([...prompts, newPrompt]);
                      }}
                    >
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
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={(event: any) => setActiveId(event.active.id)}
                    onDragEnd={(event: any) => {
                      const { active, over } = event;
                      if (active.id !== over?.id) {
                        const oldIndex = prompts.findIndex(
                          (item) => item.id === active.id
                        );
                        const newIndex = prompts.findIndex(
                          (item) => item.id === over.id
                        );
                        const reorderedPrompts = arrayMove(
                          prompts,
                          oldIndex,
                          newIndex
                        );
                        // 更新排序字段
                        const updatedPrompts = reorderedPrompts.map(
                          (item, index) => ({
                            ...item,
                            sortOrder: index,
                          })
                        );
                        setPrompts(updatedPrompts);
                      }
                      setActiveId(null);
                    }}
                  >
                    <SortableContext
                      items={prompts.map((p) => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {prompts.map((prompt) => (
                        <PromptBlock
                          key={prompt.id}
                          prompt={prompt}
                          isEditing={isEditing}
                          onUpdate={(
                            id: string,
                            updates: Partial<PromptBlockType>
                          ) => {
                            const updatedPrompts = prompts.map((prompt) =>
                              prompt.id === id
                                ? { ...prompt, ...updates }
                                : prompt
                            );
                            setPrompts(updatedPrompts);
                          }}
                          onDelete={(id: string) => {
                            const updatedPrompts = prompts.filter(
                              (prompt) => prompt.id !== id
                            );
                            setPrompts(updatedPrompts);
                          }}
                          onCopy={onCopyPrompt || (() => {})}
                          onEnterEditMode={() => setIsEditing(true)}
                        />
                      ))}
                    </SortableContext>

                    <DragOverlay>
                      {activeId ? (
                        <PromptBlock
                          prompt={prompts.find((p) => p.id === activeId)!}
                          isEditing={isEditing}
                          onUpdate={() => {}}
                          onDelete={() => {}}
                          onCopy={() => {}}
                          onEnterEditMode={() => {}}
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
                            const newPrompt: PromptBlockType = {
                              id: generateId(),
                              text: '',
                              title: '',
                              imageId: image?.id || '',
                              sortOrder: prompts.length,
                              createdAt: new Date(),
                              updatedAt: new Date(),
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
            </div>

            {/* 底部标签和按钮区域 - 限制高度 */}
            <div className="flex-shrink-0 border-t max-h-48 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-1 py-4">
                  {/* 图片信息 */}
                  <ImageInfo
                    image={{ ...image, tags: editedTagIds }}
                    isEditing={isEditing}
                    onDelete={onDelete ? handleDelete : undefined}
                    deleteStatus={deleteStatus}
                    onUpdate={(updates) => {
                      if (updates.tags) {
                        // 更新本地状态
                        setEditedTagIds(updates.tags);
                        // 如果不在编辑模式，立即保存到数据库
                        if (!isEditing && image) {
                          onUpdate(image.id, { tags: updates.tags });
                        }
                      }
                    }}
                  />
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 导出类型
export type { ImagePreviewProps, ImageActionsProps, ImageInfoProps };
