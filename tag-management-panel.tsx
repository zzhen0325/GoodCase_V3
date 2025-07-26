import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
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
import { useTags } from '@/hooks/data/useTags';
import { cn } from '@/lib/utils';
import toast from '@/lib/enhanced-toast';
import { CreateCategoryForm } from '@/components/common/tags/CreateCategoryForm';
import { CreateTagForm } from '@/components/common/tags/CreateTagForm';

interface TagManagementPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string }) => void;
  category: TagCategory | null;
}

interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag | null;
  onConfirm: (data: { name: string; categoryId?: string }) => void;
  tagCategories: TagCategory[];
}

interface MoveTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (categoryId: string) => void;
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

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm({ name: name.trim() });
      onOpenChange(false);
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

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm({ name: name.trim(), categoryId: categoryId || undefined });
      onOpenChange(false);
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

  const handleSubmit = () => {
    // 允许空字符串作为有效值，表示移动到"未分类"
    onConfirm(categoryId);
    setCategoryId('');
    onOpenChange(false);
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

TagGroupItem.displayName = 'TagGroupItem';

export function TagManagementPanel({
  open,
  onOpenChange,
  className,
}: TagManagementPanelProps) {
  const {
    tags,
    tagCategories,
    selectedTags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    createTagCategory,
    updateTagCategory,
    deleteTagCategory,
    refreshAll,
    setSelectedTags,
  } = useTags();

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
    type: 'tagCategory' | 'tag' | 'selected';
    data?: Tag | TagCategory;
  }>({ type: 'tag' });

  // 初始化时展开所有分类
  React.useEffect(() => {
    if (tagCategories.length > 0) {
      setExpandedCategories(new Set(tagCategories.map((c: TagCategory) => c.id)));
    }
  }, [tagCategories]);

  // 切换标签选择
  const toggleTagSelection = (tagId: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // 清空标签选择
  const clearTagSelection = () => {
    setSelectedTags([]);
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
      const result = await createTagCategory(data);
      if (result.success) {
        toast.success('分类创建成功');
        setShowCreateCategory(false);
      } else {
        toast.error('创建分类失败', { description: result.error || '未知错误' });
      }
    } catch (error) {
      console.error('创建分类失败:', error);
      toast.error('创建分类失败', { description: error instanceof Error ? error.message : '未知错误' });
    }
  };

  // 处理创建标签
  const handleCreateTag = async (data: { name: string; categoryId?: string }) => {
    try {
      const result = await createTag({ 
        name: data.name, 
        categoryId: data.categoryId || tagCategories[0]?.id || ""
      });
      
      if (result.success) {
        toast.success('标签创建成功');
        setShowCreateTag(false);
        setCreateTagCategoryId('');
      } else {
        toast.error('创建标签失败', { description: result.error || '未知错误' });
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      toast.error('创建标签失败', { description: error instanceof Error ? error.message : '未知错误' });
    }
  };

  // 处理编辑分类
  const handleEditCategory = (category: TagCategory) => {
    setEditingCategory(category);
    setShowEditCategory(true);
  };

  const handleUpdateCategory = async (data: { name: string }) => {
    if (editingCategory) {
      try {
        const result = await updateTagCategory(editingCategory.id, data);
        if (result.success) {
          toast.success('分类更新成功');
          setShowEditCategory(false);
          setEditingCategory(null);
        } else {
          toast.error('更新分类失败', { description: result.error || '未知错误' });
        }
      } catch (error) {
        console.error('更新分类失败:', error);
        toast.error('更新分类失败', { description: error instanceof Error ? error.message : '未知错误' });
      }
    }
  };

  // 处理编辑标签
  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setShowEditTag(true);
  };

  const handleUpdateTag = async (data: { name: string; categoryId?: string }) => {
    if (editingTag) {
      try {
        const result = await updateTag(editingTag.id, {
          name: data.name,
          categoryId: data.categoryId || tagCategories[0]?.id || ""
        });
        
        if (result.success) {
          toast.success('标签更新成功');
          setShowEditTag(false);
          setEditingTag(null);
        } else {
          toast.error('更新标签失败', { description: result.error || '未知错误' });
        }
      } catch (error) {
        console.error('更新标签失败:', error);
        toast.error('更新标签失败', { description: error instanceof Error ? error.message : '未知错误' });
      }
    }
  };

  // 处理移动标签
  const handleMoveSelectedTags = () => {
    if (selectedTags.length > 0) {
      setShowMoveTag(true);
    }
  };

  const handleMoveTagsToCategory = async (categoryId: string) => {
    try {
      // selectedTags 是字符串数组（标签ID），直接使用
      const results = await Promise.all(
        selectedTags.map((tagId: string) => {
          return updateTag(tagId, { categoryId: categoryId === '' ? undefined : categoryId });
        })
      );
      
      // 检查是否有失败的操作
      const failures = results.filter((result: any) => !result.success);
      if (failures.length > 0) {
        toast.error('移动标签失败', { description: `${failures.length}个标签移动失败` });
      } else {
        toast.success('标签移动成功');
      }
      
      clearTagSelection();
      setShowMoveTag(false);
    } catch (error: any) {
      console.error('移动标签失败:', error);
      toast.error('移动标签失败', { description: error?.message || '未知错误' });
    }
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    try {
      // 初始化result变量，避免在赋值前使用
      let result: { success: boolean; error?: string } = { success: false };
      
      if (deleteTarget.type === 'tagCategory' && deleteTarget.data) {
        result = await deleteTagCategory((deleteTarget.data as TagCategory).id);
        if (!result.success) {
          toast.error('删除分类失败', { description: result.error });
          console.error('删除分类失败:', result.error);
        } else {
          toast.success('分类已删除');
        }
      } else if (deleteTarget.type === 'tag' && deleteTarget.data) {
        // 确保 deleteTarget.data 存在且有 id 属性
        if (!(deleteTarget.data as Tag).id) {
          console.error('删除标签失败: 无效的标签ID');
          toast.error('删除标签失败', { description: '无效的标签ID' });
          return;
        }
        
        result = await deleteTag((deleteTarget.data as Tag).id);
        if (!result.success) {
          toast.error('删除标签失败', { description: result.error });
          console.error('删除标签失败:', result.error);
        } else {
          toast.success('标签已删除');
        }
      } else if (deleteTarget.type === 'selected') {
        // 确保有选中的标签
        if (selectedTags.length === 0) {
          console.error('批量删除标签失败: 未选择任何标签');
          toast.error('批量删除标签失败', { description: '未选择任何标签' });
          return;
        }
        
        const results = await Promise.all(
          selectedTags.map((tagId: string) => deleteTag(tagId))
        );
        
        const failures = results.filter((r: any) => !r.success);
        if (failures.length > 0) {
          toast.error('批量删除标签失败', { description: `${failures.length}个标签删除失败` });
        } else {
          toast.success(`已删除 ${selectedTags.length} 个标签`);
        }
        
        clearTagSelection();
      }
      
      // 只有在操作成功时关闭对话框
      if (result.success || deleteTarget.type === 'selected') {
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('操作失败', { description: error instanceof Error ? error.message : '未知错误' });
    }
  };

  // 添加标签到分类
  const handleAddTag = (categoryId: string) => {
    setCreateTagCategoryId(categoryId);
    setShowCreateTag(true);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn('max-w-4xl max-h-[80vh]', className)}>
          {/* 标题和工具栏 */}
          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <h2 className="text-lg font-semibold">标签管理</h2>
              <p className="text-sm text-muted-foreground">管理您的标签和标签分类，创建、编辑、删除和组织标签。</p>
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleteTarget({ type: 'selected' });
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除选中
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 标签分类列表 */}
          <ScrollArea className="flex-1 max-h-[450px]">
            <div className="space-y-3">
              {loading ? (
                <div className="text-center text-muted-foreground">
                  加载中...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : tagCategories.length === 0 ? (
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
                          setDeleteTarget({ type: 'tagCategory', data: tagCategory });
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
                                    setDeleteTarget({ type: 'tag', data: tag as Tag });
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
        </DialogContent>
      </Dialog>

      {/* 创建分类对话框 */}
      <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建标签分类</DialogTitle>
            <DialogDescription>创建一个新的标签分类，用于组织和管理标签。</DialogDescription>
          </DialogHeader>
          <CreateCategoryForm
            onConfirm={handleCreateCategory}
            onCancel={() => setShowCreateCategory(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 创建标签对话框 */}
      <Dialog open={showCreateTag} onOpenChange={setShowCreateTag}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建标签</DialogTitle>
            <DialogDescription>创建一个新的标签并选择所属分类。</DialogDescription>
          </DialogHeader>
          <CreateTagForm
            searchQuery=""
            tagCategories={tagCategories}
            onConfirm={handleCreateTag}
            onCancel={() => setShowCreateTag(false)}
            onCreateCategory={() => {
              setShowCreateTag(false);
              setTimeout(() => setShowCreateCategory(true), 100);
            }}
            selectedTagIds={selectedTags}
            tags={tags}
            onRefetch={refreshAll}
            onTagsChange={setSelectedTags}
          />
        </DialogContent>
      </Dialog>

      {/* 编辑分类对话框 */}
      <EditCategoryDialog
        open={showEditCategory}
        onOpenChange={setShowEditCategory}
        onConfirm={handleUpdateCategory}
        category={editingCategory}
      />

      {/* 编辑标签对话框 */}
      <EditTagDialog
        open={showEditTag}
        onOpenChange={setShowEditTag}
        onConfirm={handleUpdateTag}
        tagCategories={tagCategories}
        tag={editingTag}
      />

      {/* 移动标签对话框 */}
      <MoveTagDialog
        open={showMoveTag}
        onOpenChange={setShowMoveTag}
        onConfirm={handleMoveTagsToCategory}
        tagCategories={tagCategories}
        selectedTags={tags.filter((tag: Tag) => selectedTags.includes(tag.id))}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget.type === 'tagCategory' &&
                `确定要删除分类 "${deleteTarget.data?.name}" 吗？此操作将同时删除该分类下的所有标签。`}
              {deleteTarget.type === 'tag' &&
                `确定要删除标签 "${deleteTarget.data?.name}" 吗？`}
              {deleteTarget.type === 'selected' &&
                `确定要删除选中的 ${selectedTags.length} 个标签吗？`}
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
    </>
  );
}