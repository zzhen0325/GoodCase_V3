'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Tags, X, ChevronDown, Plus } from 'lucide-react';
import { Tag, TagCategory } from '@/types';
import { TagItem } from './TagItem';
import { BaseModal } from '@/components/common/modals';
import { CreateTagForm, CreateCategoryForm } from './';
import { useTags } from '@/hooks/data/useTags';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/common';

interface TagSelectorProps {
  tags: Tag[];
  tagCategories: TagCategory[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  onCreateTag?: (name: string, groupId: string) => void;
  onRefetch?: () => void;
  placeholder?: string;
  maxSelectedTags?: number;
  disabled?: boolean;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showCreateButton?: boolean;
  showSearch?: boolean;
  emptyText?: string;
  mode?: 'popover' | 'dropdown';
}

export function TagSelector({
  tags,
  tagCategories,
  selectedTagIds,
  onTagsChange,
  onCreateTag,
  onRefetch,
  placeholder = '选择标签...',
  maxSelectedTags,
  disabled = false,
  className,
  open: controlledOpen,
  onOpenChange,
  size = 'md',
  variant = 'default',
  showCreateButton = true,
  showSearch = true,
  emptyText = '暂无标签',
  mode = 'popover',
}: TagSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState<string | null>(null);
  const [showCreateTagDialog, setShowCreateTagDialog] = useState(false);
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false);
  const { createTag, createTagCategory } = useTags();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // 按分组整理标签
  const groupedTags = useMemo(() => {
    const grouped: Record<string, { group: TagCategory; tags: Tag[] }> = {};
    
    tagCategories.forEach(category => {
      const categoryTags = tags.filter(tag => tag.categoryId === category.id);
      if (categoryTags.length > 0) {
        grouped[category.id] = {
          group: category,
          tags: categoryTags
        };
      }
    });
    
    return grouped;
  }, [tags, tagCategories]);

