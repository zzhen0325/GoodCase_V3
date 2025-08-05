import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, FolderOpen, Folder, Tag as TagIcon, Plus, X, Check } from 'lucide-react';
import { Tag, TagCategory } from '@/types';
import { useTagOperations } from '@/hooks/use-tag-operations';
import { toast } from 'sonner';

interface TagSelectorDropdownProps {
  tags: Tag[];
  tagCategories: TagCategory[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch?: () => void;
}

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

function CreateTagForm({ searchQuery, tagCategories, onConfirm, onCancel, onCreateCategory, selectedTagIds = [], onTagsChange, tags = [], onRefetch }: CreateTagFormProps) {
  const [name, setName] = React.useState(searchQuery);
  const [categoryId, setCategoryId] = React.useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const { createTagCategory, createTag } = useTagOperations();

  React.useEffect(() => {
    if (tagCategories.length > 0) {
      setCategoryId(tagCategories[0].id);
    } else {
      setCategoryId('');
    }
  }, [tagCategories]);

  const handleSubmit = async () => {
    if (name.trim()) {
      let finalCategoryId = categoryId;
      
      // 如果选择的是新分类，先创建分类
      if (categoryId && categoryId.startsWith('new:')) {
        const newCategoryName = categoryId.replace('new:', '');
        try {
          const result = await createTagCategory({ name: newCategoryName });
          if (result.success) {
            // 使用新创建的分类ID
            finalCategoryId = result.tagCategory?.id || undefined;
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
          
          categoryId: finalCategoryId || tagCategories[0]?.id || ""
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
      setCategoryId(tagCategories.length > 0 ? tagCategories[0].id : '');
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
          tagCategories.length > 0 ? (
            <div className="space-y-3">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <SelectValue placeholder="选择分类" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {tagCategories.map((tagCategory) => (
                    <SelectItem key={tagCategory.id} value={tagCategory.id}>
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        <span>{tagCategory.name}</span>
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

export function TagSelectorDropdown({
  tags,
  tagCategories,
  selectedTagIds,
  onTagsChange,
  open,
  onOpenChange,
  onRefetch,
}: TagSelectorDropdownProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreateTagDialog, setShowCreateTagDialog] = React.useState(false);
  const [showCreateCategoryDialog, setShowCreateCategoryDialog] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { createTag, createTagCategory } = useTagOperations();

  // 确保输入框在下拉菜单打开时获得焦点
  React.useEffect(() => {
    if (open && inputRef.current) {
      // 延迟聚焦以确保DOM已渲染
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // 按分类聚合标签
  const groupedTags = React.useMemo(() => {
    const grouped: { [key: string]: { group: TagCategory | null; tags: Tag[] } } = {};
    
    // 添加未分类组
    grouped['uncategorized'] = { group: null, tags: [] };
    
    // 初始化分类组
    tagCategories.forEach(group => {
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
  }, [tags, tagCategories]);

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
      const result = await createTagCategory(data);
      
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
      <DropdownMenu open={open} onOpenChange={onOpenChange} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button 
            type="button"
            variant="outline"
            size="lg"
            className="px-3 text-black font-medium"
                >
            <TagIcon className="w-4 h-4" />
          Add Tag
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 max-h-96 overflow-x-hidden" loop={false}>
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="搜索标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  // 阻止事件冒泡到DropdownMenu
                  e.stopPropagation();
                }}
                onKeyUp={(e) => {
                  // 阻止事件冒泡到DropdownMenu
                  e.stopPropagation();
                }}
                className="pl-8"
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
                  <span>创建 &quot;{searchQuery.trim()}&quot;</span>
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
                  <span>创建 &quot;{searchQuery.trim()}&quot;</span>
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
            tagCategories={tagCategories}
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