import { useCallback } from 'react';
import { SearchFilters } from '@/types';
import { Tag } from '@/types';

interface UseTagFilterProps {
  tags: Tag[];
  currentFilters?: SearchFilters;
  onSearch?: (filters: SearchFilters) => void;
}

export function useTagFilter({ tags, currentFilters, onSearch }: UseTagFilterProps) {
  // 处理标签点击筛选 - 使用Set优化性能
  const handleTagClick = useCallback((tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    
    const currentTagsSet = new Set(currentFilters?.tags || []);
    
    if (currentTagsSet.has(tag.name)) {
      currentTagsSet.delete(tag.name);
    } else {
      currentTagsSet.add(tag.name);
    }
    
    const newTags = Array.from(currentTagsSet);

    onSearch?.({
      query: currentFilters?.query || '',
      tags: newTags,
      dateRange: currentFilters?.dateRange,
      sizeRange: currentFilters?.sizeRange,
      sortBy: currentFilters?.sortBy || 'createdAt',
      sortOrder: currentFilters?.sortOrder || 'desc',
    });
  }, [tags, currentFilters, onSearch]);

  // 检查标签是否被选中
  const isTagSelected = useCallback((tagName: string) => {
    const selectedTags = currentFilters?.tags || [];
    return selectedTags.includes(tagName);
  }, [currentFilters?.tags]);

  return {
    handleTagClick,
    isTagSelected,
    selectedTags: currentFilters?.tags || [],
  };
}