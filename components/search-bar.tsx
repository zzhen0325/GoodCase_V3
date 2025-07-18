"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Search, X, Tags, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchFilters, DEFAULT_SEARCH_FILTERS } from "@/types";
import { debounce } from "@/lib/utils";
import { TagSelector } from "@/components/tags/tag-selector";
import { TagManagementPanel } from "@/components/tags/tag-management-panel";
import { useTagOperations } from "@/hooks/use-tag-operations";

// 搜索框组件属性
interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  currentFilters?: SearchFilters;
}

export function SearchBar({
  onSearch,
  currentFilters = DEFAULT_SEARCH_FILTERS,
}: SearchBarProps) {
  const [query, setQuery] = useState(currentFilters.query || "");
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showTagManagement, setShowTagManagement] = useState(false);
  
  // 获取标签数据
  const { tags, tagGroups } = useTagOperations();

  // 防抖搜索函数
  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery: string, tagIds?: string[]) => {
        onSearch({
          ...currentFilters,
          query: searchQuery,
          tags: tagIds || currentFilters.tags,
        });
      }, 300),
    [onSearch, currentFilters],
  );

  // 处理搜索输入变化
  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  // 处理标签选择
  const handleTagsChange = useCallback(
    (tagIds: string[]) => {
      onSearch({
        ...currentFilters,
        query,
        tags: tagIds,
      });
    },
    [onSearch, currentFilters, query],
  );

  // 清空搜索
  const clearSearch = useCallback(() => {
    setQuery("");
    onSearch({
      ...currentFilters,
      query: "",
      tags: [],
    });
  }, [onSearch, currentFilters]);

  // 清空标签筛选
  const clearTags = useCallback(() => {
    onSearch({
      ...currentFilters,
      tags: [],
    });
  }, [onSearch, currentFilters]);

  // 处理输入框变化
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSearchChange(e.target.value);
    },
    [handleSearchChange],
  );

  const selectedTagsCount = currentFilters.tags?.length || 0;
  const hasActiveFilters = query || selectedTagsCount > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-Secondary transition-colors duration-200" />
          <Input
            type="text"
            placeholder="Search images..."
            value={query}
            onChange={handleInputChange}
            className="w-full h-12 pl-11 pr-10 rounded-xl bg-white border-border text-black placeholder:text-Secondary focus:ring-2 focus:bg-white transition-all duration-300"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-white"
              onClick={clearSearch}
            >
              <X className="h-4 w-4 text-muted" />
            </Button>
          )}
        </div>

        {/* 标签筛选按钮 */}
        <Popover open={showTagSelector} onOpenChange={setShowTagSelector}>
          <PopoverTrigger asChild>
            <Button
              variant={selectedTagsCount > 0 ? "default" : "outline"}
              size="icon"
              className="h-12 w-12 rounded-xl"
            >
              <Tags className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <TagSelector
              tags={tags}
              tagGroups={tagGroups}
              selectedTagIds={currentFilters?.tags || []}
              onTagsChange={handleTagsChange}
              className="w-80"
            />
          </PopoverContent>
        </Popover>

        {/* 标签管理按钮 */}
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl"
          onClick={() => setShowTagManagement(true)}
        >
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* 活动筛选器显示 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {selectedTagsCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Tags className="h-3 w-3" />
              {selectedTagsCount} 个标签
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={clearTags}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="text-xs"
            >
              清空所有筛选
            </Button>
          )}
        </div>
      )}

      {/* 标签管理面板 */}
      <TagManagementPanel
        open={showTagManagement}
        onOpenChange={setShowTagManagement}
      />
    </div>
  );
}
