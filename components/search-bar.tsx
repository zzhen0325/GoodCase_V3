'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchFilters, DEFAULT_SEARCH_FILTERS } from '@/types';
import { debounce } from '@/lib/utils/common';

// 搜索框组件属性
interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  currentFilters?: SearchFilters;
}

export function SearchBar({
  onSearch,
  currentFilters = DEFAULT_SEARCH_FILTERS,
}: SearchBarProps) {
  const [query, setQuery] = useState(currentFilters.query || '');
  const [isFocused, setIsFocused] = useState(false);

  // 防抖搜索函数
  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery: string) => {
        onSearch({
          ...currentFilters,
          query: searchQuery,
        });
      }, 300),
    [onSearch, currentFilters]
  );

  // 处理搜索输入变化
  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // 清空搜索
  const clearSearch = useCallback(() => {
    setQuery('');
    onSearch({
      ...currentFilters,
      query: '',
    });
  }, [onSearch, currentFilters]);

  // 处理输入框变化
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSearchChange(e.target.value);
    },
    [handleSearchChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 ">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black transition-colors duration-200" />
          <Input
            type="text"
            placeholder="Search images..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full h-12 pl-11 pr-10 rounded-lg bg-muted/30 border-border text-black placeholder:text-black focus:ring-2   focus:bg-white transition-all duration-300"
          />
          {isFocused && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-accent/50"
              onClick={clearSearch}
            >
              <X className="h-4 w-4 text-black " />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
