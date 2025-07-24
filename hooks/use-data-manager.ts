import { useState, useEffect, useCallback } from 'react';
import { ImageData, Tag, TagCategory, PromptBlock } from '@/types';

interface DataState {
  images: ImageData[];
  tags: Tag[];
  tagCategories: TagCategory[];
  promptBlocks: PromptBlock[];
  loading: {
    images: boolean;
    tags: boolean;
    categories: boolean;
    prompts: boolean;
  };
  error: {
    images: string | null;
    tags: string | null;
    tagCategories: string | null;
    promptBlocks: string | null;
  };
}

interface DataActions {
  // 刷新数据
  refreshImages: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshPrompts: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // 设置数据
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
  setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
  setCategories: React.Dispatch<React.SetStateAction<TagCategory[]>>;
  setPrompts: React.Dispatch<React.SetStateAction<PromptBlock[]>>;

  // 获取单个数据
  getImageById: (id: string) => ImageData | undefined;
  getTagById: (id: string) => Tag | undefined;
  getCategoryById: (id: string) => TagCategory | undefined;
  getPromptById: (id: string) => PromptBlock | undefined;
}

/**
 * 统一数据管理 Hook
 * 负责管理所有应用数据的状态和操作
 */
export function useDataManager(): DataState & DataActions {
  // 状态管理
  const [images, setImages] = useState<ImageData[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagCategories, setCategories] = useState<TagCategory[]>([]);
  const [promptBlocks, setPrompts] = useState<PromptBlock[]>([]);
  
  const [loading, setLoading] = useState({
    images: true,
    tags: true,
    categories: true,
    prompts: true,
  });
  
  const [error, setError] = useState({
    images: null as string | null,
    tags: null as string | null,
    tagCategories: null as string | null,
    promptBlocks: null as string | null,
  });

  // 获取图片数据
  const refreshImages = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, images: true }));
      const response = await fetch('/api/images');
      if (!response.ok) throw new Error('获取图片失败');
      const result = await response.json();
      const images = result.data || result.images || [];
      setImages(images);
      setError(prev => ({ ...prev, images: null }));
    } catch (e) {
      console.error('获取图片失败:', e);
      setError(prev => ({ ...prev, images: '获取图片失败' }));
    } finally {
      setLoading(prev => ({ ...prev, images: false }));
    }
  }, []);

  // 获取标签数据
  const refreshTags = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, tags: true }));
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('获取标签失败');
      const result = await response.json();
      const tags = result.data || result.tags || [];
      setTags(tags);
      setError(prev => ({ ...prev, tags: null }));
    } catch (e) {
      console.error('获取标签失败:', e);
      setError(prev => ({ ...prev, tags: '获取标签失败' }));
    } finally {
      setLoading(prev => ({ ...prev, tags: false }));
    }
  }, []);

  // 获取分类数据
  const refreshCategories = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, tagCategories: true }));
      const response = await fetch('/api/tag-categories');
      if (!response.ok) throw new Error('获取分类失败');
      const result = await response.json();
      const categories = result.data || result.categories || [];
      setCategories(categories);
      setError(prev => ({ ...prev, tagCategories: null }));
    } catch (e) {
      console.error('获取分类失败:', e);
      setError(prev => ({ ...prev, tagCategories: '获取分类失败' }));
    } finally {
      setLoading(prev => ({ ...prev, tagCategories: false }));
    }
  }, []);

  // 获取提示词数据
  const refreshPrompts = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, promptBlocks: true }));
      const response = await fetch('/api/images');
      if (!response.ok) throw new Error('获取提示词失败');
      const result = await response.json();
      const prompts = result.data || result.prompts || [];
      setPrompts(prompts);
      setError(prev => ({ ...prev, promptBlocks: null }));
    } catch (e) {
      console.error('获取提示词失败:', e);
      setError(prev => ({ ...prev, promptBlocks: '获取提示词失败' }));
    } finally {
      setLoading(prev => ({ ...prev, promptBlocks: false }));
    }
  }, []);

  // 刷新所有数据
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshImages(),
      refreshTags(),
      refreshCategories(),
      refreshPrompts(),
    ]);
  }, [refreshImages, refreshTags, refreshCategories, refreshPrompts]);

  // 根据ID获取数据
  const getImageById = useCallback((id: string) => {
    return images.find(image => image.id === id);
  }, [images]);

  const getTagById = useCallback((id: string) => {
    return tags.find(tag => tag.id === id);
  }, [tags]);

  const getCategoryById = useCallback((id: string) => {
    return tagCategories.find(tagCategory => tagCategory.id === id);
  }, [tagCategories]);

  const getPromptById = useCallback((id: string) => {
    return promptBlocks.find(promptBlock => promptBlock.id === id);
  }, [promptBlocks]);

  // 初始化数据
  useEffect(() => {
    refreshAll();
  }, []);

  return {
    // 状态
    images,
    tags,
    tagCategories,
    promptBlocks,
    loading,
    error,
    
    // 操作
    refreshImages,
    refreshTags,
    refreshCategories,
    refreshPrompts,
    refreshAll,
    setImages,
    setTags,
    setCategories,
    setPrompts,
    getImageById,
    getTagById,
    getCategoryById,
    getPromptById,
  };
}