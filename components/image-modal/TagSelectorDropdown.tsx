import React from 'react';

export interface TagSelectorDropdownProps {
  tags: any[];
  tagGroups: any[];
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefetch?: () => void;
}

export function TagSelectorDropdown(props: TagSelectorDropdownProps) {
  // 标签选择器下拉组件
  return null;
}
