"use client"

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Download, Upload, Settings, Heart, FileText, Edit3, Check, Search, Tag as TagIcon, X, Bot, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, SearchFilters } from '@/types';
import { debounce } from '@/lib/utils';

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
  onUpload?: () => void;
  onImport?: () => void;
  onExport?: () => void;
  onFavorites?: () => void;
  onSettings?: () => void;
  onLarkDoc?: () => void;
  onEdit?: () => void;
  isEditMode?: boolean;
  onSearch?: (filters: SearchFilters) => void;
  selectedTags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  availableTags?: Tag[];
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
}

// Dock导航组件
export function Dock({ 
  onUpload, 
  onImport, 
  onExport, 
  onFavorites, 
  onSettings, 
  onLarkDoc, 
  onEdit, 
  isEditMode,
  onSearch,
  selectedTags = [],
  onTagsChange,
  availableTags = [],
  searchQuery = '',
  onSearchQueryChange
}: DockProps) {
  // 状态管理
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isTagsActive, setIsTagsActive] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [query, setQuery] = useState(searchQuery);
  const [isToggling, setIsToggling] = useState(false); // 防抖状态
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const dockContainerRef = useRef<HTMLDivElement>(null);
  // 监听页面滚动，自动收起扩展区域
  useEffect(() => {
    const handleScroll = () => {
      if (isSearchExpanded || isTagsExpanded) {
        setIsSearchExpanded(false);
        setIsTagsExpanded(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSearchExpanded, isTagsExpanded]);
  
  // 点击外部区域时收起扩展区域
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        const wasActive = isSearchActive || isTagsActive;
        setIsSearchExpanded(false);
        setIsTagsExpanded(false);
        setIsSearchActive(false);
        setIsTagsActive(false);

      }
    };
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isSearchActive || isTagsActive) {
          setIsSearchActive(false);
          setIsTagsActive(false);
          setIsSearchExpanded(false);
          setIsTagsExpanded(false);

        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchActive, isTagsActive]);
  
  // 搜索框展开时自动聚焦
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);
  
  // 防抖搜索函数
  const debouncedSearch = React.useMemo(
    () => debounce((searchQuery: string) => {
      if (onSearch) {
        onSearch({
          query: searchQuery,
          tags: selectedTags
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
        tags: selectedTags
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
          ? selectedTags.filter(t => t.id !== tag.id)
          : [...selectedTags, tag]
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
  


  // 防抖的模式切换函数
  const debouncedToggle = React.useMemo(
    () => debounce((action: () => void) => {
      action();
      // 动画完成后重置防抖状态
      setTimeout(() => setIsToggling(false), 400);
    }, 150),
    []
  );

  // 切换搜索展开状态
  const toggleSearch = () => {
    if (isToggling) return; // 防止快速连续点击
    
    setIsToggling(true);
    
    debouncedToggle(() => {
      const nextIsActive = !isSearchActive;
      setIsSearchActive(nextIsActive);
      if (nextIsActive) {
        // 关闭其他模式，启用搜索模式
        setIsTagsActive(false);
        setIsSearchExpanded(false);
        setIsTagsExpanded(false);
      }
    });
  };
  
  // 切换标签展开状态
  const toggleTags = () => {
    if (isToggling) return; // 防止快速连续点击
    
    setIsToggling(true);
    
    debouncedToggle(() => {
      const nextIsActive = !isTagsActive;
      setIsTagsActive(nextIsActive);
      if (nextIsActive) {
        // 关闭其他模式，启用标签模式
        setIsSearchActive(false);
        setIsSearchExpanded(false);
        setIsTagsExpanded(false);
      }
    });
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
     {
      id: 'upload',
      icon: <Plus className="w-5 h-5" />,
      label: '上传图片',
      onClick: onUpload || (() => {}),
    },
    {
      id: 'robot',
      icon: <Bot className="w-5 h-5" />,
      label: 'lemo-prompt',
      onClick: () => window.open('https://www.coze.cn/store/agent/7517149263135670299?bot_id=true&bid=6grtojeg03g13', '_blank'),
    },
    {
      id: 'tools',
      icon: <Wrench className="w-5 h-5" />,
      label: 'Tagger tool',
      onClick: () => window.open('file:///Users/bytedance/Desktop/seeseezz/good3/Lemo Image Tagger.html', '_blank'),
    },
    {
      id: 'lark-doc',
      icon: <FileText className="w-5 h-5" />,
      label: 'Lemon8 AI WIKI',
      onClick: onLarkDoc || (() => {}),
    },
  ];

  const dockItems = isTagsActive ? [mainDockItems.find(item => item.id === 'tags')!] : (isSearchActive ? [mainDockItems.find(item => item.id === 'search')!] : [...mainDockItems, ...secondaryDockItems]);



  return (
    <>
      {/* 选中标签固定显示 */}
      <div className="fixed bottom-40 left-0 right-0 flex justify-center z-50">
        <AnimatePresence>
          {selectedTags.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="w-auto max-w-3xl bg-gray-100 border rounded-2xl p-4"
            >
              <div className="flex flex-wrap gap-2 justify-center">
                {selectedTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant="default"
                    size="sm"
                    onClick={() => handleTagToggle(tag)}
                    className="h-7 px-3 text-xs rounded-md bg-white text-black shadow-sm hover:bg-gray-300 transition-all duration-200"
                  >
                    {tag.name}
                    <X className="ml-1 h-3 w-3" />
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50" ref={dockRef}>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ 
            y: isSearchExpanded || isTagsExpanded ? 0 : -8,
            transition: { duration: 0.2, ease: "easeOut" }
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative"
        >
{/* 选中标签固定显示在视图中间 */}
    
      
        
        {/* 标签筛选展开区域 */}
        <AnimatePresence>
          {isTagsExpanded && (
            <motion.div 
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full mb-4 w-80 bg-background border rounded-2xl shadow-lg p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <TagIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">标签筛选</span>
              </div>
              
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.some(t => t.id === tag.id);
                  return (
                    <Button
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTagToggle(tag)}
                      className={`h-7 px-2 text-xs rounded-full transition-all duration-200 ${
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
                
                {(isTagsActive && selectedTags.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllTags}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    清空 ({selectedTags.length})
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div 
          ref={dockContainerRef}
          layout
          transition={{ 
            width: { 
              duration: isToggling ? 0.5 : 0.4, 
              ease: [0.25, 0.46, 0.45, 0.94] // 自定义贝塞尔曲线，更流畅
            },
            layout: { 
              duration: isToggling ? 0.5 : 0.4, 
              ease: [0.25, 0.46, 0.45, 0.94]
            },
            padding: {
              duration: 0.3,
              ease: "easeInOut"
            }
          }}
          style={{ width: isTagsActive ? '70vw' : (isSearchActive ? '40vw' : '40vw') }}
          className={`bg-black border border-gray-700 rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-black/50 ${isTagsActive ? 'p-10' : 'p-2'} transition-shadow duration-200 flex items-center justify-center`}>
          <div className={`flex items-center justify-center ${isTagsActive ? 'gap-2' : (isSearchActive ? 'gap-2' : 'gap-4')}`}>

            
            
            <AnimatePresence mode="wait">
            {dockItems.map((item, index) => {
              // 搜索按钮在搜索模式下不执行动画，标签按钮在标签模式下不执行动画
              const isSearchButton = item.id === 'search';
              const isTagsButton = item.id === 'tags';
              const shouldAnimate = !((isSearchButton && isSearchActive) || (isTagsButton && isTagsActive));
              
              return (
              <motion.div
                key={item.id}
                variants={{
                  initial: { opacity: 0, scale: 0.8, y: 20 },
                  animate: { 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: {
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                      delay: isTagsActive ? 0 : (isSearchActive ? 0 : index * 0.1 + 0.3)
                    }
                  },
                  exit: {
                    opacity: shouldAnimate ? 0 : 1,
                    transition: {
                      duration: shouldAnimate ? 0.2 : 0,
                      delay: 0
                    }
                  },
                  hover: { 
                    scale: 1.1, 
                    y: -2,
                    transition: {
                      type: 'spring',
                      stiffness: 400,
                      damping: 20
                    }
                  },
                  tap: { 
                    scale: 0.95,
                    transition: {
                      type: 'spring',
                      stiffness: 600,
                      damping: 30
                    }
                  }
                }}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover="hover"
                whileTap="tap"
                className="relative group"
              >
              <Button
                variant={item.isActive ? "default" : "ghost"}
                size="sm"
                onClick={item.onClick}
                disabled={isToggling && (item.id === 'search' || item.id === 'tags')}
                className={`
                  relative h-12 w-12 rounded-xl transition-all duration-200
                  hover:scale-110 group text-gray-100 hover:text-white
                  ${item.isActive ? 'bg-white text-black shadow-md' : ''}
                  ${isToggling && (item.id === 'search' || item.id === 'tags') ? 'opacity-70 cursor-not-allowed' : ''}
                `}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.1 }}
                >
                  {item.icon}
                </motion.div>
                
                {/* 悬浮文字提示 */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap border border-gray-600">
                    {item.label}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
                
                {/* 活跃状态指示器 */}
                {item.isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )}
              </Button>
            </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {isSearchActive && (
              <motion.div 
                initial={{ opacity: 0, width: 0, scale: 0.8, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  width: '100%', 
                  scale: 1, 
                  x: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    opacity: { duration: 0.3, delay: 0.1 }
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  width: 0, 
                  scale: 0.8,
                  x: -20,
                  transition: {
                    duration: 0.4,
                    ease: [0.55, 0.06, 0.68, 0.19]
                  }
                }}
                className="flex-grow pl-2">
               <div className="relative w-full text-white">
                 <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="搜索..."
                    value={query}
                    onChange={handleSearchChange}
                    className="w-full bg-transparent border-0 pl-2 pr-8 text-white placeholder-gray-400 focus:ring-0 focus:outline-none focus:bg-transparent focus:border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                  />
                 {query && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0 }}
                     transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                   >
                     <Button
                       variant="ghost"
                       size="icon"
                       className="absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                initial={{ opacity: 0, width: 0, scale: 0.8, x: -20 }}
                animate={{ 
                  opacity: 1, 
                  width: '100%', 
                  scale: 1, 
                  x: 0,
                  transition: {
                    duration: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    opacity: { duration: 0.3, delay: 0.1 }
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  width: 0, 
                  scale: 0.8,
                  x: -20,
                  transition: {
                    duration: 0.4,
                    ease: [0.55, 0.06, 0.68, 0.19]
                  }
                }}
                className="flex-grow pl-2"
              >
                <div className="flex flex-wrap gap-2 h-15 ml-4 overflow-y-auto">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.some(t => t.id === tag.id);
                    return (
                      <Button
                        key={tag.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTagToggle(tag)}
                        className={`h-10 px-2 text-sm rounded-2xl transition-all duration-200 flex-shrink-0 ${
                          isSelected 
                            ? 'bg-white text-black hover:bg-gray-200' 
                            : 'bg-transparent text-gray-100 border-gray-500 hover:bg-white hover:text-black'
                        }`}
                      >
                        {tag.name}
                        {isSelected && <X className="ml-1 h-3 w-3" />}
                      </Button>
                    );
                  })}
                  {availableTags.length === 0 && (
                    <span className="text-xs text-gray-400 self-center">暂无可用标签...</span>
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
  // 判断是否为搜索或标签按钮，并且是否处于展开状态
  const isSearchExpanded = item.id === 'search' && item.isActive;
  const isTagsExpanded = item.id === 'tags' && item.isActive;
  const isExpanded = isSearchExpanded || isTagsExpanded;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        duration: 0.2, 
        delay: index * 0.05,
        ease: "easeOut"
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant={item.isActive ? "default" : "ghost"}
        size="sm"
        onClick={item.onClick}
        className={`
          relative h-12 w-12 rounded-xl transition-all duration-200
          group text-gray-100 hover:text-white
          ${item.isActive ? isExpanded ? 'bg-white/80 text-black shadow-md' : 'bg-white text-black shadow-md' : ''}
        `}
      >
        {item.icon}
        
        {/* 悬浮标签 - 只在非展开状态下显示 */}
        {!isExpanded && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded-md shadow-md whitespace-nowrap border border-gray-600">
              {item.label}
            </div>
          </div>
        )}
        
        {/* 活跃状态指示器 - 为搜索和标签按钮使用不同的指示器样式 */}
        {item.isActive && (
          <motion.div
            layoutId="activeIndicator"
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${isExpanded ? 'w-2 h-2' : 'w-1 h-1'} bg-black rounded-full`}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        )}
      </Button>
    </motion.div>
  );
}