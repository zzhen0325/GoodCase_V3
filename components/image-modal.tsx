'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, FolderOpen, Folder } from 'lucide-react';
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
  ArrowLeft,
} from 'lucide-react';
import { PromptBlock } from './prompt-block';
import { useTagOperations } from '@/hooks/use-tag-operations';
import { database } from '@/lib/database';

import {
  ImageData,
  Prompt,
  Tag,
  TagGroup,
  AVAILABLE_COLORS,
  getColorTheme,
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
  onAddPrompt?: () => void;
  tags?: Tag[];
  tagGroups?: any[];
  editedTagIds?: string[];
  onTagIdsChange?: (tagIds: string[]) => void;
  onRefetch?: () => void;
  tagSelectorOpen?: boolean;
  setTagSelectorOpen?: (open: boolean) => void;
  onDelete?: () => void;
  deleteStatus: 'idle' | 'confirming' | 'deleting';
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
  tagSelectorOpen: boolean;
  setTagSelectorOpen: (open: boolean) => void;
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
    <div className="w-full h-full flex items-center justify-center p-8 relative bg-white">
      <img
        src={image.url}
        alt={image.title || '图片'}
        className="max-w-full max-h-[calc(85vh-8rem)] object-contain rounded-2xl"
        loading="lazy"
      />
    </div>
  );
}

// 创建标签表单组件
interface CreateTagFormProps {
  searchQuery: string;
  tagGroups: TagGroup[];
  onConfirm: (data: { name: string; categoryId?: string }) => void;
  onCancel: () => void;
  onCreateCategory: () => void;
  selectedTagIds?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  tags?: Tag[];
  onRefetch?: () => void;
}

function CreateTagForm({ searchQuery, tagGroups, onConfirm, onCancel, onCreateCategory, selectedTagIds = [], onTagsChange, tags = [], onRefetch }: CreateTagFormProps) {
  const [name, setName] = React.useState(searchQuery);
  const [categoryId, setCategoryId] = React.useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const { createTagGroup, createTag } = useTagOperations();

  React.useEffect(() => {
    if (tagGroups.length > 0) {
      setCategoryId(tagGroups[0].id);
    } else {
      setCategoryId('');
    }
  }, [tagGroups]);

  const handleSubmit = async () => {
    if (name.trim()) {
      let finalCategoryId = categoryId;
      
      // 如果选择的是新分类，先创建分类
      if (categoryId && categoryId.startsWith('new:')) {
        const newCategoryName = categoryId.replace('new:', '');
        try {
          const result = await createTagGroup({ name: newCategoryName });
          if (result.success) {
            // 使用新创建的分类ID
            finalCategoryId = result.tagGroup?.id || undefined;
          } else {
            toast.error(result.error || '创建分类失败');
            return;
          }
        } catch (error) {
          console.error('创建分类失败:', error);
          toast.error('创建分类失败');
          return;
        }
      }
      
      // 创建标签
      try {
        const result = await createTag({
          name: name.trim(),
          color: '#64748b',
          categoryId: finalCategoryId || undefined
        });
        
        if (result.success) {
          // 刷新标签列表
          if (onRefetch) {
            onRefetch();
          }
          
          // 如果提供了onTagsChange函数，自动添加新标签到图片
          if (onTagsChange && result.tag) {
            const newTagId = result.tag.id;
            if (!selectedTagIds.includes(newTagId)) {
              onTagsChange([...selectedTagIds, newTagId]);
            }
          }
          
          toast.success('标签创建成功并已添加到图片');
          onCancel();
        } else {
          toast.error(result.error || '创建标签失败');
        }
      } catch (error) {
        console.error('创建标签失败:', error);
        toast.error('创建标签失败');
      }
    }
  };

  const handleCreateNewCategory = () => {
    setShowNewCategoryInput(true);
  };

  const handleConfirmNewCategory = () => {
    if (newCategoryName.trim()) {
      // 只是确认新分类名称，不立即创建
      setShowNewCategoryInput(false);
      // 将新分类名称设置为当前选中的分类ID（临时标记）
      setCategoryId(`new:${newCategoryName.trim()}`);
    }
  };

  const handleCancelNewCategory = () => {
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    // 如果当前选中的是新分类，重置为第一个现有分类
    if (categoryId && categoryId.startsWith('new:')) {
      setCategoryId(tagGroups.length > 0 ? tagGroups[0].id : '');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3 mt-6">
          <TagIcon className="w-4 h-4 text-accent-foreground" />
          <Label htmlFor="tag-name" className="text-sm font-medium">
            标签名称
          </Label>
        </div>
        <Input
          id="tag-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入标签名称"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Folder className="w-4 h-4 text-accent-foreground" />
          <Label htmlFor="tag-category" className="text-sm font-medium">
            所属分类
          </Label>
        </div>
        {!showNewCategoryInput ? (
          // 显示现有分类选择
          tagGroups.length > 0 ? (
            <div className="space-y-3">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                  
                    <SelectValue placeholder="选择分类" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {tagGroups.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {categoryId && categoryId.startsWith('new:') && (
                    <SelectItem value={categoryId}>
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <span>新分类: {categoryId.replace('new:', '')}</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateNewCategory}
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建新分类
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-full p-3 border rounded-md bg-muted text-muted-foreground text-sm flex items-center gap-2">
                <Folder className="w-4 h-4" />
                <span>暂无分类，标签将创建为未分类状态</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateNewCategory}
                className="w-full flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建新分类
              </Button>
            </div>
          )
        ) : (
          // 显示创建新分类输入框
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <Label htmlFor="new-category-name" className="text-sm font-medium">
                创建新分类
              </Label>
            </div>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="输入新分类名称"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmNewCategory();
                } else if (e.key === 'Escape') {
                  handleCancelNewCategory();
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelNewCategory}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                取消
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmNewCategory}
                disabled={!newCategoryName.trim()}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-1" />
                确认
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2 ">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex items-center gap-2 px-5"
        >
          <X className="w-4 h-4" />
          取消
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!name?.trim()}
          className="flex items-center gap-2 px-5"
        >
          <Plus className="w-4 h-4" />
          创建标签
        </Button>
      </div>
    </div>
  );
}

// 创建分类表单组件
interface CreateCategoryFormProps {
  onConfirm: (data: { name: string }) => void;
  onCancel: () => void;
}

function CreateCategoryForm({ onConfirm, onCancel }: CreateCategoryFormProps) {
  const [name, setName] = React.useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm({ name: name.trim() });
      onCancel();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category-name">分类名称</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入分类名称"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          取消
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!name?.trim()}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          创建分类
        </Button>
      </div>
    </div>
  );
}

