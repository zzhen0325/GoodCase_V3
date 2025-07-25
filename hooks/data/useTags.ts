import { useState, useEffect } from 'react';
import { useDataContext } from '../../components/shared/DataContext';
import { Tag, TagCategory } from '@/types';
import { useApi } from '../core/useApi';
import { useAsyncState } from '../core/useAsyncState';

export function useTags() {
  const { tags, setTags, tagCategories, setCategories } = useDataContext();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 使用新的核心hooks来管理API调用
  const tagsApi = useApi<Tag[]>('/api/tags');
  const categoriesApi = useApi<TagCategory[]>('/api/tag-categories');
  
  // 初始化数据获取
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [tagsResult, categoriesResult] = await Promise.all([
          tagsApi.execute(),
          categoriesApi.execute()
        ]);
        
        if (tagsResult?.success) {
          setTags(tagsResult.data || []);
        }
        
        if (categoriesResult?.success) {
          setCategories(categoriesResult.data || []);
        }
      } catch (error) {
        console.error('初始化数据获取失败:', error);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // 标签CRUD操作
  const createTag = async (data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建标签失败');
      }
      
      const result = await response.json();
      const tag = result.data || result.tag;
      setTags((prev: Tag[]) => [...prev, tag]);
      return { success: true, tag };
    } catch (error) {
      console.error('创建标签失败:', error);
      return { success: false, error: '创建标签失败' };
    }
  };
  
  const updateTag = async (id: string, data: Partial<Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新标签失败');
      }
      
      setTags((prev: Tag[]) => prev.map((tag: Tag) => 
        tag.id === id ? { ...tag, ...data } : tag
      ));
      return { success: true };
    } catch (error) {
      console.error('更新标签失败:', error);
      return { success: false, error: '更新标签失败' };
    }
  };
  
  const deleteTag = async (id: string) => {
    try {
      if (!id) {
        return { success: false, error: '无效的标签ID' };
      }
      
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除标签失败');
      }
      
      setTags((prev: Tag[]) => prev.filter((tag: Tag) => tag.id !== id));
      return { success: true };
    } catch (error) {
      console.error('删除标签失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '删除标签失败' };
    }
  };
  
  // 标签分类CRUD操作
  const createTagCategory = async (data: { name: string; color?: string }) => {
    try {
      const requestData = {
        name: data.name,
        color: data.color || 'cyan',
        description: ''
      };
      
      const response = await fetch('/api/tag-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error('创建标签分组失败');
      }
      
      const result = await response.json();
      await categoriesApi.execute(); // 刷新分类数据
      return { success: true, tagCategory: { id: result.id, name: result.name } };
    } catch (error) {
      console.error('创建标签分组失败:', error);
      return { success: false, error: '创建标签分组失败' };
    }
  };
  
  const updateTagCategory = async (id: string, data: { name: string }) => {
    try {
      const response = await fetch(`/api/tag-categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('更新标签分组失败');
      }
      
      await categoriesApi.execute(); // 刷新分类数据
      return { success: true };
    } catch (error) {
      console.error('更新标签分组失败', error);
      return { success: false, error: '更新标签分组失败' };
    }
  };
  
  const deleteTagCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/tag-categories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || '删除标签分组失败';
        throw new Error(errorMessage);
      }
      
      await categoriesApi.execute(); // 刷新分类数据
      return { success: true };
    } catch (error) {
      console.error('删除标签分组失败:', error);
      const errorMessage = error instanceof Error ? error.message : '删除标签分组失败';
      return { success: false, error: errorMessage };
    }
  };
  
  return {
    // 数据
    tags,
    tagCategories,
    selectedTags,
    
    // 加载状态
    loading: tagsApi.loading || categoriesApi.loading,
    tagsLoading: tagsApi.loading,
    categoriesLoading: categoriesApi.loading,
    
    // 错误状态
    error: tagsApi.error || categoriesApi.error,
    tagsError: tagsApi.error,
    categoriesError: categoriesApi.error,
    
    // 标签操作
    createTag,
    updateTag,
    deleteTag,
    
    // 标签分类操作
    createTagCategory,
    updateTagCategory,
    deleteTagCategory,
    
    // 选择操作
    setSelectedTags,
    
    // 工具方法
    getTagsByCategory: (categoryId?: string) => {
      if (!categoryId) {
        return tags.filter((tag: Tag) => !tag.categoryId || tag.categoryId === '');
      }
      return tags.filter((tag: Tag) => tag.categoryId === categoryId);
    },
    
    getTagById: (id: string) => tags.find((tag: Tag) => tag.id === id),
    
    getTagCategoryById: (id: string) => tagCategories.find((category: TagCategory) => category.id === id),
    
    // 刷新数据
    refreshAll: async () => {
      await Promise.all([
        tagsApi.execute(),
        categoriesApi.execute()
      ]);
    },
    refresh: async () => {
      await Promise.all([
        tagsApi.execute(),
        categoriesApi.execute()
      ]);
    }
  };
}