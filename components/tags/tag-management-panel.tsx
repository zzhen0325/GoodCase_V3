import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
// 数组移动工具函数
function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = [...array];
  const item = newArray.splice(from, 1)[0];
  newArray.splice(to, 0, item);
  return newArray;
}
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
} from 'lucide-react';
import { TagGroup, Tag } from '@/types';
import { TagGroupItem } from './tag-group-item';
import { useTagOperations } from '@/hooks/use-tag-operations';
import { cn } from '@/lib/utils';

interface TagManagementPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string }) => void;
}

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; categoryId?: string }) => void;
  tagCategories: TagGroup[];
  defaultCategoryId?: string;
}

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string }) => void;
  category: TagGroup | null;
}

interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag | null;
  onConfirm: (data: { name: string; categoryId?: string }) => void;
  tagCategories: TagGroup[];
}

interface MoveTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (categoryId: string) => void;
  tagCategories: TagGroup[];
  selectedTags: Tag[];
}



// 创建分类对话框
function CreateCategoryDialog({
  open,
  onOpenChange,
  onConfirm,
}: CreateCategoryDialogProps) {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm({ name: name.trim() });
      setName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建标签分类</DialogTitle>
          <DialogDescription>
            创建一个新的标签分类来组织您的标签。
          </DialogDescription>
        </DialogHeader>

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name?.trim()}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 创建标签对话框
function CreateTagDialog({
  open,
  onOpenChange,
  onConfirm,
  tagCategories,
  defaultCategoryId,
}: CreateTagDialogProps) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // 确保categoryId在tagCategories变化时正确初始化
  React.useEffect(() => {
    if (tagCategories.length > 0) {
      setCategoryId(defaultCategoryId || tagCategories[0].id);
    } else {
      setCategoryId(''); // 没有分类时设置为空
    }
  }, [tagCategories, defaultCategoryId]);

  // 重置表单状态当对话框打开时
  React.useEffect(() => {
    if (open) {
      setName('');
      if (tagCategories.length > 0) {
        setCategoryId(defaultCategoryId || tagCategories[0].id);
      } else {
        setCategoryId(''); // 没有分类时设置为空
      }
    }
  }, [open, tagCategories, defaultCategoryId]);

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm({ name: name.trim(), categoryId: categoryId || undefined });
      setName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建标签</DialogTitle>
          <DialogDescription>在指定分类中创建一个新标签。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tag-name">标签名称</Label>
            <Input
              id="tag-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入标签名称"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <Label htmlFor="tag-category">所属分类</Label>
            {tagCategories.length > 0 ? (
              <select
                id="tag-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {tagCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full p-2 border rounded-md bg-muted text-muted-foreground text-sm">
                暂无分类，标签将创建为未分类状态
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name?.trim()}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
                id="edit-tag-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">无分类</option>
                {tagCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
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
    if (categoryId) {
      onConfirm(categoryId);
      setCategoryId('');
      onOpenChange(false);
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
              {tagCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!categoryId}>
            移动
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TagManagementPanel({
  open,
  onOpenChange,
  className,
}: TagManagementPanelProps) {
  const {
    tagGroups,
    tags,
    selectedTags,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    toggleTagSelection,
    clearTagSelection,
    selectTagsByGroup,
    deleteSelectedTags,
    getTagsByGroup,
    refreshAll,
    createTagGroup,
    updateTagGroup,
    deleteTagGroup,
  } = useTagOperations();

  const [localTagCategories, setLocalTagCategories] = useState<TagGroup[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [createTagCategoryId, setCreateTagCategoryId] = useState<string>('');
  const [showEditCategory, setShowEditCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TagGroup | null>(null);
  const [showEditTag, setShowEditTag] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showMoveTag, setShowMoveTag] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'tag' | 'selected';
    data?: any;
  }>({ type: 'tag' });


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
      await createTagGroup(data);
    } catch (error) {
      console.error('创建分类失败:', error);
    }
  };

  // 处理创建标签
  const handleCreateTag = async (data: { name: string; categoryId?: string }) => {
    try {
      // 随机选择一个颜色主题
      const colorThemes = ['pink', 'cyan', 'yellow', 'green', 'purple'];
      const randomColor = colorThemes[Math.floor(Math.random() * colorThemes.length)];
      
      await createTag({ 
        name: data.name, 
        color: randomColor,
        categoryId: data.categoryId || undefined
      });
    } catch (error) {
      console.error('创建标签失败:', error);
    }
  };

  // 处理编辑分类
  const handleEditCategory = (category: TagGroup) => {
    setEditingCategory(category);
    setShowEditCategory(true);
  };

  const handleUpdateCategory = async (data: { name: string }) => {
    if (editingCategory) {
      try {
        await updateTagGroup(editingCategory.id, data);
      } catch (error) {
        console.error('更新分类失败:', error);
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
        await updateTag(editingTag.id, {
          name: data.name,
          categoryId: data.categoryId || undefined
        });
      } catch (error) {
        console.error('更新标签失败:', error);
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
      await Promise.all(
        selectedTags.map((tagId) => {
          return updateTag(tagId, { categoryId: categoryId });
        })
      );
      clearTagSelection();
      setShowMoveTag(false);
    } catch (error) {
      console.error('移动标签失败:', error);
    }
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    try {
      if (deleteTarget.type === 'category') {
        await deleteTagGroup(deleteTarget.data.id);
      } else if (deleteTarget.type === 'tag') {
        await deleteTag(deleteTarget.data.id);
      } else if (deleteTarget.type === 'selected') {
        await deleteSelectedTags();
      }
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('删除失败:', error);
    }
  };



  // 添加标签到分类
  const handleAddTag = (categoryId: string) => {
    setCreateTagCategoryId(categoryId);
    setShowCreateTag(true);
  };
  const groupedTags = getTagsByGroup();



  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn('max-w-4xl max-h-[80vh]', className)}>
          {/* 标题和工具栏 */}
          <div className="flex items-center justify-between gap-4 py-2 ">
            <div>
              <h2 className="text-lg font-semibold">Tag Management</h2>
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

          {/* 统计信息
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="text-center">
              <div className="text-2xl font-bold">{tagGroups.length}</div>
              <div className="text-sm text-muted-foreground">标签分类</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{tags.length}</div>
              <div className="text-sm text-muted-foreground">标签总数</div>
            </div>
          </div> */}


          {/* 标签分类列表 */}
          <ScrollArea className="flex-1 max-h-[450px]">
            <div className="space-y-3">
              {loading ? (
                <div className="text-center  text-muted-foreground">
                  加载中...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : tagGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无标签分类
                  <div className="text-xs mt-2 text-muted-foreground">
                    请先创建标签分类，然后上传图片时标签会自动归类
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {tagGroups.map((category) => {
                    const categoryTags = tags.filter(tag => tag.categoryId === category.id);
                    
                    return (
                      <TagGroupItem
                        key={category.id}
                        group={category}
                        tags={categoryTags}
                        expanded={true}
                        selectedTags={selectedTags}
                        showUsageCount={false}
                        onTagClick={(tag) => toggleTagSelection(tag.id)}
                        onTagEdit={handleEditTag}
                        onGroupEdit={(updatedCategory) => {
                          setEditingCategory(updatedCategory);
                          setShowEditCategory(true);
                        }}
                        onGroupDelete={(category) => {
                          setDeleteTarget({ type: 'category', data: category });
                          setShowDeleteConfirm(true);
                        }}
                        onAddTag={handleAddTag}
                        onGroupSelect={(categoryId) => {
                          const categoryTags = tags.filter(tag => tag.categoryId === categoryId);
                          const allSelected = categoryTags.every(tag => selectedTags.includes(tag.id));
                          if (allSelected) {
                            // 取消选择该分类的所有标签
                            categoryTags.forEach(tag => {
                              if (selectedTags.includes(tag.id)) {
                                toggleTagSelection(tag.id);
                              }
                            });
                          } else {
                            // 选择该分类的所有标签
                            categoryTags.forEach(tag => {
                              if (!selectedTags.includes(tag.id)) {
                                toggleTagSelection(tag.id);
                              }
                            });
                          }
                        }}
                      />
                    );
                  })}
                  
                  {/* 显示未分类的标签 */}
                  {(() => {
                    const ungroupedTags = tags.filter(tag => !tag.categoryId);
                    
                    if (ungroupedTags.length === 0) return null;
                    
                    return (
                      <div className="border rounded-lg bg-card">
                        <div className="flex items-center justify-between p-3 border-b">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-muted-foreground">未分类标签</span>
                            <Badge variant="secondary" className="text-xs text-black">
                              {ungroupedTags.length} 个标签
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          {ungroupedTags.map((tag) => (
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
                                    style={{ backgroundColor: tag.color || '#64748b' }}
                                  />
                                  <span className="font-medium text-sm">{tag.name}</span>

                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditTag(tag)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteTarget({ type: 'tag', data: tag });
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
                  })()
                  }
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 创建分类对话框 */}
      <CreateCategoryDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        onConfirm={handleCreateCategory}
      />

      {/* 创建标签对话框 */}
      <CreateTagDialog
        open={showCreateTag}
        onOpenChange={setShowCreateTag}
        onConfirm={handleCreateTag}
        tagCategories={tagGroups}
        defaultCategoryId={createTagCategoryId}
      />

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
        tagCategories={tagGroups}
        tag={editingTag}
      />

      {/* 移动标签对话框 */}
      <MoveTagDialog
        open={showMoveTag}
        onOpenChange={setShowMoveTag}
        onConfirm={handleMoveTagsToCategory}
        tagCategories={tagGroups}
        selectedTags={tags.filter((tag) => selectedTags.includes(tag.id))}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget.type === 'category' &&
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
