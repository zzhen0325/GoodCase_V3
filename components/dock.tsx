"use client"

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit3, Check, Search, Tag as TagIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, SearchFilters } from '@/types';
import { debounce } from '@/lib/utils';

// 统一的动画配置
const ANIMATION_CONFIG = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94] as const,
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: { duration: 0.2, ease: 'easeOut' }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

// Dock导航项接口
interface DockItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

// Dock组件属性
interface DockProps {
  onEdit?: () => void;
  isEditMode?: boolean;
  onSearch?: (filters: SearchFilters) => void;
  selectedTags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  availableTags?: Tag[];
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  selectedCount?: number;
}

// Dock导航组件
export function Dock({ 
  onEdit, 
  isEditMode,
  onSearch,
  selectedTags = [],
  onTagsChange,
  availableTags = [],
  searchQuery = '',
  onSearchQueryChange,
  selectedCount = 0
}: DockProps) {
  // 状态管理
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isTagsActive, setIsTagsActive] = useState(false);
  const [query, setQuery] = useState(searchQuery);
  const [isAnimating, setIsAnimating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();
  // 监听页面滚动和外部点击，自动收起扩展区域
  useEffect(() => {
    const handleScroll = () => {
      if (isSearchActive || isTagsActive) {
        setIsSearchActive(false);
        setIsTagsActive(false);
      }
    };
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        setIsSearchActive(false);
        setIsTagsActive(false);
      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchActive(false);
        setIsTagsActive(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchActive, isTagsActive]);
  
  // 搜索模式激活时自动聚焦
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, ANIMATION_CONFIG.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [isSearchActive]);
  
  // 防抖搜索函数
  const debouncedSearch = React.useMemo(
    () => debounce((searchQuery: string) => {
      if (onSearch) {
        onSearch({
        query: searchQuery,
        tags: selectedTags.map(tag => tag.id)
      });
      }
      if (onSearchQueryChange) {
        onSearchQueryChange(searchQuery);
      }
    }, 300),
    [onSearch, selectedTags, onSearchQueryChange]
  );
  
  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };
  
  // 清空搜索
  const clearSearch = () => {
    setQuery('');
    if (onSearch) {
      onSearch({
        query: '',
        tags: selectedTags.map(tag => tag.id)
      });
    }
    if (onSearchQueryChange) {
      onSearchQueryChange('');
    }
  };
  
  // 处理标签选择
  const handleTagToggle = (tag: Tag) => {
    if (!onTagsChange) return;
    
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
    
    if (onSearch) {
      onSearch({
        query,
        tags: isSelected 
          ? selectedTags.filter(t => t.id !== tag.id).map(t => t.id)
          : [...selectedTags, tag].map(t => t.id)
      });
    }
  };
  
  // 清空所有标签选择
  const clearAllTags = () => {
    if (onTagsChange) {
      onTagsChange([]);
      
      if (onSearch) {
        onSearch({
          query,
          tags: []
        });
      }
    }
  };
  


  // 清理动画定时器
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // 切换搜索模式
  const toggleSearch = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const nextIsActive = !isSearchActive;
    
    setIsSearchActive(nextIsActive);
    if (nextIsActive) {
      setIsTagsActive(false);
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, ANIMATION_CONFIG.duration * 1000);
  };
  
  // 切换标签模式
  const toggleTags = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const nextIsActive = !isTagsActive;
    
    setIsTagsActive(nextIsActive);
    if (nextIsActive) {
      setIsSearchActive(false);
    }
    
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, ANIMATION_CONFIG.duration * 1000);
  };
  
  const mainDockItems: DockItem[] = [
    {
      id: 'search',
      icon: <Search className="w-5 h-5" />,
      label: '搜索',
      onClick: toggleSearch,
      isActive: isSearchActive,
    },
    {
      id: 'tags',
      icon: <TagIcon className="w-5 h-5" />,
      label: '标签筛选',
      onClick: toggleTags,
      isActive: isTagsActive,
    },
  ];

  const secondaryDockItems: DockItem[] = [
    {
      id: 'edit',
      icon: isEditMode ? <Check className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />,
      label: isEditMode ? '完成编辑' : '编辑图片',
      onClick: onEdit || (() => {}),
      isActive: isEditMode,
    },
  ];

  const dockItems = isTagsActive ? [mainDockItems.find(item => item.id === 'tags')!] : (isSearchActive ? [mainDockItems.find(item => item.id === 'search')!] : [...mainDockItems, ...secondaryDockItems]);



  return (
    <>
      {/* 选中标签固定显示 */}
      <div className="fixed bottom-32 left-0 right-0 flex justify-center z-40 px-4">
        <AnimatePresence>
          {selectedTags.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-auto max-w-5xl bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl p-4 shadow-2xl shadow-blue-500/10"
            >
              <div className="flex flex-wrap gap-3 justify-center">
                {selectedTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant="default"
                    size="sm"
                    onClick={() => handleTagToggle(tag)}
                    className="h-8 px-4 text-sm rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 hover:scale-105 transition-all duration-300"
                  >
                    {tag.name}
                    <X className="ml-2 h-4 w-4" />
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="fixed bottom-6 right-6 z-50" ref={dockRef}>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ 
            scale: isSearchActive || isTagsActive ? 1 : 1.05,
            transition: ANIMATION_CONFIG.hover.transition
          }}
          transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
          className="relative"
        >
        <motion.div 
          layout
          transition={{ 
            layout: { 
              duration: ANIMATION_CONFIG.duration, 
              ease: ANIMATION_CONFIG.ease
            }
          }}
          style={{ 
            width: isTagsActive ? '80vw' : (isSearchActive ? '60vw' : 'auto'),
            maxWidth: isTagsActive ? '1200px' : (isSearchActive ? '600px' : 'none')
          }}
          className={`bg-white/98 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-2xl hover:shadow-3xl shadow-blue-500/5 transition-all duration-500 flex items-center justify-center ${
            isTagsActive ? 'p-5' : 'p-4'
          }`}>
          <div className={`flex items-center ${isTagsActive ? 'justify-center gap-2' : (isSearchActive ? 'justify-center gap-2' : 'justify-between px-4')}`}>

            
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                staggerChildren: 0.05,
                delayChildren: 0.1
              }}
              className={`flex items-center ${isTagsActive || isSearchActive ? 'justify-center gap-2' : 'justify-between w-full'}`}
            >
            <AnimatePresence>
            {dockItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  y: 10
                }}
                whileHover={ANIMATION_CONFIG.hover}
                whileTap={ANIMATION_CONFIG.tap}
                transition={ANIMATION_CONFIG.spring}
                className="relative group"
              >
              <Button
                variant={item.isActive ? "default" : "ghost"}
                size="sm"
                onClick={item.onClick}
                disabled={isAnimating && (item.id === 'search' || item.id === 'tags')}
                className={`
                  relative h-12 w-12 rounded-xl transition-all duration-200
                  group text-gray-600 hover:text-gray-900
                  ${item.isActive ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-gray-100'}
                  ${isAnimating && (item.id === 'search' || item.id === 'tags') ? 'opacity-70 cursor-not-allowed' : ''}
                `}
              >
                {item.icon}
                
                {/* 悬浮文字提示 */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                    {item.label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
                
                {/* 活跃状态指示器 */}
                {item.isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full"
                    transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
                  />
                )}
              </Button>
            </motion.div>
            ))}
            </AnimatePresence>
            </motion.div>          </div>
          <AnimatePresence>
            {isSearchActive && (
              <motion.div 
                initial={{ opacity: 0, width: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  width: '100%', 
                  scale: 1
                }}
                exit={{ 
                  opacity: 0, 
                  width: 0, 
                  scale: 0.9
                }}
                transition={{
                  duration: ANIMATION_CONFIG.duration,
                  ease: ANIMATION_CONFIG.ease
                }}
                className="flex-grow pl-2">
               <div className="relative w-full">
                 <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="搜索图片..."
                    value={query}
                    onChange={handleSearchChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-4 pr-10 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                 {query && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0 }}
                     transition={ANIMATION_CONFIG.spring}
                   >
                     <Button
                       variant="ghost"
                       size="icon"
                       className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                       onClick={clearSearch}
                     >
                       <X className="h-4 w-4" />
                     </Button>
                   </motion.div>
                 )}
               </div>
             </motion.div>
           )}
          </AnimatePresence>
          <AnimatePresence>
            {isTagsActive && (
              <motion.div 
                initial={{ opacity: 0, width: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  width: '100%', 
                  scale: 1
                }}
                exit={{ 
                  opacity: 0, 
                  width: 0, 
                  scale: 0.9
                }}
                transition={{
                  duration: ANIMATION_CONFIG.duration,
                  ease: ANIMATION_CONFIG.ease
                }}
                className="flex-grow pl-2"
              >
                <div className="flex flex-wrap gap-2 h-auto ml-2 overflow-y-auto max-h-32">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.some(t => t.id === tag.id);
                    return (
                      <motion.div
                        key={tag.id}
                        whileHover={ANIMATION_CONFIG.hover}
                        whileTap={ANIMATION_CONFIG.tap}
                      >
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTagToggle(tag)}
                          className={`h-8 px-3 text-sm rounded-full transition-all duration-200 flex-shrink-0 ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm' 
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {tag.name}
                          {isSelected && <X className="ml-1 h-3 w-3" />}
                        </Button>
                      </motion.div>
                    );
                  })}
                  {availableTags.length === 0 && (
                    <span className="text-xs text-gray-500 self-center">暂无可用标签...</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
    </>
  );
}

// Dock项组件（可选的独立组件）
interface DockItemComponentProps {
  item: DockItem;
  index: number;
}

export function DockItemComponent({ item, index }: DockItemComponentProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        ...ANIMATION_CONFIG.spring,
        delay: index * 0.05
      }}
      whileHover={ANIMATION_CONFIG.hover}
      whileTap={ANIMATION_CONFIG.tap}
    >
      <Button
        variant={item.isActive ? "default" : "ghost"}
        size="sm"
        onClick={item.onClick}
        className={`
          relative h-12 w-12 rounded-xl transition-all duration-200
          group text-gray-100 hover:text-white
          ${item.isActive ? 'bg-white text-black shadow-md' : ''}
        `}
      >
        {item.icon}
        
        {/* 悬浮标签 */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-md whitespace-nowrap border border-gray-600">
            {item.label}
          </div>
        </div>
        
        {/* 活跃状态指示器 */}
        {item.isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"
            transition={{ duration: ANIMATION_CONFIG.duration, ease: ANIMATION_CONFIG.ease }}
          />
        )}
      </Button>
    </motion.div>
  );
}