import { useState, useEffect, useCallback } from 'react';
import { ImageData, Tag, SearchFilters } from '@/types';
import { filterImages } from '@/lib/utils';
import { ListenerManager } from '@/lib/listeners';

/**
 * 图片状态管理 Hook
 * 负责管理图片数据、标签数据、搜索过滤器等核心状态
 */
export function useImageState() {
  // 核心数据状态
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 搜索和过滤状态
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // 连接状态
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');

  // 初始化实时监听
  useEffect(() => {
    console.log('🚀 初始化实时数据监听...');
    
    // 监听图片数据变化
    const unsubscribeImages = ListenerManager.subscribeToImages((newImages) => {
      console.log('📸 图片数据更新:', newImages.length, '张图片');
      setImages(newImages);
      setIsLoading(false);
      setConnectionStatus('connected');
    });

    // 监听标签数据变化
    const unsubscribeTags = ListenerManager.subscribeToTags((newTags) => {
      console.log('🏷️ 标签数据更新:', newTags.length, '个标签');
      setTags(newTags);
    });

    // 监听网络状态
    const handleOnline = () => {
      console.log('🌐 网络已连接');
      setConnectionStatus('connected');
    };

    const handleOffline = () => {
      console.log('🔌 网络已断开');
      setConnectionStatus('disconnected');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // 清理函数
    return () => {
      console.log('🧹 清理监听器...');
      ListenerManager.unregisterAllListeners();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // 搜索和筛选图片
  useEffect(() => {
    const filtered = filterImages(images, searchFilters);
    setFilteredImages(filtered);
  }, [images, searchFilters]);

  // 处理搜索变化
  const handleSearchChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
  }, []);

  return {
    // 状态
    images,
    filteredImages,
    tags,
    isLoading,
    searchFilters,
    connectionStatus,
    
    // 状态更新函数
    setImages,
    setTags,
    setConnectionStatus,
    handleSearchChange,
  };
}