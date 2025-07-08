"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImageData, Tag, SearchFilters } from '@/types';
import { ImageDatabase } from '@/lib/database';
import { filterImages, copyToClipboard } from '@/lib/utils';
import { SearchBar } from '@/components/search-bar';
import { ImageGrid } from '@/components/image-grid';
import { ImageModal } from '@/components/image-modal';
import { UploadModal } from '@/components/upload-modal';
import { Dock } from '@/components/dock';
import TextPressure from '@/components/text-pressure';

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
  
  // 数据库实例
  const [database, setDatabase] = useState<ImageDatabase | null>(null);

  // 初始化数据库
  useEffect(() => {
    const initDatabase = async () => {
      try {
        const db = new ImageDatabase();
        await db.init();
        setDatabase(db);
        
        // 加载数据
        await loadData(db);
      } catch (error) {
        console.error('数据库初始化失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  // 加载数据
  const loadData = async (db: ImageDatabase) => {
    try {
      const [imagesData, tagsData] = await Promise.all([
        db.getAllImages(),
        db.getAllTags()
      ]);
      
      setImages(imagesData);
      setTags(tagsData);
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
    if (!database) return;

    try {
      const updatedImage: ImageData = {
        ...images.find(img => img.id === id)!,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await database.updateImage(id, updatedImage);
      
      // 更新本地状态
      setImages(prev => prev.map(img => 
        img.id === id ? updatedImage : img
      ));
      
      // 更新选中的图片
      if (selectedImage?.id === id) {
        setSelectedImage(updatedImage);
      }
    } catch (error) {
      console.error('更新图片失败:', error);
    }
  }, [database, images, selectedImage]);

  // 处理图片上传
  const handleImageUpload = useCallback(async (imageData: Omit<ImageData, 'id'>) => {
    if (!database) return;

    try {
      const newImage = await database.addImage(imageData);
      setImages(prev => [newImage, ...prev]);
    } catch (error) {
      console.error('上传图片失败:', error);
      throw error;
    }
  }, [database]);

  // 处理标签创建
  const handleTagCreate = useCallback(async (tagData: Omit<Tag, 'id'>) => {
    if (!database) throw new Error('数据库未初始化');

    try {
      const newTag = await database.addTag(tagData);
      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (error) {
      console.error('创建标签失败:', error);
      throw error;
    }
  }, [database]);

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
    if (!database) return;

    try {
      const result = await database.deleteImage(id);
      if (result.success) {
        // 从本地状态中移除图片
        setImages(prev => prev.filter(img => img.id !== id));
        // 关闭弹窗
        setIsImageModalOpen(false);
        setSelectedImage(null);
      } else {
        console.error('删除图片失败:', result.error);
        alert('删除图片失败: ' + result.error);
      }
    } catch (error) {
      console.error('删除图片失败:', error);
      alert('删除图片失败: ' + (error as Error).message);
    }
  }, [database]);

  // 处理图片复制
  const handleImageDuplicate = useCallback(async (image: ImageData) => {
    if (!database) return;

    try {
      // 创建新的图片数据，移除id和更新时间戳
      const { id, createdAt, updatedAt, ...imageDataWithoutId } = image;
      const now = new Date().toISOString();
      const duplicatedImageData = {
        ...imageDataWithoutId,
        title: `${image.title} (副本)`,
        // 复制提示词数组
        prompts: image.prompts.map(prompt => ({
          ...prompt,
          id: crypto.randomUUID() // 为每个提示词生成新的ID
        })),
        // 复制标签数组
        tags: [...image.tags],
        // 添加时间戳
        createdAt: now,
        updatedAt: now
      };
      
      const newImage = await database.addImage(duplicatedImageData);
      setImages(prev => [newImage, ...prev]);
    } catch (error) {
      console.error('复制图片失败:', error);
      throw error;
    }
  }, [database]);

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
      if (!file || !database) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // 验证数据格式
        if (!data.images || !data.tags || !Array.isArray(data.images) || !Array.isArray(data.tags)) {
          throw new Error('数据格式不正确');
        }
        
        await database.importData(data);
        await loadData(database);
        
        alert(`成功导入 ${data.images.length} 张图片和 ${data.tags.length} 个标签`);
      } catch (error) {
        console.error('导入失败:', error);
        alert('导入失败: ' + (error as Error).message);
      }
    };
    input.click();
  }, [database]);

  const handleExport = useCallback(async () => {
    if (!database) return;
    
    try {
      const data = await database.exportData();
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
  }, [database]);

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    
      <><div className="flex justify-center w-full ">
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
    </div><div className="min-h-screen bg-background">
        {/* 主要内容区域 */}
        <div className=" container mx-auto px-4 mb-4 pb-24">
          {/* 头部 */}

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
      </div></>
  );
}