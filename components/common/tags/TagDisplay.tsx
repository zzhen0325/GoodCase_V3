'use client';

import React from 'react';
import { Tag, TagCategory } from '@/types';
import { TagItem } from './TagItem';

interface TagDisplayProps {
  tagIds: string[];
  tags: Tag[];
  tagCategories: TagCategory[];
  isEditing?: boolean;
  onRemoveTag?: (tagId: string) => void;
  emptyText?: string;
  keyPrefix?: string;
  className?: string;
}

export function TagDisplay({
  tagIds,
  tags,
  tagCategories,
  isEditing = false,
  onRemoveTag,
  emptyText = '暂无标签',
  keyPrefix = 'tag',
  className
}: TagDisplayProps) {
  if (tagIds.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground ${className || ''}`}>
        {emptyText}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className || ''}`}>
      {tagIds.map((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        if (!tag) return null;

        const category = tagCategories.find((c) => c.id === tag.categoryId);

        return (
          <TagItem
            key={`${keyPrefix}-${tag.id}`}
            tag={tag}
            category={category}
            isEditing={isEditing}
            onRemove={onRemoveTag ? (tag: Tag) => onRemoveTag(tag.id) : undefined}
          />
        );
      })}
    </div>
  );
}