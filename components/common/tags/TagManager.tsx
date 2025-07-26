import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Trash2,
  Edit2,
  FolderPlus,
  Move,
  ChevronRight,
  Check
} from 'lucide-react';
import { TagCategory, Tag } from '@/types';
import { cn } from '@/lib/utils';
import toast from '@/lib/enhanced-toast';
import { CreateCategoryForm } from './CreateCategoryForm';
import { CreateTagForm } from './CreateTagForm';

interface TagManagerProps {
  className?: string;
  tags: Tag[];
  tagCategories: TagCategory[];
  selectedTags: string[];
  onTagSelectionChange?: (tagIds: string[]) => void;
  onCreateTag?: (data: { name: string; categoryId?: string }) => Promise<{ success: boolean; error?: string }>;
  onUpdateTag?: (id: string, data: { name?: string; categoryId?: string }) => Promise<{ success: boolean; error?: string }>;
  onDeleteTag?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onCreateTagCategory?: (data: { name: string }) => Promise<{ success: boolean; error?: string }>;
  onUpdateTagCategory?: (id: string, data: { name: string }) => Promise<{ success: boolean; error?: string }>;
  onDeleteTagCategory?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onCreateCategory?: (data: { name: string }) => Promise<{ success: boolean; error?: string }>;
  onUpdateCategory?: (id: string, data: { name: string }) => Promise<{ success: boolean; error?: string }>;
  onDeleteCategory?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onMoveTag?: (tagId: string, categoryId: string) => Promise<{ success: boolean; error?: string }>;
}

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string }) => Promise<{ success: boolean; error?: string }>;
  category: TagCategory | null;
}

interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag | null;
  onConfirm: (data: { name: string; categoryId?: string }) => Promise<{ success: boolean; error?: string }>;
  tagCategories: TagCategory[];
}

interface MoveTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (categoryId: string) => Promise<{ success: boolean; error?: string }>;
  tagCategories: TagCategory[];
  selectedTags: Tag[];
}



