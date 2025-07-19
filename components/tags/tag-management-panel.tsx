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
  Search,
  Trash2,
  Edit,
  Edit2,
  FolderPlus,
  Tags as TagsIcon,
  BarChart3,
  Move,
} from 'lucide-react';
import { TagGroup, Tag } from '@/types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { TagGroupItem } from './tag-group-item';
import { useTagOperations } from '@/hooks/use-tag-operations';
import { cn } from '@/lib/utils';

interface TagManagementPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; color: string }) => void;
}

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; groupId: string }) => void;
  tagGroups: TagGroup[];
  defaultGroupId?: string;
}

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; color: string }) => void;
  group: TagGroup | null;
}

interface EditTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; groupId: string }) => void;
  tagGroups: TagGroup[];
  tag: Tag | null;
}

interface MoveTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (groupId: string) => void;
  tagGroups: TagGroup[];
  selectedTags: Tag[];
}

// 颜色选项
const COLOR_OPTIONS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#64748b',
  '#6b7280',
  '#374151',
];

// 创建分组对话框
function CreateGroupDialog({
  open,
  onOpenChange,
  onConfirm,
}: CreateGroupDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm({ name: name.trim(), color });
      setName('');
      setColor(COLOR_OPTIONS[0]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建标签分组</DialogTitle>
          <DialogDescription>
            创建一个新的标签分组来组织您的标签。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="group-name">分组名称</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入分组名称"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <Label>分组颜色</Label>
            <div className="grid grid-cols-10 gap-2 mt-2">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all',
                    color === colorOption
                      ? 'border-foreground scale-110'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => setColor(colorOption)}
                />
              ))}
            </div>
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
  tagGroups,
  defaultGroupId,
}: CreateTagDialogProps) {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');

  // 确保groupId在tagGroups变化时正确初始化
  React.useEffect(() => {
    if (tagGroups.length > 0) {
      setGroupId(defaultGroupId || tagGroups[0].id);
    }
  }, [tagGroups, defaultGroupId]);

  // 重置表单状态当对话框打开时
  React.useEffect(() => {
    if (open) {
      setName('');
      if (tagGroups.length > 0) {
        setGroupId(defaultGroupId || tagGroups[0].id);
      }
    }
  }, [open, tagGroups, defaultGroupId]);

  const handleSubmit = () => {
    if (name.trim() && groupId) {
      onConfirm({ name: name.trim(), groupId });
      setName('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建标签</DialogTitle>
          <DialogDescription>在指定分组中创建一个新标签。</DialogDescription>
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
            <Label htmlFor="tag-group">所属分组</Label>
            <select
              id="tag-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {tagGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name?.trim() || !groupId}>
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 编辑分组对话框
function EditGroupDialog({
  open,
  onOpenChange,
  onConfirm,
  group,
}: EditGroupDialogProps) {
  const [name, setName] = useState(group?.name || '');
  const [color, setColor] = useState(group?.color || COLOR_OPTIONS[0]);

  React.useEffect(() => {
    if (group) {
      setName(group.name);
      setColor(group.color);
    }
  }, [group]);

  const handleSubmit = () => {
    if (name.trim()) {
      onConfirm({ name: name.trim(), color });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑标签分组</DialogTitle>
          <DialogDescription>修改标签分组的名称和颜色。</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-group-name">分组名称</Label>
            <Input
              id="edit-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入分组名称"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <Label>分组颜色</Label>
            <div className="grid grid-cols-10 gap-2 mt-2">
              {COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 transition-all',
                    color === colorOption
                      ? 'border-foreground scale-110'
                      : 'border-transparent'
                  )}
                  style={{ backgroundColor: colorOption }}
                  onClick={() => setColor(colorOption)}
                />
              ))}
            </div>
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
  tagGroups,
  tag,
}: EditTagDialogProps) {
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');

  React.useEffect(() => {
    if (tag) {
      setName(tag.name);
      setGroupId(tag.groupId || '');
    }
  }, [tag]);

  const handleSubmit = () => {
    if (name.trim() && groupId) {
      onConfirm({ name: name.trim(), groupId });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑标签</DialogTitle>
          <DialogDescription>修改标签的名称和所属分组。</DialogDescription>
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
            <Label htmlFor="edit-tag-group">所属分组</Label>
            <select
              id="edit-tag-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {tagGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!name?.trim() || !groupId}>
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
  tagGroups,
  selectedTags,
}: MoveTagDialogProps) {
  const [groupId, setGroupId] = useState('');

  const handleSubmit = () => {
    if (groupId) {
      onConfirm(groupId);
      setGroupId('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>移动标签</DialogTitle>
          <DialogDescription>
            将选中的 {selectedTags.length} 个标签移动到指定分组。
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
            <Label htmlFor="move-tag-group">目标分组</Label>
            <select
              id="move-tag-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">请选择目标分组</option>
              {tagGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!groupId}>
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
    searchQuery,
    loading,
    error,
    createTag,
    updateTag,
    deleteTag,
    toggleTagSelection,
    clearTagSelection,
    selectTagsByGroup,
    deleteSelectedTags,
    setSearchQuery,
    getTagsByGroup,
    getFilteredTagGroups,
    refreshAll,
  } = useTagOperations();

  const [localTagGroups, setLocalTagGroups] = useState<TagGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [createTagGroupId, setCreateTagGroupId] = useState<string>('');
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TagGroup | null>(null);
  const [showEditTag, setShowEditTag] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showMoveTag, setShowMoveTag] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'group' | 'tag' | 'selected';
    data?: any;
  }>({ type: 'tag' });


  // 切换分组展开状态
  const toggleGroupExpand = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // 创建分组方法
  const createTagGroup = async (data: { name: string; color: string }) => {
    const db = getDb();
    if (!db) {
      throw new Error('数据库连接失败');
    }
    const currentGroups = tagGroups.length > 0 ? tagGroups : localTagGroups;
    const maxOrder = currentGroups.length > 0 ? Math.max(...currentGroups.map((g: TagGroup) => g.order ?? 0)) : 0;
    const newGroup: Omit<TagGroup, 'id'> = {
      name: data.name,
      color: data.color,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tagCount: 0,
    };
    const docRef = await addDoc(collection(db, 'tagGroups'), { ...newGroup, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    const newGroupWithId = { ...newGroup, id: docRef.id };
    setLocalTagGroups([...currentGroups, newGroupWithId]);
    // 刷新数据以确保新创建的分组能够显示
    refreshAll();
    return { success: true };
  };

  // 更新分组方法
  const updateTagGroup = async (id: string, data: { name: string; color: string }) => {
    console.warn('标签分组功能已简化，暂不支持更新');
    return { success: false };
  };

  // 删除分组方法
  const deleteTagGroup = async (id: string) => {
    console.warn('标签分组功能已简化，暂不支持删除');
    return { success: false };
  };

  // 处理创建分组
  const handleCreateGroup = async (data: { name: string; color: string }) => {
    try {
      await createTagGroup(data);
    } catch (error) {
      console.error('创建分组失败:', error);
    }
  };

  // 处理创建标签
  const handleCreateTag = async (data: { name: string; groupId: string }) => {
    try {
      await createTag({ ...data, color: '#64748b' });
    } catch (error) {
      console.error('创建标签失败:', error);
    }
  };

  // 处理编辑分组
  const handleEditGroup = (group: TagGroup) => {
    setEditingGroup(group);
    setShowEditGroup(true);
  };

  const handleUpdateGroup = async (data: { name: string; color: string }) => {
    if (editingGroup) {
      try {
        await updateTagGroup(editingGroup.id, data);
      } catch (error) {
        console.error('更新分组失败:', error);
      }
    }
  };

  // 处理编辑标签
  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setShowEditTag(true);
  };

  const handleUpdateTag = async (data: { name: string; groupId: string }) => {
    if (editingTag) {
      try {
        await updateTag(editingTag.id, data);
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

  const handleMoveTagsToGroup = async (groupId: string) => {
    try {
      await Promise.all(
        selectedTags.map((tagId) => {
          const tag = tags.find((t) => t.id === tagId);
          if (tag) {
            return updateTag(tagId, { name: tag.name, groupId });
          }
          return Promise.resolve();
        })
      );
      clearTagSelection();
    } catch (error) {
      console.error('移动标签失败:', error);
    }
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    try {
      if (deleteTarget.type === 'group') {
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



  // 添加标签到分组
  const handleAddTag = (groupId: string) => {
    setCreateTagGroupId(groupId);
    setShowCreateTag(true);
  };
  const { getFilteredTags } = useTagOperations();
  const groupedTags = getTagsByGroup();
  const filteredGroups = getFilteredTagGroups();

  // 拖拽state
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // 更新分组顺序方法
  const updateGroupOrder = (newGroups: TagGroup[]) => {
    console.warn('标签分组功能已简化，暂不支持排序');
  };

  // 更新标签在分组内的顺序
  const updateTagOrderInGroup = (groupId: string, newTags: Tag[]) => {
    console.warn('标签分组功能已简化，暂不支持排序');
  };

  // 移动标签到其他分组
  const moveTagToGroup = (tagId: string, toGroupId: string) => {
    console.warn('标签分组功能已简化，暂不支持跨分组移动');
  };

  // 分组顺序更新
  const handleGroupDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = tagGroups.findIndex((g: TagGroup) => g.id === active.id);
      const newIndex = tagGroups.findIndex((g: TagGroup) => g.id === over.id);
      // 这里应调用重排分组顺序的 handler
      if (oldIndex !== -1 && newIndex !== -1) {
        updateGroupOrder(arrayMove(tagGroups, oldIndex, newIndex));
      }
    }
    setActiveGroupId(null);
  };

  // 获取分组标签数据 - 暂时使用空对象，因为标签分组功能已简化
  const groupedTagsData: Record<string, { tags: Tag[] }> = {};

  // 标签拖拽排序、跨分组移动
  const handleTagDragEnd = (event: any, groupId: string) => {
    const { active, over } = event;
    if (!active.data.current) return;
    const fromGroupId = active.data.current.groupId;
    const tagId = active.id;
    if (!fromGroupId) return;
    // 源数据查找
    const fromTags = groupedTagsData[fromGroupId]?.tags || [];
    let toGroupId = groupId;
    if (!over || !over.data?.current) {
      setActiveTag(null);
      return;
    }
    // 目标分组 id
    if (over.data.current.groupId) {
      toGroupId = over.data.current.groupId;
    }
    if (fromGroupId === toGroupId) {
      // 同组内排序逻辑（可调用后端/状态）
      const oldIdx = fromTags.findIndex((t: Tag) => t.id === tagId);
      const newIdx = fromTags.findIndex((t: Tag) => t.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        updateTagOrderInGroup(fromGroupId, arrayMove(fromTags, oldIdx, newIdx));
      }
    } else {
      // 跨分组移动
      moveTagToGroup(tagId, toGroupId);
    }
    setActiveTag(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn('max-w-4xl max-h-[80vh]', className)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TagsIcon className="w-5 h-5" />
              标签管理
            </DialogTitle>
            <DialogDescription>
              管理您的标签分组和标签，组织您的图片内容。
            </DialogDescription>
          </DialogHeader>

          {/* 工具栏 */}
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-2 flex-1">
              {selectedTags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
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

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateTag(true)}
                disabled={tagGroups.length === 0}
                title={tagGroups.length === 0 ? '请先创建标签分组' : ''}
              >
                <Plus className="w-4 h-4 mr-1" />
                新建标签
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateGroup(true)}
              >
                <FolderPlus className="w-4 h-4 mr-1" />
                新建分组
              </Button>
            </div>
          </div>

          <Separator />

          {/* 统计信息 */}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="text-center">
              <div className="text-2xl font-bold">{tagGroups.length}</div>
              <div className="text-sm text-muted-foreground">标签分组</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{tags.length}</div>
              <div className="text-sm text-muted-foreground">标签总数</div>
            </div>
          </div>

          <Separator />

          {/* 标签分组列表 */}
          <ScrollArea className="flex-1 max-h-[400px]">
            <div className="space-y-3 pr-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  加载中...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
              ) : tagGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? '未找到匹配的分组' : '暂无标签分组'}
                  <div className="text-xs mt-2 text-muted-foreground">
                    请先创建标签分组，然后上传图片时标签会自动归类
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredGroups.map((group) => {
                    const groupTags = tags.filter(tag => tag.groupId === group.id);
                    const filteredGroupTags = groupTags.filter(tag => 
                      !searchQuery || tag.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    
                    // 如果有搜索查询且该分组下没有匹配的标签，则不显示该分组
                    if (searchQuery && filteredGroupTags.length === 0) {
                      return null;
                    }
                    
                    return (
                      <TagGroupItem
                        key={group.id}
                        group={group}
                        tags={filteredGroupTags}
                        expanded={true}
                        selectedTags={selectedTags}
                        showUsageCount={false}
                        onTagClick={(tag) => toggleTagSelection(tag.id)}
                        onTagEdit={handleEditTag}
                        onGroupEdit={(updatedGroup) => {
                          setEditingGroup(updatedGroup);
                          setShowEditGroup(true);
                        }}
                        onGroupDelete={(group) => {
                          setDeleteTarget({ type: 'group', data: group });
                          setShowDeleteConfirm(true);
                        }}
                        onAddTag={handleAddTag}
                        onGroupSelect={(groupId) => {
                          const groupTags = tags.filter(tag => tag.groupId === groupId);
                          const allSelected = groupTags.every(tag => selectedTags.includes(tag.id));
                          if (allSelected) {
                            // 取消选择该分组的所有标签
                            groupTags.forEach(tag => {
                              if (selectedTags.includes(tag.id)) {
                                toggleTagSelection(tag.id);
                              }
                            });
                          } else {
                            // 选择该分组的所有标签
                            groupTags.forEach(tag => {
                              if (!selectedTags.includes(tag.id)) {
                                toggleTagSelection(tag.id);
                              }
                            });
                          }
                        }}
                      />
                    );
                  })}
                  
                  {/* 显示未分组的标签 */}
                  {(() => {
                    const ungroupedTags = tags.filter(tag => !tag.groupId);
                    const filteredUngroupedTags = ungroupedTags.filter(tag => 
                      !searchQuery || tag.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    
                    if (filteredUngroupedTags.length === 0) return null;
                    
                    return (
                      <div className="border rounded-lg bg-card">
                        <div className="flex items-center justify-between p-3 border-b">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-muted-foreground">未分组标签</span>
                            <Badge variant="secondary" className="text-xs">
                              {filteredUngroupedTags.length} 个标签
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          {filteredUngroupedTags.map((tag) => (
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

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
            <Button onClick={refreshAll}>刷新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建分组对话框 */}
      <CreateGroupDialog
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        onConfirm={handleCreateGroup}
      />

      {/* 创建标签对话框 */}
      <CreateTagDialog
        open={showCreateTag}
        onOpenChange={setShowCreateTag}
        onConfirm={handleCreateTag}
        tagGroups={tagGroups}
        defaultGroupId={createTagGroupId}
      />

      {/* 编辑分组对话框 */}
      <EditGroupDialog
        open={showEditGroup}
        onOpenChange={setShowEditGroup}
        onConfirm={handleUpdateGroup}
        group={editingGroup}
      />

      {/* 编辑标签对话框 */}
      <EditTagDialog
        open={showEditTag}
        onOpenChange={setShowEditTag}
        onConfirm={handleUpdateTag}
        tagGroups={tagGroups}
        tag={editingTag}
      />

      {/* 移动标签对话框 */}
      <MoveTagDialog
        open={showMoveTag}
        onOpenChange={setShowMoveTag}
        onConfirm={handleMoveTagsToGroup}
        tagGroups={tagGroups}
        selectedTags={tags.filter((tag) => selectedTags.includes(tag.id))}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget.type === 'group' &&
                `确定要删除分组 "${deleteTarget.data?.name}" 吗？此操作将同时删除该分组下的所有标签。`}
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
