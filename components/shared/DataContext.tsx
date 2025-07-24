'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Tag, TagCategory } from '@/types';

// 定义数据上下文类型
interface DataContextType {
  // 标签相关
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;

  // 分类相关（原标签分组）
  tagCategories: TagCategory[];
  setCategories: React.Dispatch<React.SetStateAction<TagCategory[]>>;
}

// 创建上下文
const DataContext = createContext<DataContextType | undefined>(undefined);

// 数据提供者组件
interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  // 标签状态
  const [tags, setTags] = useState<Tag[]>([]);
  
  // 分类状态（原标签分组）
  const [tagCategories, setCategories] = useState<TagCategory[]>([]);

  // 提供的上下文值
  const contextValue: DataContextType = {
    tags,
    setTags,
    tagCategories,
    setCategories,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

// 自定义Hook，用于访问数据上下文
export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}