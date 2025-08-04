'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Tag, TagCategory } from '@/types';

// 定义数据上下文类型
interface DataContextType {
  // 标签相关
  tags: Tag[];
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;

  // 分类相关（原标签分组）
  tagCategories: TagCategory[];
  setCategories: React.Dispatch<React.SetStateAction<TagCategory[]>>;

  // 加载状态
  loading: boolean;
  error: string | null;

  // 刷新方法
  refreshData: () => Promise<void>;
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

  // 加载状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取标签数据
  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('获取标签失败');
      const result = await response.json();
      if (result.success) {
        setTags(result.data || []);
      } else {
        throw new Error(result.error?.message || '获取标签失败');
      }
    } catch (e) {
      console.error('获取标签失败:', e);
      throw e;
    }
  }, []);

  // 获取标签分类数据
  const fetchTagCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/tag-categories');
      if (!response.ok) throw new Error('获取分类失败');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      } else {
        throw new Error(result.error?.message || '获取分类失败');
      }
    } catch (e) {
      console.error('获取分类失败:', e);
      throw e;
    }
  }, []);

  // 刷新所有数据
  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchTags(),
        fetchTagCategories()
      ]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '数据加载失败';
      setError(errorMessage);
      console.error('数据加载失败:', e);
    } finally {
      setLoading(false);
    }
  }, [fetchTags, fetchTagCategories]);

  // 初始化数据加载
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 提供的上下文值
  const contextValue: DataContextType = {
    tags,
    setTags,
    tagCategories,
    setCategories,
    loading,
    error,
    refreshData,
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