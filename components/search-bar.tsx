"use client"

import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, Tag as TagIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchFilters, Tag } from '@/types';
import { debounce } from '@/lib/utils';

// 搜索框组件属性
interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  availableTags: Tag[];
  placeholder?: string;
}

// 搜索框组件
export const SearchBar = React.memo(function SearchBar({ 
  onSearch, 
  selectedTags, 
  onTagsChange,
  availableTags,
  placeholder = "搜索图片、提示词或标签..." 
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
    <div className="relative w-full rounded-2xl mb-10">
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          className="pl-10 pr-10 rounded-2xl mt-6 "
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 标签筛选区域 */}
      {availableTags.length > 0 && (
        <div className="mt-1">
          <div className="flex items-center gap-2 mb-3">
            {/* <TagIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">标签筛选</span> */}
           
          </div>
          <div className="flex flex-wrap  gap-2">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.some(t => t.id === tag.id);
              return (
                <Button
                  key={tag.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTagToggle(tag)}
                  className={`h-8 px-3 text-xs rounded-full transition-all duration-200 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'bg-background hover:bg-muted border-muted-foreground/20'
                  }`}
                >
                  {tag.name}
                  {isSelected && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Button>
                
              );
            })}
             {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllTags}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                清空 ({selectedTags.length})
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});