// 编辑分类对话框
function EditCategoryDialog({
  open,
  onOpenChange,
  onConfirm,
  category,
}: EditCategoryDialogProps) {
  const [name, setName] = useState(category?.name || '');

  React.useEffect(() => {
    if (category) {
      setName(category.name);
    }
  }, [category]);

  const handleSubmit = async () => {
    if (name.trim()) {
      try {
        const result = await onConfirm({ name: name.trim() });
        if (result.success) {
          onOpenChange(false);
        }
      } catch (error) {
        console.error('更新分类失败:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑标签分类</DialogTitle>
          <DialogDescription>修改标签分类的名称。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-category-name">分类名称</Label>
            <Input
              id="edit-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入分类名称"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name?.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 编辑标签对话框
function EditTagDialog({
  open,
  onOpenChange,
  onConfirm,
  tagCategories,
  tag,
}: EditTagDialogProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  React.useEffect(() => {
    if (tag) {
      setName(tag.name);
      // 如果标签没有分类且有可用分类，设置为第一个分类
      if (!tag.categoryId && tagCategories.length > 0) {
        setCategoryId(tagCategories[0].id);
      } else {
        setCategoryId(tag.categoryId || '');
      }
    }
  }, [tag, tagCategories]);

  const handleSubmit = async () => {
    if (name.trim()) {
      try {
        const result = await onConfirm({ name: name.trim(), categoryId: categoryId || undefined });
        if (result.success) {
          onOpenChange(false);
        }
      } catch (error) {
        console.error('更新标签失败:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑标签</DialogTitle>
          <DialogDescription>修改标签的名称和所属分类。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-tag-name">标签名称</Label>
            <Input
              id="edit-tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入标签名称"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <Label htmlFor="edit-tag-category">所属分类</Label>
            {tagCategories.length > 0 ? (
              <select
                id="edit-tag-tagCategory"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">无分类</option>
                {tagCategories.map((tagCategory) => (
                  <option key={tagCategory.id} value={tagCategory.id}>
                    {tagCategory.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full p-2 border rounded-md bg-muted text-muted-foreground">
                暂无分类，标签将保持为未分类状态
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name?.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 移动标签对话框
function MoveTagDialog({
  open,
  onOpenChange,
  onConfirm,
  tagCategories,
  selectedTags,
}: MoveTagDialogProps) {
  const [categoryId, setCategoryId] = useState('');

  const handleSubmit = async () => {
    try {
      // 允许空字符串作为有效值，表示移动到"未分类"
      const result = await onConfirm(categoryId);
      if (result.success) {
        setCategoryId('');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('移动标签失败:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>移动标签</DialogTitle>
          <DialogDescription>
            将选中的 {selectedTags.length} 个标签移动到指定分类。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>选中的标签</Label>
            <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/50 max-h-20 overflow-y-auto">
              {selectedTags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-xs">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="move-tag-category">目标分类</Label>
            <select
              id="move-tag-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">请选择目标分类</option>
              {tagCategories.map((tagCategory) => (
                <option key={tagCategory.id} value={tagCategory.id}>
                  {tagCategory.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            移动
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 标签组项组件
const TagGroupItem = React.memo(({
  group,
  tags,
  expanded,
  selectedTags,
  showUsageCount,
  onTagClick,
  onTagEdit,
  onGroupEdit,
  onGroupDelete,
  onAddTag,
  onGroupSelect
}: {
  group: TagCategory;
  tags: Tag[];
  expanded: boolean;
  selectedTags: string[];
  showUsageCount: boolean;
  onTagClick: (tag: Tag) => void;
  onTagEdit: (tag: Tag) => void;
  onGroupEdit: (updatedCategory: TagCategory) => void;
  onGroupDelete: (tagCategory: TagCategory) => void;
  onAddTag: (categoryId: string) => void;
  onGroupSelect: (categoryId: string) => void;
}) => {
  const allSelected = tags.length > 0 && tags.every((tag) => selectedTags.includes(tag.id));
  const someSelected = tags.some((tag) => selectedTags.includes(tag.id)) && !allSelected;

  return (
    <div className="border rounded-lg bg-card">
      <div 
        className="flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => onGroupSelect(group.id)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center justify-center w-5 h-5">
            {allSelected && <Check className="w-4 h-4" />}
            {someSelected && <div className="w-3 h-3 bg-primary rounded-sm" />}
            {!allSelected && !someSelected && <div className="w-3 h-3 border rounded-sm" />}
          </div>
          <ChevronRight className={cn(
            "w-4 h-4 transition-transform duration-200",
            expanded ? "rotate-90" : ""
          )} />
          <span className="font-medium text-sm truncate">{group.name}</span>
          <Badge variant="secondary" className="text-xs">
            {tags.length} 个标签
          </Badge>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddTag(group.id);
            }}
            className="h-6 w-6 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onGroupEdit(group);
            }}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onGroupDelete(group);
            }}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {expanded && (
        <div className="p-3 space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className={cn(
                'flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors',
                selectedTags.includes(tag.id) && 'bg-primary/10 border-primary'
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() => onTagClick(tag)}
                  className="rounded"
                />
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "#64748b" }}
                  />
                  <span className="font-medium text-sm">{tag.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTagEdit(tag)}
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // 删除确认逻辑应该在父组件中处理
                  }}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default function TagManager({
  tags,
  tagCategories,
  selectedTags = [],
  onTagSelectionChange,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  onCreateTagCategory,
  onUpdateTagCategory,
  onDeleteTagCategory,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onMoveTag,
  className,
}: TagManagerProps) {
  // 对话框状态
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createTagOpen, setCreateTagOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editTagOpen, setEditTagOpen] = useState(false);
  const [moveTagOpen, setMoveTagOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // 当前编辑的项目
  const [currentCategory, setCurrentCategory] = useState<TagCategory | null>(null);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [createTagCategoryId, setCreateTagCategoryId] = useState<string>('');
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null);
  const [showEditTag, setShowEditTag] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showMoveTag, setShowMoveTag] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'tag';
    id: string;
    name: string;
  } | null>(null);

  // 初始化时展开所有分类
  React.useEffect(() => {
    if (tagCategories.length > 0) {
      setExpandedCategories(new Set(tagCategories.map((c: TagCategory) => c.id)));
    }
  }, [tagCategories]);

  // 切换标签选择
  const toggleTagSelection = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    onTagSelectionChange?.(newSelectedTags);
  };

  // 清空标签选择
  const clearTagSelection = () => {
    onTagSelectionChange?.([]);
  };

  // 切换分类展开状态
  const toggleCategoryExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // 处理创建分类
  const handleCreateCategory = async (data: { name: string }) => {
    try {
      const result = await onCreateCategory?.(data);
      if (result?.success) {
        toast.success('分类创建成功');
        setCreateCategoryOpen(false);
      } else {
        toast.error(result?.error || '创建分类失败');
      }
      return result || { success: false, error: '创建分类失败' };
    } catch (error) {
      const errorMessage = '创建分类失败';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 处理创建标签
  const handleCreateTag = async (data: { name: string; categoryId?: string }) => {
    try {
      const result = await onCreateTag?.(data);
      if (result?.success) {
        toast.success('标签创建成功');
        setCreateTagOpen(false);
      } else {
        toast.error(result?.error || '创建标签失败');
      }
      return result || { success: false, error: '创建标签失败' };
    } catch (error) {
      const errorMessage = '创建标签失败';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 处理编辑分类
  const handleEditCategory = (category: TagCategory) => {
    setCurrentCategory(category);
    setEditCategoryOpen(true);
  };

  const handleUpdateCategory = async (data: { name: string }) => {
    if (!currentCategory) return { success: false, error: '未选择分类' };
    
    try {
      const result = await onUpdateCategory?.(currentCategory.id, data);
      if (result?.success) {
        toast.success('分类更新成功');
        setEditCategoryOpen(false);
        setCurrentCategory(null);
      } else {
        toast.error(result?.error || '更新分类失败');
      }
      return result || { success: false, error: '更新分类失败' };
    } catch (error) {
      const errorMessage = '更新分类失败';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 处理编辑标签
  const handleEditTag = (tag: Tag) => {
    setCurrentTag(tag);
    setEditTagOpen(true);
  };

  const handleUpdateTag = async (data: { name: string; categoryId?: string }) => {
    if (!currentTag) return { success: false, error: '未选择标签' };
    
    try {
      const result = await onUpdateTag?.(currentTag.id, data);
      if (result?.success) {
        toast.success('标签更新成功');
        setEditTagOpen(false);
        setCurrentTag(null);
      } else {
        toast.error(result?.error || '更新标签失败');
      }
      return result || { success: false, error: '更新标签失败' };
    } catch (error) {
      const errorMessage = '更新标签失败';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 处理移动标签
  const handleMoveSelectedTags = () => {
    if (selectedTags && selectedTags.length > 0) {
      setMoveTagOpen(true);
    }
  };

  const handleMoveTagsToCategory = async (categoryId: string) => {
    if (!selectedTags || selectedTags.length === 0) {
      return { success: false, error: '未选择标签' };
    }
    
    try {
      // 这里需要根据实际的API来实现批量移动
      // 暂时使用单个移动的方式
      const results = await Promise.all(
        selectedTags.map(tagId => onMoveTag?.(tagId, categoryId))
      );
      
      const allSuccess = results.every(result => result?.success);
      if (allSuccess) {
        toast.success('标签移动成功');
        setMoveTagOpen(false);
        onTagSelectionChange?.([]);
      } else {
        toast.error('部分标签移动失败');
      }
      return { success: allSuccess, error: allSuccess ? undefined : '部分标签移动失败' };
    } catch (error) {
      const errorMessage = '移动标签失败';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      let result;
      if (deleteTarget.type === 'category') {
        result = await onDeleteCategory?.(deleteTarget.id);
      } else if (deleteTarget.type === 'tag') {
        result = await onDeleteTag?.(deleteTarget.id);
      }

      if (result?.success) {
        toast.success(`${deleteTarget.type === 'category' ? '分类' : '标签'}删除成功`);
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
      } else {
        toast.error(result?.error || '删除失败');
      }
      return result;
    } catch (error) {
      const errorMessage = '删除失败';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 处理删除选中的标签
  const handleDeleteSelectedTags = async () => {
    if (!selectedTags || selectedTags.length === 0) return;

    try {
      const results = await Promise.all(
        selectedTags.map(tagId => onDeleteTag?.(tagId))
      );
      const allSuccess = results.every(r => r?.success);
      
      if (allSuccess) {
        toast.success('标签删除成功');
        onTagSelectionChange?.([]);
      } else {
        toast.error('部分标签删除失败');
      }
      return { success: allSuccess, error: allSuccess ? undefined : '部分标签删除失败' };
    } catch (error) {
      const errorMessage = '删除标签失败';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 添加标签到分类
  const handleAddTag = (categoryId: string) => {
    setCreateTagCategoryId(categoryId);
    setShowCreateTag(true);
  };
  
  return (
    <div className={cn('w-full', className)}>
      {/* 标题和工具栏 */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div>
          <h2 className="text-lg font-semibold">TAGS</h2>
         
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateTag(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            新建标签
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateCategory(true)}
          >
            <FolderPlus className="w-4 h-4 mr-1" />
            新建分类
          </Button>
        </div>
      </div>

      {/* 选择操作栏 */}
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="flex items-center gap-2 flex-1">
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-black">
                已选择 {selectedTags.length} 个标签
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={clearTagSelection}
              >
                清空选择
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveSelectedTags}
              >
                <Move className="w-4 h-4 mr-1" />
                移动标签
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 标签分类列表 */}
      <ScrollArea className="flex-1 max-h-[450px]">
        <div className="space-y-3">
          {tagCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无标签分类
              <div className="text-xs mt-2 text-muted-foreground">
                请先创建标签分类，然后上传图片时标签会自动归类
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {tagCategories.map((tagCategory: TagCategory) => {
                const categoryTags = tags.filter((tag: Tag) => tag && tag.categoryId === tagCategory.id);
                const isExpanded = expandedCategories.has(tagCategory.id);
                
                return (
                  <TagGroupItem
                    key={tagCategory.id}
                    group={tagCategory}
                    tags={categoryTags}
                    expanded={isExpanded}
                    selectedTags={selectedTags}
                    showUsageCount={false}
                    onTagClick={(tag: Tag) => toggleTagSelection(tag.id)}
                    onTagEdit={handleEditTag}
                    onGroupEdit={(updatedCategory: TagCategory) => {
                      setEditingCategory(updatedCategory);
                      setShowEditCategory(true);
                    }}
                    onGroupDelete={(tagCategory: TagCategory) => {
                      setDeleteTarget({ type: 'category', id: tagCategory.id, name: tagCategory.name });
                      setShowDeleteConfirm(true);
                    }}
                    onAddTag={handleAddTag}
                    onGroupSelect={(categoryId: string) => {
                      const categoryTags = tags.filter((tag: Tag) => tag && tag.categoryId === categoryId);
                      const allSelected = categoryTags.every((tag: Tag) => selectedTags.includes(tag.id));
                      if (allSelected) {
                        // 取消选择该分类的所有标签
                        categoryTags.forEach((tag: Tag) => {
                          if (selectedTags.includes(tag.id)) {
                            toggleTagSelection(tag.id);
                          }
                        });
                      } else {
                        // 选择该分类的所有标签
                        categoryTags.forEach((tag: Tag) => {
                          if (!selectedTags.includes(tag.id)) {
                            toggleTagSelection(tag.id);
                          }
                        });
                      }
                      
                      // 切换展开状态
                      toggleCategoryExpand(categoryId);
                    }}
                  />
                );
              })}
              
              {/* 显示未分类的标签 */}
              {(() => {
                const ungroupedTags = tags.filter((tag: Tag) => tag && !tag.categoryId);
                
                if (ungroupedTags.length === 0) return null;
                
                return (
                  <div className="border rounded-lg bg-card">
                    <div 
                      className="flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        const allSelected = ungroupedTags.every((tag: Tag) => selectedTags.includes(tag.id));
                        if (allSelected) {
                          // 取消选择所有未分类标签
                          ungroupedTags.forEach((tag: Tag) => {
                            if (selectedTags.includes(tag.id)) {
                              toggleTagSelection(tag.id);
                            }
                          });
                        } else {
                          // 选择所有未分类标签
                          ungroupedTags.forEach((tag: Tag) => {
                            if (!selectedTags.includes(tag.id)) {
                              toggleTagSelection(tag.id);
                            }
                          });
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-5 h-5">
                          {ungroupedTags.every((tag: Tag) => selectedTags.includes(tag.id)) && <Check className="w-4 h-4" />}
                          {ungroupedTags.some((tag: Tag) => selectedTags.includes(tag.id)) && 
                           !ungroupedTags.every((tag: Tag) => selectedTags.includes(tag.id)) && 
                           <div className="w-3 h-3 bg-primary rounded-sm" />}
                          {!ungroupedTags.some((tag: Tag) => selectedTags.includes(tag.id)) && <div className="w-3 h-3 border rounded-sm" />}
                        </div>
                        <span className="font-medium text-sm text-muted-foreground">未分类标签</span>
                        <Badge variant="secondary" className="text-xs text-black">
                          {ungroupedTags.length} 个标签
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      {ungroupedTags.map((tag: Tag) => (
                        <div
                          key={tag.id}
                          className={cn(
                            'flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors',
                            selectedTags.includes(tag.id) && 'bg-primary/10 border-primary'
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(tag.id)}
                              onChange={() => toggleTagSelection(tag.id)}
                              className="rounded"
                            />
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: "#64748b" }}
                              />
                              <span className="font-medium text-sm">{tag.name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTag(tag as Tag)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteTarget({ type: 'tag', id: tag.id, name: tag.name });
                                setShowDeleteConfirm(true);
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 创建分类对话框 */}
        <Dialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建标签分类</DialogTitle>
              <DialogDescription>创建一个新的标签分类，用于组织和管理标签。</DialogDescription>
            </DialogHeader>
            <CreateCategoryForm
              onConfirm={async (data) => {
                const result = await handleCreateCategory(data);
                if (result.success) {
                  setCreateCategoryOpen(false);
                }
              }}
              onCancel={() => setCreateCategoryOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* 创建标签对话框 */}
        <Dialog open={createTagOpen} onOpenChange={setCreateTagOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建标签</DialogTitle>
              <DialogDescription>创建一个新的标签并选择所属分类。</DialogDescription>
            </DialogHeader>
            <CreateTagForm
              searchQuery=""
              tagCategories={tagCategories}
              onConfirm={async (data) => {
                const result = await handleCreateTag(data);
                if (result.success) {
                  setCreateTagOpen(false);
                }
              }}
              onCancel={() => setCreateTagOpen(false)}
              onCreateCategory={() => {
                setCreateTagOpen(false);
                setTimeout(() => setCreateCategoryOpen(true), 100);
              }}
              selectedTagIds={selectedTags || []}
              tags={tags}
              onRefetch={() => {}}
              onTagsChange={onTagSelectionChange}
            />
          </DialogContent>
        </Dialog>

      {/* 编辑分类对话框 */}
      <EditCategoryDialog
        open={editCategoryOpen}
        onOpenChange={setEditCategoryOpen}
        onConfirm={handleUpdateCategory}
        category={currentCategory}
      />

      {/* 编辑标签对话框 */}
      <EditTagDialog
        open={editTagOpen}
        onOpenChange={setEditTagOpen}
        onConfirm={handleUpdateTag}
        tagCategories={tagCategories}
        tag={currentTag}
      />

      {/* 移动标签对话框 */}
      <MoveTagDialog
        open={moveTagOpen}
        onOpenChange={setMoveTagOpen}
        onConfirm={handleMoveTagsToCategory}
        tagCategories={tagCategories}
        selectedTags={selectedTags?.map(id => tags.find(t => t.id === id)).filter(Boolean) as Tag[]}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'category'
                ? `确定要删除分类 "${deleteTarget.name}" 吗？此操作将同时删除该分类下的所有标签。`
                : deleteTarget?.type === 'tag'
                ? `确定要删除标签 "${deleteTarget.name}" 吗？`
                : ''}
              此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
