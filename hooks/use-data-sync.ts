import { useEffect, useCallback } from 'react';
import { ImageData } from '@/types';
import { ApiClient } from '@/lib/api';
import IndexedDBManager from '@/lib/indexed-db';

interface UseDataSyncProps {
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
  setConnectionStatus: React.Dispatch<React.SetStateAction<'connected' | 'disconnected' | 'reconnecting'>>;
}

/**
 * 数据同步 Hook
 * 负责处理后台数据同步和手动刷新
 */
export function useDataSync({ setImages, setConnectionStatus }: UseDataSyncProps) {

  // 后台同步 IndexedDB 到 Firestore
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      console.log('🔄 检查 IndexedDB 中的待上传图片...');
      const imagesToUpload = await IndexedDBManager.getImages();
      const pendingImages = imagesToUpload.filter(img => !img.is_valid);

      if (pendingImages.length > 0) {
        console.log(`📤 发现 ${pendingImages.length} 张待上传图片，开始同步...`);
        for (const image of pendingImages) {
          try {
            // 将 base64 转换回 File 对象
            const res = await fetch(image.image_data);
            const blob = await res.blob();
            const file = new File([blob], image.image_name, { type: blob.type });

            const result = await ApiClient.addImage(file, image.description, image.tags.join(','));
            if (result.success && result.data) {
              console.log(`✅ 图片 ${image.image_name} 同步成功`);
              // 用服务器返回的数据替换本地临时数据
              setImages(prevImages => 
                prevImages.map(prevImage => 
                  prevImage.id === image.id ? { ...result.data!, isLocal: false } : prevImage
                )
              );
              // 从 IndexedDB 中删除
              await IndexedDBManager.deleteImage(image.id);
            } else {
              console.error(`❌ 图片 ${image.image_name} 同步失败:`, result.error);
            }
          } catch (error) {
            console.error(`❌ 同步图片 ${image.image_name} 时出错:`, error);
          }
        }
      } else {
        console.log('✅ 无待上传图片');
      }
    }, 30000); // 每30秒检查一次

    return () => clearInterval(syncInterval);
  }, [setImages]);

  // 手动刷新数据（备用方法）
  const refreshData = useCallback(async () => {
    console.log('🔄 手动刷新数据...');
    setConnectionStatus('reconnecting');
    try {
      const [imagesResult, tagsResult] = await Promise.all([
        ApiClient.getAllImages(),
        ApiClient.getAllTags()
      ]);
      
      if (imagesResult.success && imagesResult.data) {
        setImages(imagesResult.data);
        console.log('📸 手动刷新图片成功');
      }
      
      // 注意：这里没有处理 tags，因为这个 hook 只负责 images
      // tags 的刷新应该在调用方处理
      
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