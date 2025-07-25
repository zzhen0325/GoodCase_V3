'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Folder,
  FolderOpen,
  Search,
} from 'lucide-react';
import { TagCategory, Tag } from '@/types';
import { TagItem } from './TagItem';
import { cn } from '@/lib/utils/common';

interface TagManagerProps {
  tags: Tag[];
  tagCategories: TagCategory[];
  selectedTags?: string[];
  expandedGroups?: string[];
  showUsageCount?: boolean;
  showSearch?: boolean;
  onTagClick?: (tag: Tag) => void;
  onTagRemove?: (tag: Tag) => void;
  onTagEdit?: (tag: Tag) => void;
  onCategoryEdit?: (category: TagCategory) => void;
  onCategoryDelete?: (category: TagCategory) => void;
  onAddTag?: (categoryId: string) => void;
  onToggleExpand?: (categoryId: string) => void;
  onCategorySelect?: (categoryId: string) => void;
  className?: string;
}

export function TagManager({
  tags,
  tagCategories,
  selectedTags = [],
  expandedGroups = [],
  showUsageCount = false,
  showSearch = true,
  onTagClick,
  onTagRemove,
  onTagEdit,
  onCategoryEdit,
  onCategoryDelete,
  onAddTag,
  onToggleExpand,
  onCategorySelect,
  className,
}: TagManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // 获取分类的标签
  const getCategoryTags = (categoryId: string) => {
    return tags.filter(tag => tag.categoryId === categoryId);
  };

  // 过滤分类和标签
  const filteredCategories = tagCategories.filter(category => {
    if (!searchQuery.trim()) return true;
    
    const categoryMatches = category.name.toLowerCase().includes(searchQuery.toLowerCase());
    const hasMatchingTags = getCategoryTags(category.id).some(tag =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    return categoryMatches || hasMatchingTags;
  });

  const filteredTags = (categoryId: string) => {
    const categoryTags = getCategoryTags(categoryId);
    if (!searchQuery.trim()) return categoryTags;
    
    return categoryTags.filter(tag =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // 处理分类编辑
  const handleCategoryEdit = (category: TagCategory) => {
    setEditingCategory(category.id);
    setEditingCategoryName(category.name);
  };

  const handleCategoryEditSave = (category: TagCategory) => {
    if (editingCategoryName.trim() && onCategoryEdit) {
      onCategoryEdit({
        ...category,
        name: editingCategoryName.trim()
      });
    }
    setEditingCategory(null);
    setEditingCategoryName('');
  };

  const handleCategoryEditCancel = () => {
    setEditingCategory(null);
    setEditingCategoryName('');
  };

  return (
    <div className={cn('w-full', className)}>
      {/* 搜索框 */}
      {showSearch && (
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索标签或分类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}

      {/* 标签分类列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredCategories.map((category) => {
            const categoryTags = filteredTags(category.id);
            const isExpanded = expandedGroups.includes(category.id);
            const isEditing = editingCategory === category.id;

            return (
              <div key={category.id} className="space-y-1">
                {/* 分类头部 */}
                <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md group">
                  <div className="flex items-center gap-2 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => onToggleExpand?.(category.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {isExpanded ? (
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    )}
                    
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          className="h-6 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCategoryEditSave(category);
                            } else if (e.key === 'Escape') {
                              handleCategoryEditCancel();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => handleCategoryEditSave(category)}
                        >
                          确定
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={handleCategoryEditCancel}
                        >
                          取消
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span
                          className="font-medium cursor-pointer flex-1"
                          onClick={() => onCategorySelect?.(category.id)}
                        >
                          {category.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryTags.length}
                        </Badge>
                      </>
                    )}
                  </div>
                  
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onAddTag?.(category.id)}
                        title="添加标签"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCategoryEdit(category)}>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑分类
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onCategoryDelete?.(category)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除分类
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
                
                {/* 标签列表 */}
                {isExpanded && categoryTags.length > 0 && (
                  <div className="ml-6 space-y-1">
                    <div className="flex flex-wrap gap-2 p-2">
                      {categoryTags.map((tag) => (
                        <TagItem
                          key={tag.id}
                          tag={tag}
                          category={category}
                          selected={selectedTags.includes(tag.id)}
                          showUsageCount={showUsageCount}
                          showRemove={!!onTagRemove}
                          showEdit={!!onTagEdit}
                          draggable
                          onClick={onTagClick}
                          onRemove={onTagRemove}
                          onEdit={onTagEdit}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {isExpanded && categoryTags.length === 0 && (
                  <div className="ml-6 p-2 text-sm text-muted-foreground">
                    暂无标签
                  </div>
                )}
              </div>
            );
          })}
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? '未找到匹配的分类或标签' : '暂无标签分类'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}