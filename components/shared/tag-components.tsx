'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  X,
  Tag as TagIcon,
  FolderOpen,
  Folder,
  Loader2,
} from 'lucide-react';
import { Tag, TagCategory, getColorTheme } from '@/types';
import { useTagOperations } from '@/hooks/use-tag-operations';
import { toast } from '@/lib/enhanced-toast';

// 创建标签表单组件
interface CreateTagFormProps {
  searchQuery: string;
  tagCategories: TagCategory[];
  onConfirm: (data: { name: string; categoryId?: string }) => void;
  onCancel: () => void;
  onCreateCategory: () => void;
  selectedTagIds?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  tags?: Tag[];
  onRefetch?: () => void;
}

export function CreateTagForm({
  searchQuery,
  tagCategories,
  onConfirm,
  onCancel,
  onCreateCategory,
  selectedTagIds = [],
  onTagsChange,
  tags = [],
  onRefetch,
}: CreateTagFormProps) {
  const [name, setName] = React.useState(searchQuery);
  const [categoryId, setCategoryId] = React.useState<string>('');
  const [isCreating, setIsCreating] = React.useState(false);
  const { createTag } = useTagOperations();

  const handleSubmit = async () => {
    if (!name.trim() || isCreating) return;

    setIsCreating(true);
    
    // 显示进度条
    const progressToastId = toast.progress({
      progress: 0,
      message: '正在创建标签...',
      description: `创建标签 "${name.trim()}"`
    });

    try {
      // 模拟进度更新
      toast.updateProgress(progressToastId, {
        progress: 30,
        message: '验证标签信息...'
      });

      const result = await createTag({
        name: name.trim(),
        categoryId: categoryId || tagCategories[0]?.id || "",
      });

      toast.updateProgress(progressToastId, {
        progress: 80,
        message: '保存标签数据...'
      });

      if (result.success) {
        // 刷新标签列表
        if (onRefetch) {
          onRefetch();
        }

        // 如果有选择回调，自动选中新创建的标签
        if (onTagsChange && result.tag) {
          onTagsChange([...selectedTagIds, result.tag.id]);
        }

        toast.completeProgress(progressToastId, '标签创建成功');
        onCancel(); // 关闭对话框
      } else {
        toast.failProgress(progressToastId, result.error || '创建标签失败');
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      toast.failProgress(progressToastId, '创建标签失败');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tag-name">标签名称</Label>
        <Input
          id="tag-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入标签名称"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tag-category">标签分类</Label>
        <div className="flex gap-2">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="选择分类（可选）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">无分类</SelectItem>
              {tagCategories.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getColorTheme(group.color || 'gray')
                          .primary,
                      }}
                    />
                    {group.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCreateCategory}
            className="flex items-center gap-2 px-3"
          >
            <Plus className="w-4 h-4" />
            新建分类
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
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
          disabled={!name?.trim() || isCreating}
          className="flex items-center gap-2 px-5"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {isCreating ? '创建中...' : '创建标签'}
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

export function CreateCategoryForm({
  onConfirm,
  onCancel,
}: CreateCategoryFormProps) {
  const [name, setName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || isCreating) return;
    
    setIsCreating(true);
    
    // 显示进度条
    const progressToastId = toast.progress({
      progress: 0,
      message: '正在创建分类...',
      description: `创建分类 "${name.trim()}"`
    });

    try {
      // 模拟进度更新
      toast.updateProgress(progressToastId, {
        progress: 50,
        message: '验证分类信息...'
      });

      await onConfirm({ name: name.trim() });
      
      toast.completeProgress(progressToastId, '分类创建成功');
    } catch (error) {
      console.error('创建分类失败:', error);
      toast.failProgress(progressToastId, '创建分类失败');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category-name">分类名称</Label>
        <Input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入分类名称"
          autoFocus
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
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
          disabled={!name?.trim() || isCreating}
          className="flex items-center gap-2 px-5"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {isCreating ? '创建中...' : '创建分类'}
        </Button>
      </div>
    </div>
  );
}

// 标签选择下拉组件
// TagSelectorDropdown 组件已移动到 @/components/shared/TagSelectorDropdown
// 请使用: import { TagSelectorDropdown } from '@/components/shared/TagSelectorDropdown';

// 标签显示组件
interface TagDisplayProps {
  tagIds: string[];
  tags: Tag[];
  tagCategories: TagCategory[];
  isEditing?: boolean;
  onRemoveTag?: (tagId: string) => void;
  emptyText?: string;
  keyPrefix?: string;
}

export function TagDisplay({
  tagIds,
  tags,
  tagCategories,
  isEditing = false,
  onRemoveTag,
  emptyText = '暂无标签',
  keyPrefix = 'tag',
}: TagDisplayProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tagIds.map((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        const tagCategory = tag
          ? tagCategories.find((g) => g.id === tag.categoryId)
          : null;
        const colorTheme = tagCategory
          ? getColorTheme(tagCategory.color || 'gray')
          : getColorTheme('pink');
        return tag ? (
          <Badge
            key={`${keyPrefix}-${tag.id}`}
            variant="secondary"
            className="h-8 py-4 text-xs font-medium rounded-xl border"
            style={{
              backgroundColor: colorTheme.bg,
              borderColor: colorTheme.primary,
              color: colorTheme.text,
            }}
          >
            {tag.name}
            {isEditing && onRemoveTag && (
              <Button
                size="icon"
                className="ml-2 h-5 w-5 bg-white/40 hover:bg-white"
                onClick={() => onRemoveTag(tag.id)}
              >
                <X className="h-2 w-2" />
              </Button>
            )}
          </Badge>
        ) : null;
      })}
      {tagIds.length === 0 && (
        <span className="text-xs text-muted-foreground">{emptyText}</span>
      )}
    </div>
  );
}
