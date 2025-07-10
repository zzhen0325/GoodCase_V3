"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImageData, Tag, SearchFilters, Prompt } from '@/types';
import { ApiClient } from '@/lib/api';
import IndexedDBManager from '@/lib/indexed-db';
import { filterImages, copyToClipboard } from '@/lib/utils';
import { ListenerManager } from '@/lib/listeners';
import { SearchBar } from '@/components/search-bar';
import { ImageGrid } from '@/components/image-grid';
import { ImageModal } from '@/components/image-modal';
import { UploadModal } from '@/components/upload-modal';
import { Dock } from '@/components/dock';
import { ConnectionStatus } from '@/components/connection-status';
import TextPressure from '@/components/text-pressure';
import CircularText from '@/components/circular-text';

// 主页面组件
export default function HomePage() {
  // 状态管理
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeView, setActiveView] = useState('grid');
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
  }, []);

  // 手动刷新数据（备用方法）
  const refreshData = async () => {
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
      
      if (tagsResult.success && tagsResult.data) {
        setTags(tagsResult.data);
        console.log('🏷️ 手动刷新标签成功');
      }
      
      setConnectionStatus('connected');
    } catch (error) {
      console.error('手动刷新数据失败:', error);
      setConnectionStatus('disconnected');
    }
  };

  // 获取监听器状态
  const getConnectionInfo = () => {
    const status = ListenerManager.getListenerStatus();
    console.log('📊 监听器状态:', status);
    return status;
  };

  // 搜索和筛选图片
  useEffect(() => {
    const filtered = filterImages(images, searchFilters);
    setFilteredImages(filtered);
  }, [images, searchFilters]);

  // 处理搜索变化
  const handleSearchChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
  }, []);

  // 处理图片点击
  const handleImageClick = useCallback((image: ImageData) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
  }, []);

  // 处理图片更新
  const handleImageUpdate = useCallback(async (id: string, updates: Partial<ImageData>) => {
    console.log('🔄 更新图片:', id, updates);
    const result = await ApiClient.updateImage(id, updates);
    
    if (result.success) {
      console.log('✅ 图片更新成功，实时监听器将自动更新UI');
      // 实时监听器会自动更新images状态，无需手动更新
      
      // 更新选中的图片（如果正在查看）
      if (selectedImage?.id === id && result.data) {
        setSelectedImage(result.data);
      }
    } else {
      console.error('❌ 图片更新失败:', result.error);
      throw new Error(result.error || '更新失败');
    }
  }, [selectedImage]);

  // 处理图片上传
  const handleImageUpload = useCallback(async (file: File, imageName: string, prompts: Prompt[], tags: Tag[]) => {
    console.log('📤 处理图片上传:', imageName);
    try {
      // 如果在线，直接上传到服务器
      if (connectionStatus === 'connected') {
        // 将新的数据结构转换为API期望的格式
        const tagsString = tags.map(tag => tag.name).join(',');
        const result = await ApiClient.addImage(file, imageName, tagsString);
        if (result.success && result.data) {
          // 上传成功后，更新图片的提示词块
          if (prompts.length > 0) {
            const updateResult = await ApiClient.updateImage(result.data.id, {
              prompts: prompts
            });
            if (!updateResult.success) {
              console.warn('⚠️ 提示词块更新失败:', updateResult.error);
            }
          }
          console.log('✅ 图片上传成功:', result.data);
        } else {
          throw new Error(result.error || '上传失败');
        }
      } else {
        // 如果离线，存储到IndexedDB
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const base64 = reader.result as string;
          const tempId = `temp_${Date.now()}`;

          const localImageData: ImageData = {
            id: tempId,
            url: base64,
            title: imageName,
            tags: tags,
            prompts: prompts,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isLocal: true,
          };

          // 立即更新UI
          setImages(prevImages => [localImageData, ...prevImages]);

          // 存入IndexedDB以备后台同步
          const dbImageData = {
            id: tempId,
            image_name: file.name,
            image_data: base64,
            tags: tags.map(tag => tag.name),
            upload_time: new Date(),
            description: imageName,
            is_valid: false,
            prompt_blocks: prompts,
          };

          try {
            await IndexedDBManager.addImage(dbImageData);
            console.log('✅ 图片已暂存到 IndexedDB');
          } catch (error) {
            console.error('❌ 暂存图片到 IndexedDB 失败:', error);
            setImages(prev => prev.filter(img => img.id !== tempId));
          }
        };
      }
    } catch (error) {
      console.error('❌ 上传失败:', error);
      throw error;
    }
  }, [connectionStatus]);

  // 处理标签创建
  const handleTagCreate = useCallback(async (tagData: Omit<Tag, 'id'>) => {
    console.log('🏷️ 创建标签:', tagData.name);
    const result = await ApiClient.addTag(tagData);
    
    if (result.success && result.data) {
      console.log('✅ 标签创建成功，实时监听器将自动更新UI');
      // 实时监听器会自动更新tags状态，无需手动更新
      return result.data;
    } else {
      console.error('❌ 标签创建失败:', result.error);
      throw new Error(result.error || '创建失败');
    }
  }, []);

  // 处理提示词复制
  const handleCopyPrompt = useCallback(async (content: string) => {
    try {
      await copyToClipboard(content);
      // 这里可以添加成功提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  }, []);

  // 处理图片删除
  const handleImageDelete = useCallback(async (id: string) => {
    console.log('🗑️ 删除图片:', id);
    const result = await ApiClient.deleteImage(id);
    
    if (result.success) {
      console.log('✅ 图片删除成功，实时监听器将自动更新UI');
      // 实时监听器会自动更新images状态，无需手动更新
      // 关闭弹窗
      setIsImageModalOpen(false);
      setSelectedImage(null);
    } else {
      console.error('❌ 图片删除失败:', result.error);
      throw new Error(result.error || '删除失败');
    }
  }, []);

  // 处理图片复制
  const handleImageDuplicate = useCallback(async (image: ImageData) => {
    try {
      // 复制功能暂时禁用，因为需要重新上传文件
      console.log('复制功能开发中...');
      alert('复制功能开发中，请手动重新上传图片');
    } catch (error) {
      console.error('复制图片失败:', error);
      throw error;
    }
  }, []);

  // Dock 导航处理函数
  const handleUpload = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // 验证数据格式
        if (!data.images || !data.tags || !Array.isArray(data.images) || !Array.isArray(data.tags)) {
          throw new Error('数据格式不正确');
        }
        
        // 这里可以实现批量导入逻辑
        await refreshData();
        
        alert(`导入功能开发中`);
      } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败: ' + (error as Error).message);
      }
    };
    input.click();
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const data = {
        images,
        tags,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `gooodcase-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      alert(`成功导出 ${data.images.length} 张图片和 ${data.tags.length} 个标签`);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败: ' + (error as Error).message);
    }
  }, [images, tags]);

  const handleFavorites = useCallback(() => {
    setActiveView('favorites');
    // 筛选收藏的图片
    setSearchFilters(prev => ({
      ...prev,
      query: '',
      tags: [],
      isFavorite: true
    }));
  }, []);

  const handleSettings = useCallback(() => {
    setActiveView('settings');
    // 这里可以打开设置弹窗
  }, []);

  const handleLarkDoc = useCallback(() => {
    window.open('https://bytedance.larkoffice.com/wiki/HNHvwAjVzicLVuk1r5ictnNKncg', '_blank');
  }, []);

  // 关闭图片详情弹窗
  const closeImageModal = useCallback(() => {
    setIsImageModalOpen(false);
    setSelectedImage(null);
  }, []);

  // 关闭上传弹窗
  const closeUploadModal = useCallback(() => {
    setIsUploadModalOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CircularText
            text="LOADING • LOADING • "
            spinDuration={3}
            onHover={null}
            className="text-primary mb-4"
          />
          <p className="text-muted-foreground"></p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 连接状态指示器 */}
      <ConnectionStatus
        status={connectionStatus}
        onRefresh={refreshData}
        listenerInfo={getConnectionInfo()}
      />
      
      <div className="flex justify-center w-full ">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-3/5"
        >
          <div className="text-center ">
            <div className="h-auto mb-5 ">
              <TextPressure
                text="GoooodCase!"
                fontFamily="Inter"
                textColor="#000"
                className="text-4xl font-bold"
                minFontSize={32} />
            </div>
            <p className="text-sm text-muted-foreground ">
              Manage your images and prompt words to make creation more efficient.
            </p>
          </div>
        </motion.div>
      </div>
      
      <div className="min-h-screen bg-background">
        {/* 主要内容区域 */}
        <div className="container mx-auto px-4 mb-4 pb-24">
          {/* 搜索栏 */}
          <SearchBar
            onSearch={setSearchFilters}
            selectedTags={searchFilters.tags}
            onTagsChange={(tags) => setSearchFilters(prev => ({ ...prev, tags }))} />
          
          {/* 图片网格 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ImageGrid
              images={filteredImages}
              loading={isLoading}
              onImageClick={handleImageClick} />
          </motion.div>

          {/* 统计信息 */}
          {filteredImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 text-center text-sm text-muted-foreground"
            >
              共找到 {filteredImages.length} 张图片
              {searchFilters.query && (
                <span> · 搜索: "{searchFilters.query}"</span>
              )}
              {searchFilters.tags.length > 0 && (
                <span> · 标签: {searchFilters.tags.map(tag => typeof tag === 'string' ? tag : tag.name).join(', ')}</span>
              )}
            </motion.div>
          )}
        </div>

        {/* 底部 Dock 导航 */}
        <Dock
          onUpload={handleUpload}
          onImport={handleImport}
          onExport={handleExport}
          onSettings={handleSettings}
          onFavorites={handleFavorites}
          onLarkDoc={handleLarkDoc}
          activeView={activeView} />

        {/* 图片详情弹窗 */}
        <ImageModal
          image={selectedImage}
          isOpen={isImageModalOpen}
          onClose={closeImageModal}
          onUpdate={handleImageUpdate}
          onDelete={handleImageDelete}
          onDuplicate={handleImageDuplicate}
          availableTags={tags}
          onCreateTag={handleTagCreate}
          onCopyPrompt={handleCopyPrompt} />

        {/* 上传图片弹窗 */}
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={closeUploadModal}
          onUpload={handleImageUpload}
          availableTags={tags}
          onCreateTag={handleTagCreate} />
      </div>
    </>
  );
}