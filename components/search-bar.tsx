"use client"

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchFilters, Tag } from '@/types';
import { debounce } from '@/lib/utils';

// 搜索框组件属性
interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  placeholder?: string;
}

// 搜索框组件
export function SearchBar({ 
  onSearch, 
  selectedTags, 
  onTagsChange, 
  placeholder = "搜索图片、提示词或标签..." 
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  // 防抖搜索函数
  const debouncedSearch = React.useMemo(
    () => debounce((searchQuery: string) => {
      onSearch({
        query: searchQuery,
        tags: selectedTags
      });
    }, 300),
    [onSearch, selectedTags]
  );

  // 处理搜索输入变化
  const handleSearchChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  // 清空搜索
  const clearSearch = () => {
    setQuery('');
    onSearch({
      query: '',
      tags: selectedTags
    });
  };

  return (
    <div className="relative w-full rounded-2xl mb-10">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10 rounded-2xl mt-6 mb-3"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2  "
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}