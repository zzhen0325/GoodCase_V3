'use client';

import * as React from 'react';
import { TagGroup, Tag } from '@/types';
import { useTagFilter } from '@/hooks/use-tag-filter';
import { SearchFilters } from '@/types';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { ChevronRight, Check } from 'lucide-react';

interface TagGroupsProps {
  tagGroups: TagGroup[];
  tags: Tag[];
  currentFilters?: SearchFilters;
  onSearch?: (filters: SearchFilters) => void;
  loading?: boolean;
}

const TagGroupItem = React.memo(({ 
  group, 
  groupTags, 
  isExpanded, 
  onToggleExpanded, 
  handleTagClick, 
  isTagSelected 
}: {
  group: TagGroup;
  groupTags: Tag[];
  isExpanded: boolean;
  onToggleExpanded: (groupId: string) => void;
  handleTagClick: (tagId: string) => void;
  isTagSelected: (tagName: string) => boolean;
}) => {
  return (
    <SidebarGroup>
      <SidebarGroupLabel asChild>
        <SidebarMenuButton
          onClick={() => onToggleExpanded(group.id)}
          className="w-full justify-between text-sm font-medium"
          data-state={isExpanded ? 'open' : 'closed'}
        >
          <div className="flex items-center gap-2">
            <ChevronRight 
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`} 
            />
            <span>{group.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">
              ({groupTags.length})
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarGroupLabel>
      
      {isExpanded && (
        <SidebarGroupContent>
          <SidebarMenuSub>
            {groupTags.map((tag) => {
              const isSelected = isTagSelected(tag.name);
              return (
                <SidebarMenuSubItem key={tag.id}>
                  <SidebarMenuSubButton
                    onClick={() => handleTagClick(tag.id)}
                    isActive={isSelected}
                    className="w-full justify-between"
                  >
                    <span className="truncate ">{tag.name}</span>
                    {isSelected && (
                      <Check className="h-3 w-3 opacity-70" />
                    )}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
});

TagGroupItem.displayName = 'TagGroupItem';

export function TagGroups({ 
  tagGroups, 
  tags, 
  currentFilters, 
  onSearch, 
  loading 
}: TagGroupsProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(
    new Set(tagGroups.map(group => group.id))
  );

  // 当tagGroups变化时，确保所有分组都展开
  React.useEffect(() => {
    if (tagGroups.length > 0) {
      setExpandedGroups(new Set(tagGroups.map(group => group.id)));
    }
  }, [tagGroups]);

  // 使用自定义hook管理标签筛选逻辑
  const { handleTagClick, isTagSelected } = useTagFilter({
    tags,
    currentFilters,
    onSearch,
  });

  // 处理ALL选项点击
  const handleAllClick = React.useCallback(() => {
    onSearch?.({
      query: currentFilters?.query || '',
      tags: [],
      dateRange: currentFilters?.dateRange,
      sizeRange: currentFilters?.sizeRange,
      sortBy: currentFilters?.sortBy || 'createdAt',
      sortOrder: currentFilters?.sortOrder || 'desc',
    });
  }, [currentFilters, onSearch]);

  // 检查是否选中了ALL（即没有选中任何标签）
  const isAllSelected = React.useMemo(() => {
    return !currentFilters?.tags || currentFilters.tags.length === 0;
  }, [currentFilters?.tags]);

  // 切换分组展开状态
  const toggleGroupExpanded = React.useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // 获取分组的标签
  const getGroupTags = React.useCallback((groupId: string) => {
    return tags.filter((tag) => tag.categoryId === groupId);
  }, [tags]);

  if (loading) {
    return (
      <div className="px-4 text-sm text-muted-foreground">加载中...</div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ALL选项 */}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleAllClick}
                isActive={isAllSelected}
                className="w-full h-10 justify-between font-medium px-4"  
              >
                <span>Show All Tags</span>
                {isAllSelected && (
                  <Check className="h-3 w-3 opacity-70" />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      
      {tagGroups.map((group) => {
        const groupTags = getGroupTags(group.id);
        const isExpanded = expandedGroups.has(group.id);

        return (
          <TagGroupItem
            key={group.id}
            group={group}
            groupTags={groupTags}
            isExpanded={isExpanded}
            onToggleExpanded={toggleGroupExpanded}
            handleTagClick={handleTagClick}
            isTagSelected={isTagSelected}
          />
        );
      })}
    </div>
  );
}