// 标签选择下拉组件
interface TagSelectorDropdownProps {
  tags: Tag[];
  tagGroups: TagGroup[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch?: () => void;
}

function TagSelectorDropdown({
  tags,
  tagGroups,
  selectedTagIds,
  onTagsChange,
  open,
  onOpenChange,
  onRefetch,
}: TagSelectorDropdownProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreateTagDialog, setShowCreateTagDialog] = React.useState(false);
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = React.useState(false);
  const { createTag, createTagGroup } = useTagOperations();

  // 按分类聚合标签
  const groupedTags = React.useMemo(() => {
    const grouped: { [key: string]: { group: TagGroup | null; tags: Tag[] } } = {};
    
    // 添加未分类组
    grouped['uncategorized'] = { group: null, tags: [] };
    
    // 初始化分类组
    tagGroups.forEach(group => {
      grouped[group.id] = { group, tags: [] };
    });
    
    // 分配标签到对应分类
    tags.forEach(tag => {
      const groupKey = tag.categoryId || 'uncategorized';
      if (grouped[groupKey]) {
        grouped[groupKey].tags.push(tag);
      } else {
        grouped['uncategorized'].tags.push(tag);
      }
    });
    
    return grouped;
  }, [tags, tagGroups]);

  // 过滤标签
  const filteredGroupedTags = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedTags;
    
    const filtered: typeof groupedTags = {};
    Object.entries(groupedTags).forEach(([key, { group, tags }]) => {
      const filteredTags = tags.filter(tag => 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredTags.length > 0) {
        filtered[key] = { group, tags: filteredTags };
      }
    });
    
