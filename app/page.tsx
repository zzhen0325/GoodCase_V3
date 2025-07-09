"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImageData, Tag, SearchFilters } from '@/types';
import { ApiClient } from '@/lib/api';
import { filterImages, copyToClipboard } from '@/lib/utils';
import { SearchBar } from '@/components/search-bar';
import { ImageGrid } from '@/components/image-grid';
import { ImageModal } from '@/components/image-modal';
import { UploadModal } from '@/components/upload-modal';
import { Dock } from '@/components/dock';
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

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      try {
        await loadData();
      } catch (error) {
        console.error('数据初始化失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initData();
  }, []);

  // 加载数据
  const loadData = async () => {
    try {
      const [imagesResult, tagsResult] = await Promise.all([
        ApiClient.getAllImages(),
        ApiClient.getAllTags()
      ]);
      
      if (imagesResult.success && imagesResult.data) {
        setImages(imagesResult.data);
      } else {
        console.error('加载图片失败:', imagesResult.error);
      }
      
      if (tagsResult.success && tagsResult.data) {
        setTags(tagsResult.data);
      } else {
        console.error('加载标签失败:', tagsResult.error);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
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
    const result = await ApiClient.updateImage(id, updates);
    
    if (result.success) {
      // 更新本地状态
      setImages(prev => prev.map(img => 
        img.id === id && result.data ? result.data : img
      ));
      
      // 更新选中的图片
      if (selectedImage?.id === id && result.data) {
        setSelectedImage(result.data);
      }
    } else {
      throw new Error(result.error || '更新失败');
    }
  }, [selectedImage]);

  // 处理图片上传
  const handleImageUpload = useCallback(async (imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await ApiClient.addImage(imageData);
    
    if (result.success && result.data) {
      setImages(prev => [result.data!, ...prev]);
    } else {
      throw new Error(result.error || '上传失败');
    }
  }, []);

  // 处理标签创建
  const handleTagCreate = useCallback(async (tagData: Omit<Tag, 'id'>) => {
    try {
      // 创建一个新标签对象
      const newTag: Tag = {
        id: crypto.randomUUID(),
        ...tagData
      };
      
      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (error) {
      console.error('创建标签失败:', error);
      throw error;
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
    const result = await ApiClient.deleteImage(id);
    
    if (result.success) {
      // 从本地状态中移除图片
      setImages(prev => prev.filter(img => img.id !== id));
      // 关闭弹窗
      setIsImageModalOpen(false);
      setSelectedImage(null);
    } else {
      throw new Error(result.error || '删除失败');
    }
  }, []);

  // 处理图片复制
  const handleImageDuplicate = useCallback(async (image: ImageData) => {
    try {
      // 创建新的图片数据，移除id和更新时间戳
      const { id, createdAt, updatedAt, ...imageDataWithoutId } = image;
      const duplicatedImageData = {
        ...imageDataWithoutId,
        title: `${image.title} (副本)`,
        // 复制提示词数组
        prompts: image.prompts.map(prompt => ({
          ...prompt,
          id: crypto.randomUUID() // 为每个提示词生成新的ID
        })),
        // 复制标签数组
        tags: [...image.tags]
      };
      
      const result = await ApiClient.addImage(duplicatedImageData);
      
             if (result.success && result.data) {
         setImages(prev => [result.data!, ...prev]);
       } else {
         console.error('复制图片失败:', result.error);
         throw new Error(result.error || '复制失败');
       }
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
        await loadData();
        
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