'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Hash, Edit } from 'lucide-react';
import { Tag, TagCategory, getColorTheme } from '@/types';
import { cn } from '@/lib/utils/common';

interface TagItemProps {
  tag: Tag;
  category?: TagCategory;
  group?: TagCategory; // 兼容旧版本
  selected?: boolean;
  showUsageCount?: boolean;
  showRemove?: boolean;
  showEdit?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  draggable?: boolean;
  isEditing?: boolean; // 兼容简化版本
  onClick?: (tag: Tag) => void;
  onRemove?: ((tag: Tag) => void) | ((tagId: string) => void); // 兼容两种签名
  onEdit?: (tag: Tag) => void;
  className?: string;
}

export function TagItem({
  tag,
  category,
  group, // 兼容旧版本
  selected = false,
  showUsageCount = false,
  showRemove = false,
  showEdit = false,
  showIcon = true,
  size = 'md',
  variant = 'default',
  draggable = false,
  isEditing = false, // 兼容简化版本
  onClick,
  onRemove,
  onEdit,
  className,
}: TagItemProps) {
  const actualCategory = category || group;
  const actualShowRemove = showRemove || isEditing;
  
  const handleClick = () => {
    onClick?.(tag);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      // 检查函数参数数量来判断签名类型
      if (onRemove.length === 1) {
        // 如果参数数量为1，可能是 (tag: Tag) => void 或 (tagId: string) => void
        // 先尝试作为 Tag 类型调用
        try {
          (onRemove as (tag: Tag) => void)(tag);
        } catch {
          // 如果失败，则作为 string 类型调用
          (onRemove as (tagId: string) => void)(tag.id);
        }
      } else {
        // 默认作为 string 类型调用
        (onRemove as (tagId: string) => void)(tag.id);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(tag);
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const badgeVariant = selected ? 'default' : variant;

  // 拖拽功能（可选）
  const sortableProps = draggable ? useSortable({ id: tag.id }) : {
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortableProps;

  const dragStyle = draggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  } : {};

  // 获取标签的颜色主题
  const colorTheme = actualCategory ? getColorTheme(actualCategory.color || 'gray') : getColorTheme('pink');

  const badgeStyle = {
    backgroundColor: selected
      ? colorTheme.primary
      : variant === 'outline'
        ? 'transparent'
        : colorTheme.bg,
    borderColor: colorTheme.primary,
    color: selected ? 'white' : colorTheme.text,
  };

  const content = (
    <Badge
      variant={badgeVariant}
      className={cn(
        'inline-flex items-center gap-1.5 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-sm hover:scale-105',
        selected && 'ring-2 ring-primary ring-offset-1',
        sizeClasses[size],
        className
      )}
      style={badgeStyle}
      onClick={handleClick}
    >
      {showIcon && <Hash className="w-3 h-3" />}
      <span className="font-medium">{tag.name}</span>

      {showUsageCount && (
        <span className="text-xs opacity-75">(0)</span>
      )}

      {showEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 ml-1 hover:bg-blue-500/20"
          onClick={handleEdit}
          title="编辑标签"
        >
          <Edit className="w-3 h-3" />
        </Button>
      )}

      {actualShowRemove && (
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 ml-1 hover:bg-red-500/20"
          onClick={handleRemove}
          title="删除标签"
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </Badge>
  );

  if (draggable) {
    return (
      <div
        ref={setNodeRef}
        style={dragStyle}
        {...attributes}
        {...listeners}
      >
        {content}
      </div>
    );
  }

  return content;
}