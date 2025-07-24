import { useCallback } from 'react';
import { ImageData } from '@/types';

interface UseDataSyncProps {
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
  setConnectionStatus: React.Dispatch<
    React.SetStateAction<'connected' | 'disconnected' | 'reconnecting'>
  >;
}

/**
 * 数据同步 Hook
 * 负责处理后台数据同步和手动刷新
 */
export function useDataSync({
  setImages,
  setConnectionStatus,
}: UseDataSyncProps) {
  // 手动刷新数据
  const refreshData = useCallback(async () => {
    console.log('🔄 手动刷新数据...');
    setConnectionStatus('reconnecting');
    try {
      // 添加时间戳避免缓存
      const response = await fetch('/api/images?t=' + Date.now());
      if (!response.ok) {
        throw new Error('获取图片失败');
      }
      const result = await response.json();
      const images = result.data || result.images || [];
      setImages(images);
      console.log('📸 手动刷新图片成功，获取到', images.length, '张图片');
      setConnectionStatus('connected');
    } catch (error) {
      console.error('手动刷新数据失败:', error);
      setConnectionStatus('disconnected');
    }
  }, [setImages, setConnectionStatus]);

  return {
    refreshData,
  };
}
