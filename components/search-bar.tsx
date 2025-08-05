'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search, X, Tag as TagIcon, FileText, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchFilters, DEFAULT_SEARCH_FILTERS, Tag, ImageData, getColorTheme } from '@/types';
import { debounce, cn } from '@/lib/utils';
import { useDataContext } from '@/components/shared/DataContext';

// 搜索建议项类型
interface SearchSuggestion {
  id: string;
  type: 'tag' | 'prompt';
  title: string;
  content: string;
  categoryName?: string;
}

// 搜索框组件属性
interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  currentFilters?: SearchFilters;
  images?: ImageData[];
}

export function SearchBar({
  onSearch,
  currentFilters = DEFAULT_SEARCH_FILTERS,
  images = [],
}: SearchBarProps) {
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [query, setQuery] = useState(currentFilters.query || '');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { tags, tagCategories } = useDataContext();

  // 生成搜索建议
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    const results: SearchSuggestion[] = [];
    
    // 搜索标签
    tags.forEach(tag => {
      if (tag.name.toLowerCase().includes(searchTerm)) {
        const category = tagCategories.find(cat => cat.id === tag.categoryId);
        results.push({
          id: tag.id,
          type: 'tag',
          title: tag.name,
          content: tag.name,
          categoryName: category?.name,
        });
      }
    });
    
    // 搜索提示词块内容
    const promptResults = new Map<string, SearchSuggestion>();
    images.forEach(image => {
      image.promptBlocks?.forEach(block => {
        if (block.content.toLowerCase().includes(searchTerm)) {
          const key = block.content.toLowerCase();
          if (!promptResults.has(key)) {
            promptResults.set(key, {
              id: `prompt-${block.id || Math.random()}`,
              type: 'prompt',
              title: block.title || '提示词',
              content: block.content,
            });
          }
        }
      });
    });
    
    results.push(...Array.from(promptResults.values()));
    
    // 限制结果数量
    return results.slice(0, 8);
  }, [query, tags, tagCategories, images]);
  
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
      setShowDropdown(value.trim().length > 0);
      setHighlightIndex(-1);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // 清空搜索
  const clearSearch = useCallback(() => {
    setQuery('');
    setShowDropdown(false);
    onSearch({
      ...currentFilters,
      query: '',
    });
  }, [onSearch, currentFilters]);
  
  // 移除标签
  const removeTag = useCallback((tagToRemove: string) => {
    const currentTags = currentFilters.tags || [];
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    onSearch({
      ...currentFilters,
      tags: newTags,
    });
  }, [onSearch, currentFilters]);
  
  // 选择建议项
  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    setHighlightIndex(-1);
    if (suggestion.type === 'tag') {
      // 选择标签时，添加到过滤器的tags数组中
      const currentTags = currentFilters.tags || [];
      const newTags = currentTags.includes(suggestion.title) 
        ? currentTags 
        : [...currentTags, suggestion.title];
      
      onSearch({
        ...currentFilters,
        tags: newTags,
        query: '',
      });
      setQuery('');
    } else {
      // 选择提示词时，设置为搜索查询
      setQuery(suggestion.content);
      onSearch({
        ...currentFilters,
        query: suggestion.content,
      });
    }
    setShowDropdown(false);
  }, [onSearch, currentFilters]);
  
  // 处理键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(idx => (idx + 1 >= suggestions.length ? 0 : idx + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(idx => (idx <= 0 ? suggestions.length - 1 : idx - 1));
    } else if ((e.key === 'Enter' || e.key === ' ') && highlightIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIndex]);
    }
  }, [showDropdown, suggestions, highlightIndex, selectSuggestion]);

  // 处理输入框变化
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleSearchChange(e.target.value);
    },
    [handleSearchChange]
  );
  
  // 处理焦点事件
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (query.trim()) {
      setShowDropdown(true);
    }
  }, [query]);
  
  const handleBlur = useCallback((e: React.FocusEvent) => {
    // 延迟隐藏下拉框，允许点击建议项
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setIsFocused(false);
        setShowDropdown(false);
      }
    }, 150);
  }, []);
  
  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black transition-colors duration-200 z-10" />
          <div className="relative w-full min-h-12 rounded-2xl bg-muted/30 border border-border focus-within:ring-2 ring-accent  ring-offset-2  focus-within:bg-white transition-all duration-300">
            <div className="flex flex-wrap items-center gap-2 p-2 pl-11 pr-10">
              {/* 选中的标签显示区域 */}
              {currentFilters.tags && currentFilters.tags.length > 0 && (
                currentFilters.tags.map((tagName) => {
                  const tag = tags.find(t => t.name === tagName);
                  const category = tag ? tagCategories.find(cat => cat.id === tag.categoryId) : null;
                  const colorTheme = category ? getColorTheme(category.color) : getColorTheme('pink');
                  
                  return (
                    <Badge
                      key={tagName}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl transition-all duration-200',
                        'hover:shadow-sm text-xs px-2 py-1 flex-shrink-0'
                      )}
                      style={{
                        backgroundColor: colorTheme.bg,
                        borderColor: colorTheme.primary,
                        color: colorTheme.text,
                        border: `1px solid ${colorTheme.primary}`
                      }}
                    >
                      <Hash className="w-3 h-3" />
                      <span className="font-medium">{tagName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-3 w-3 p-0 ml-1 hover:bg-white/20 rounded-full"
                        onClick={() => removeTag(tagName)}
                        title="移除标签"
                      >
                        <X className="w-2.5 h-2.5" />
                      </Button>
                    </Badge>
                  );
                })
              )}
              <Input
                ref={inputRef}
                type="text"
                placeholder={currentFilters.tags && currentFilters.tags.length > 0 ? "继续搜索..." : "搜索图片、标签或提示词..."}
                value={query}
                onChange={handleInputChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-32 border-0 bg-transparent p-0 text-black placeholder:text-black/30 focus:ring-0 focus-visible:ring-0"
              />
            </div>
          </div>
          {isFocused && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-accent/50"
              onClick={clearSearch}
            >
              <X className="h-4 w-4 text-black" />
            </Button>
          )}
          
          {/* 搜索建议下拉框 */}
          {showDropdown && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${highlightIndex === index ? 'bg-accent/40' : 'hover:bg-accent/30'}`}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  <div className="flex-shrink-0">
                    {suggestion.type === 'tag' ? (
                      <TagIcon className="h-4 w-4 text-black" />
                    ) : (
                      <FileText className="h-4 w-4 text-black" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground truncate">
                        {suggestion.title}
                      </span>
                      {suggestion.type === 'tag' && suggestion.categoryName && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {suggestion.categoryName}
                        </span>
                      )}
                    </div>
                    {suggestion.content !== suggestion.title && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {suggestion.content}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {suggestion.type === 'tag' ? '标签' : '提示词'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
