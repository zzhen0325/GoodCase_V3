import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { TagCategory, Tag } from '@/types';
import { TagItem } from './tag-item';
import { cn } from '@/lib/utils';

interface TagGroupItemProps {
  group: TagCategory;
  tags: Tag[];
  expanded?: boolean;
  selectedTags?: string[];
  showUsageCount?: boolean;
  onToggleExpand?: (groupId: string) => void;
  onTagClick?: (tag: Tag) => void;
  onTagRemove?: (tag: Tag) => void;
  onTagEdit?: (tag: Tag) => void;
  onGroupEdit?: (group: TagCategory) => void;
  onGroupDelete?: (group: TagCategory) => void;
  onAddTag?: (groupId: string) => void;
  onGroupSelect?: (groupId: string) => void;
  className?: string;
}

export function TagGroupItem({
  group,
  tags,
  expanded = false,
  selectedTags = [],
  showUsageCount = false,
  onToggleExpand,
  onTagClick,
  onTagRemove,
  onTagEdit,
  onGroupEdit,
  onGroupDelete,
  onAddTag,
  onGroupSelect,
  className,
}: TagGroupItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(group.name);

  const handleToggleExpand = () => {
    onToggleExpand?.(group.id);
  };

  const handleGroupSelect = () => {
    onGroupSelect?.(group.id);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditName(group.name);
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editName !== group.name) {
      onGroupEdit?.({
        ...group,
        name: editName.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(group.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const selectedTagsInGroup = tags.filter((tag: Tag) =>
    selectedTags.includes(tag.id)
  ).length;
  const allTagsSelected =
    tags.length > 0 && selectedTagsInGroup === tags.length;
  const someTagsSelected =
    selectedTagsInGroup > 0 && selectedTagsInGroup < tags.length;

  return (
    <div className={cn('border rounded-lg bg-card', className)}>
      {/* 分组头部 */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2 flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleToggleExpand}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>

          <div
            className="flex items-center gap-2 cursor-pointer flex-1"
            onClick={handleToggleExpand}
          >
            {expanded ? (
              <FolderOpen className="w-4 h-4 text-black" />
            ) : (
              <Folder className="w-4 h-4 text-black" />
            )}

            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                className="h-6 text-sm font-medium"
                autoFocus
              />
            ) : (
              <span className="font-medium text-sm">{group.name}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="text-xs text-black"
            >
              {(group as any).tagCount || 0} 个标签
            </Badge>

            {someTagsSelected && (
              <Badge variant="outline" className="text-xs">
                {selectedTagsInGroup}/{tags.length} 选中
              </Badge>
            )}

            {allTagsSelected && <Badge className="text-xs">全选</Badge>}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onAddTag?.(group.id)}
            title="添加标签"
          >
            <Plus className="w-3 h-3" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleGroupSelect}>
                {allTagsSelected ? '取消全选' : '全选标签'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4" />
                编辑分组
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onGroupDelete?.(group)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                删除分组
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 标签列表 */}
      {expanded && (
        <div className="p-4">
          {tags.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              暂无标签
            </div>
          ) : (
            <SortableContext id={group.id} items={tags.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <TagItem
                    key={tag.id}
                    tag={tag}
                    group={group}
                    selected={selectedTags.includes(tag.id)}
                    showUsageCount={showUsageCount}
                    showRemove
                    showEdit
                    onClick={onTagClick}
                    onRemove={onTagRemove}
                    onEdit={onTagEdit}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}