    return filtered;
  }, [groupedTags, searchQuery]);

  // 检查是否有匹配的标签
  const hasMatchingTags = React.useMemo(() => {
    return Object.values(filteredGroupedTags).some(({ tags }) => tags.length > 0);
  }, [filteredGroupedTags]);

  // 检查搜索的标签是否已存在
  const searchTagExists = React.useMemo(() => {
    if (!searchQuery.trim()) return false;
    return tags.some(tag => tag.name.toLowerCase() === searchQuery.toLowerCase());
  }, [tags, searchQuery]);

  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (!searchQuery.trim() || searchTagExists) return;
    setShowCreateTagDialog(true);
  };

  const handleCreateTagConfirm = async (data: { name: string; categoryId?: string }) => {
    // 这个函数现在不再需要，因为CreateTagForm直接处理创建逻辑
    // 保留为空函数以保持接口兼容性
  };

  const handleCreateCategoryConfirm = async (data: { name: string }) => {
    try {
      const result = await createTagGroup(data);
      
      if (result.success) {
        // 刷新标签列表
        if (onRefetch) {
          onRefetch();
        }
        toast.success('分类创建成功');
      } else {
        toast.error(result.error || '创建分类失败');
      }
    } catch (error) {
      console.error('创建分类失败:', error);
      toast.error('创建分类失败');
    }
  };

  return (
    <>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <TagIcon className="w-4 h-4" />
            Add Tag
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-96 overflow-x-hidden" onCloseAutoFocus={(e) => e.preventDefault()}>
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-y-auto">
            {/* 显示创建新标签选项 */}
            {searchQuery.trim() && !searchTagExists && !hasMatchingTags && (
              <div>
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                  创建新标签
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleCreateTag}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>创建 "{searchQuery.trim()}"</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </div>
            )}
            
            {Object.entries(filteredGroupedTags).map(([key, { group, tags }]) => {
              if (tags.length === 0) return null;
              
              return (
                <div key={key}>
                  {group && (
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                      {group.name}
                    </DropdownMenuLabel>
                  )}
                  {!group && tags.length > 0 && (
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                      未分类
                    </DropdownMenuLabel>
                  )}
                  {tags.map((tag) => (
                     <DropdownMenuCheckboxItem
                       key={tag.id}
                       checked={selectedTagIds.includes(tag.id)}
                       onCheckedChange={() => handleTagToggle(tag.id)}
                       onSelect={(e) => e.preventDefault()}
                       className="cursor-pointer whitespace-normal break-words"
                     >
                       <span className="break-words">{tag.name}</span>
                     </DropdownMenuCheckboxItem>
                   ))}
                  {key !== 'uncategorized' && <DropdownMenuSeparator />}
                </div>
              );
            })}
            
            {/* 当搜索有结果但没有完全匹配时，也显示创建选项 */}
            {searchQuery.trim() && !searchTagExists && hasMatchingTags && (
              <div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1">
                  创建新标签
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={handleCreateTag}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>创建 "{searchQuery.trim()}"</span>
                </DropdownMenuItem>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* 创建标签对话框 */}
      <Dialog open={showCreateTagDialog} onOpenChange={setShowCreateTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建标签</DialogTitle>
            
          </DialogHeader>
          <CreateTagForm
            searchQuery={searchQuery}
            tagGroups={tagGroups}
            onConfirm={handleCreateTagConfirm}
            onCancel={() => setShowCreateTagDialog(false)}
            onCreateCategory={() => {
              setShowCreateTagDialog(false);
              setShowCreateCategoryDialog(true);
            }}
            selectedTagIds={selectedTagIds}
            onTagsChange={onTagsChange}
            tags={tags}
            onRefetch={onRefetch}
          />
        </DialogContent>
      </Dialog>

      {/* 创建分类对话框 */}
      <Dialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建标签分类</DialogTitle>
            <DialogDescription>创建一个新的标签分类来组织您的标签。</DialogDescription>
          </DialogHeader>
          <CreateCategoryForm
            onConfirm={handleCreateCategoryConfirm}
            onCancel={() => setShowCreateCategoryDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
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
  onAddPrompt,
  tags,
  tagGroups,
  editedTagIds,
  onTagIdsChange,
  onRefetch,
  tagSelectorOpen,
  setTagSelectorOpen,
  onDelete,
  deleteStatus,
}: ImageActionsProps) {
  const { createTag } = useTagOperations();

  return (
    <div className="flex flex-wrap gap-2 items-center relative">
      {/* 编辑相关按钮 */}
      {isEditing ? (
        <>
          {/* 删除按钮 - 编辑模式第一个 */}
          {onDelete && (
            <Button
              onClick={onDelete}
              variant="destructive"
              size="sm"
              disabled={deleteStatus === 'deleting'}
            >
              <Trash2 className="w-4 h-4" />
              {deleteStatus === 'confirming'
                ? '确认删除？'
                : deleteStatus === 'deleting'
                  ? '删除中...'
                  : '删除'}
            </Button>
          )}
          <Separator orientation="vertical" className="h-6 mx-4" />
          {/* Add Prompt 按钮 */}
          <Button
            onClick={onAddPrompt}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 text-black" />
            Add Prompt
          </Button>
          
          {/* Add Tag 下拉按钮 */}
          {tags && tagGroups && editedTagIds && onTagIdsChange && onRefetch && (
            <TagSelectorDropdown
              tags={tags}
              tagGroups={tagGroups}
              selectedTagIds={editedTagIds}
              onTagsChange={onTagIdsChange}
              open={tagSelectorOpen || false}
              onOpenChange={setTagSelectorOpen || (() => {})}
              onRefetch={onRefetch}
            />
          )}
          
          <Separator orientation="vertical" className="h-6 mx-4" />
          
          {/* Save 按钮 */}
          <Button
            key="save"
            onClick={onSave}
            size="sm"
            className="bg-black hover:bg-black text-white px-4"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          
          {/* Cancel 按钮 */}
          <Button
            key="cancel"
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Cancel
          </Button>
        </>
      ) : (
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit3 className="w-4 h-4" />
          Edit
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
            <Check className="w-4 h-4 " />
          ) : (
            <Copy className="w-4 h-4 " />
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
            <Check className="w-4 h-4 " />
          ) : (
            <Files className="w-4 h-4 " />
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
  tagSelectorOpen,
  setTagSelectorOpen,
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
        <label className="text-sm font-medium text-black mb-6">
          Tags
        </label>



        {/* 当前标签显示 */}
        <div className="flex flex-wrap gap-2 mt-4">
          {editedTagIds.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            const tagGroup = tag ? tagGroups.find(g => g.id === tag.categoryId) : null;
            const colorTheme = tagGroup ? getColorTheme(tagGroup.color || 'gray') : getColorTheme('gray');
            return tag ? (
              <Badge
                key={tag.id}
                variant="secondary"
                className="h-8 py-4 text-xs font-medium rounded-xl border"
                style={{
                  backgroundColor: colorTheme.bg,
                  borderColor: colorTheme.primary,
                  color: colorTheme.text
                }}
              >
                {tag.name}
                {isEditing && (
                  <Button
                    size="icon"
                    className="ml-2 h-5 w-5 bg-white/40 hover:bg-white"
                    onClick={() => removeTag(tag.id)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                )}
              </Badge>
            ) : null;
          })}
          {editedTagIds.length === 0 && (
            <span className="text-xs text-black">暂无标签</span>
          )}
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
  const { tags, tagGroups, createTag, refreshAll } = useTagOperations();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editedTagIds, setEditedTagIds] = useState<string[]>([]);
  const [tagSelectorOpen, setTagSelectorOpen] = useState(false);

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
        return tag || { id: tagId, name: tagId, color: '#3b82f6', categoryId: 'default' };
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
      <DialogContent className="max-w-[70vw] h-[75vh] p-0 flex flex-col rounded-2xl overflow-hidden gap-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">

            {/* 顶部标题区域 */}
              <DialogHeader className="p-6 border-b">
                <div className="flex items-center gap-4">
                  {/* 返回按钮 - 最左侧
                  <Button size="icon" variant="ghost" onClick={onClose} className="bg-muted">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                   */}
                  {/* 标题 - 中间 */}
                  <DialogTitle className="text-lg font-semibold truncate flex-1">
                    {image.title || '图片详情'}
                  </DialogTitle>
                  
                  
                  
                  {/* 操作按钮区域 - 最右侧 */}
                  <div className="flex items-center">
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
                      onAddPrompt={addPrompt}
                      tags={tags}
                      tagGroups={tagGroups}
                      editedTagIds={editedTagIds}
                      onTagIdsChange={setEditedTagIds}
                      onRefetch={refreshAll}
                      tagSelectorOpen={tagSelectorOpen}
                      setTagSelectorOpen={setTagSelectorOpen}
                      onDelete={handleDelete}
                      deleteStatus={deleteStatus}
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
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
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


                {/* 提示词滚动区域 */}
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 pt-4 space-y-4">
                      {/* 提示词列表 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-md font-medium text-black">
                            Prompts 
                          </label>
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
                                  title: prompt.title || 'Default',
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
              <div className="border-t flex-shrink-0">
                <ScrollArea className="max-h-60">
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
                      tagSelectorOpen={tagSelectorOpen}
                      setTagSelectorOpen={setTagSelectorOpen}
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