  // 过滤标签
  const groupedFilteredTags = useMemo(() => {
    if (!searchQuery.trim()) return groupedTags;
    
    const filtered: Record<string, { group: TagCategory; tags: Tag[] }> = {};
    
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

  // 切换标签选择
  const toggleTag = (tag: Tag) => {
    const newSelectedIds = selectedTagIds.includes(tag.id)
      ? selectedTagIds.filter(id => id !== tag.id)
      : [...selectedTagIds, tag.id];
    
    if (maxSelectedTags && newSelectedIds.length > maxSelectedTags) {
      return;
    }
    
    onTagsChange(newSelectedIds);
  };

  // 移除标签
  const removeTag = (tagId: string) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagId));
  };

  // 创建新标签
  const handleCreateTagInGroup = (groupId: string) => {
    if (newTagName.trim() && onCreateTag) {
      onCreateTag(newTagName.trim(), groupId);
      setNewTagName('');
      setShowCreateForm(null);
    }
  };

  // 获取选中的标签
  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));

  // 检查搜索的标签是否已存在
  const searchTagExists = useMemo(() => {
    if (!searchQuery.trim()) return false;
    return tags.some(tag => tag.name.toLowerCase() === searchQuery.toLowerCase());
  }, [tags, searchQuery]);

  // 检查是否有匹配的标签
  const hasMatchingTags = useMemo(() => {
    return Object.values(groupedFilteredTags).some(({ tags }) => tags.length > 0);
  }, [groupedFilteredTags]);

  // 处理创建标签
  const handleCreateTag = () => {
    if (!searchQuery.trim() || searchTagExists) return;
    setShowCreateTagDialog(true);
  };

  // 处理创建分类确认
  const handleCreateCategoryConfirm = async (data: { name: string }) => {
    try {
      const result = await createTagCategory(data);
      
      if (result.success) {
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

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // 渲染触发器按钮
  const renderTrigger = () => (
    <Button
      variant={variant}
      role="combobox"
      aria-expanded={isOpen}
      className={cn(
        'w-full justify-between',
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      disabled={disabled}
    >
      <div className="flex items-center gap-2">
        <Tags className="h-4 w-4" />
        <span className="truncate">
          {selectedTags.length > 0
            ? `已选择 ${selectedTags.length} 个标签`
            : placeholder
          }
        </span>
      </div>
      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  // 渲染内容区域
  const renderContent = () => (
    <>
      {/* 搜索框 */}
      {showSearch && (
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}

      {/* 已选择的标签 */}
      {selectedTags.length > 0 && (
        <div className="p-3 border-b">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            已选择的标签
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tag) => {
              const category = tagCategories.find(c => c.id === tag.categoryId);
              return (
                <TagItem
                  key={tag.id}
                  tag={tag}
                  category={category}
                  size="sm"
                  showRemove
                  onRemove={() => removeTag(tag.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* 标签列表 */}
      <ScrollArea className="max-h-60">
        <div className="p-2">
          {Object.entries(groupedFilteredTags).map(([groupId, { group, tags: groupTags }], index) => (
            <div key={groupId}>
              <div className="px-2 py-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">
                    {group.name}
                  </div>
                  {showCreateButton && onCreateTag && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setShowCreateForm(groupId)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      创建
                    </Button>
                  )}
                </div>
                
                {/* 创建标签表单 */}
                {showCreateForm === groupId && (
                  <div className="mt-2 flex gap-1">
                    <Input
                      placeholder="标签名称"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="h-7 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateTagInGroup(groupId);
                        } else if (e.key === 'Escape') {
                          setShowCreateForm(null);
                          setNewTagName('');
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleCreateTagInGroup(groupId)}
                    >
                      确定
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setShowCreateForm(null);
                        setNewTagName('');
                      }}
                    >
                      取消
                    </Button>
                  </div>
                )}
              </div>
              
              {/* 标签项 */}
              <div className="space-y-1">
                {groupTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-1 hover:bg-muted/30 rounded"
                  >
                    <TagItem
                      tag={tag}
                      category={group}
                      selected={selectedTagIds.includes(tag.id)}
                      showUsageCount
                      size="sm"
                      onClick={() => toggleTag(tag)}
                      className="cursor-pointer"
                    />
                  </div>
                ))}
              </div>
              
              {index < Object.keys(groupedFilteredTags).length - 1 && (
                <Separator className="mt-2" />
              )}
            </div>
          ))}

          {Object.keys(groupedFilteredTags).length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {searchQuery ? '未找到匹配的标签' : emptyText}
            </div>
          )}

          {/* Dropdown 模式下的创建新标签选项 */}
          {mode === 'dropdown' && searchQuery && !searchTagExists && !hasMatchingTags && (
            <>
              <Separator className="my-2" />
              <div className="px-2 py-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={handleCreateTag}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  创建标签 "{searchQuery}"
                </Button>
              </div>
            </>
          )}

          {/* Dropdown 模式下的创建分类选项 */}
          {mode === 'dropdown' && (
            <>
              <Separator className="my-2" />
              <div className="px-2 py-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => setShowCreateCategoryDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  创建新分类
                </Button>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </>
  );

  return (
    <div className={cn('w-full', className)}>
      {mode === 'popover' ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            {renderTrigger()}
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            {renderContent()}
          </PopoverContent>
        </Popover>
      ) : (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            {renderTrigger()}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-0" align="start">
            {renderContent()}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* 创建标签对话框 */}
      <BaseModal
        isOpen={showCreateTagDialog}
        onClose={() => setShowCreateTagDialog(false)}
        title="创建新标签"
      >
        <CreateTagForm
          searchQuery={searchQuery}
          tagCategories={tagCategories}
          onConfirm={(data) => {
            if (onCreateTag) {
              onCreateTag(data.name, data.categoryId || '');
            }
            setShowCreateTagDialog(false);
            setSearchQuery('');
            if (onRefetch) {
              onRefetch();
            }
            toast.success('标签创建成功');
          }}
          onCancel={() => setShowCreateTagDialog(false)}
          onCreateCategory={() => setShowCreateCategoryDialog(true)}
        />
      </BaseModal>

      {/* 创建分类对话框 */}
      <BaseModal
        isOpen={showCreateCategoryDialog}
        onClose={() => setShowCreateCategoryDialog(false)}
        title="创建新分类"
      >
        <CreateCategoryForm
          onConfirm={handleCreateCategoryConfirm}
          onCancel={() => setShowCreateCategoryDialog(false)}
        />
      </BaseModal>
    </div>
  );
}