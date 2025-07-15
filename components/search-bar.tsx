"use client"

import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, Tag as TagIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';
import { SearchFilters, Tag } from '@/types';
import { debounce } from '@/lib/utils';

// 搜索框组件属性
interface SearchBarProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onSearch: (filters: { query: string; tags: Tag[] }) => void;
  onTagsChange: (tags: Tag[]) => void;
}

export function SearchBar({
  availableTags,
  selectedTags,
  onSearch,
  onTagsChange,
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  // 防抖搜索函数
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      onSearch({
        query: searchQuery,
        tags: selectedTags
      });
    }, 300),
    [onSearch, selectedTags]
  );

  // 处理搜索输入变化
  const handleSearchChange = useCallback((value: string) => {
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // 清空搜索
  const clearSearch = useCallback(() => {
    setQuery('');
    onSearch({
      query: '',
      tags: selectedTags
    });
  }, [onSearch, selectedTags]);

  // 处理输入框变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchChange(e.target.value);
  }, [handleSearchChange]);

  // 处理标签选择
  const handleTagToggle = useCallback((tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      // 取消选择
      const newTags = selectedTags.filter(t => t.id !== tag.id);
      onTagsChange(newTags);
    } else {
      // 添加选择
      const newTags = [...selectedTags, tag];
      onTagsChange(newTags);
    }
  }, [selectedTags, onTagsChange]);

  // 清空所有标签选择
  const clearAllTags = useCallback(() => {
    onTagsChange([]);
  }, [onTagsChange]);

  return (
    <div className="">
      <div className="relative ">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 transition-colors duration-200" />
        <Input
          type="text"
          placeholder="Search images..."
          value={query}
          onChange={handleInputChange}
          className="w-full h-12 pl-11 pr-10 rounded-xl bg-gray-100  text-base placeholder:text-gray-400 focus:ring-2  focus:bg-white transition-all duration-300"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-white"
            onClick={clearSearch}
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>


    </div>
  );
}