import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { X, Hash, Edit } from 'lucide-react';
import { Tag, TagCategory, getColorTheme } from '@/types';
import { cn } from '@/lib/utils';

interface TagItemProps {
  tag: Tag;
  group?: TagCategory;
  selected?: boolean;
  showUsageCount?: boolean;
  showRemove?: boolean;
  showEdit?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  onClick?: (tag: Tag) => void;
  onRemove?: (tag: Tag) => void;
  onEdit?: (tag: Tag) => void;
  className?: string;
}

export function TagItem({
  tag,
  group,
  selected = false,
  showUsageCount = false,
  showRemove = false,
  showEdit = false,
  size = 'md',
  variant = 'default',
  onClick,
  onRemove,
  onEdit,
  className,
}: TagItemProps) {
  const handleClick = () => {
    onClick?.(tag);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(tag);
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.id });

const dragStyle = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.7 : 1,
};

// 获取标签的颜色主题
const colorTheme = group ? getColorTheme(group.color || 'gray') : getColorTheme('pink');

const badgeStyle = {
  backgroundColor: selected
    ? colorTheme.primary
    : variant === 'outline'
      ? 'transparent'
      : colorTheme.bg,
  borderColor: colorTheme.primary,
  color: selected ? 'white' : colorTheme.text,
};

return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      {...attributes}
      {...listeners}
    >
      <Badge
        variant={badgeVariant}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl cursor-pointer transition-all duration-200',
          'hover:shadow-sm hover:scale-105',
          selected && 'ring-2 ring-muted ring-offset-1',
          sizeClasses[size],
          className
        )}
        style={badgeStyle}
        onClick={handleClick}
      >
      <Hash className="w-3 h-3" />
      <span className="font-medium">{tag.name}</span>

     

     

     
      </Badge>
    </div>
  );
}
