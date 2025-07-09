"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImageData, Tag, Prompt, SearchFilters } from '@/types';
import { ApiClient } from '@/lib/api';
import { Database } from '@/lib/database';
import { filterImages, copyToClipboard, generateId } from '@/lib/utils';
import { SearchBar } from '@/components/search-bar';
import { ImageGrid } from '@/components/image-grid';
import { ImageModal } from '@/components/image-modal';
import { UploadModal } from '@/components/upload-modal';
import { ProgressModal, useProgress } from '@/components/progress-modal';


import { Dock } from '@/components/dock';
import TextPressure from '@/components/text-pressure';
import CircularText from '@/components/circular-text';

// 主页面组件
export default function HomePage() {
  // 状态管理
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
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
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const [activeView, setActiveView] = useState('grid');
  

  
  // 进度管理
  const { progressInfo, updateProgress, resetProgress } = useProgress();

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [imagesData, tagsData, promptsData] = await Promise.all([
        Database.getAllImagesMetadata(),
        Database.getTags(),
        Database.getPrompts()
      ]);
      
      setImages(imagesData);
      setTags(tagsData);
      setPrompts(promptsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化数据加载
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);
  
  // 数据加载函数（用于导入后刷新）
  const loadData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

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
  const handleImageUpload = useCallback(async (image: ImageData) => {
    // 上传后刷新数据
    await loadAllData();
  }, [loadAllData]);

  // 处理标签创建
  const handleTagCreate = useCallback(async (tagData: Omit<Tag, 'id'>) => {
    try {
      // 创建一个新标签对象
      const newTag: Tag = {
        id: generateId(),
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
          id: generateId() // 为每个提示词生成新的ID
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
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // 重置并显示进度弹窗
      resetProgress();
      setIsProgressModalOpen(true);
      
      try {
        // 步骤1: 读取文件
        updateProgress({
          status: 'reading',
          progress: 10,
          message: '正在读取文件...',
          details: `文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`
        });
        
        const text = await file.text();
        
        // 步骤2: 解析数据
        updateProgress({
          status: 'parsing',
          progress: 30,
          message: '正在解析数据...',
          details: '验证数据格式和完整性'
        });
        
        const data = JSON.parse(text);
        
        // 步骤3: 上传数据
        updateProgress({
          status: 'uploading',
          progress: 50,
          message: '正在上传数据...',
          details: `准备导入 ${data.images?.length || 0} 张图片`
        });
        
        // 使用XMLHttpRequest以获取上传进度
        const result = await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const uploadProgress = 50 + (event.loaded / event.total) * 30;
              updateProgress({
                status: 'uploading',
                progress: uploadProgress,
                message: '正在上传数据...',
                details: `已上传: ${(event.loaded / 1024 / 1024).toFixed(2)} MB / ${(event.total / 1024 / 1024).toFixed(2)} MB`
              });
            }
          };
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(xhr.statusText || '上传失败'));
            }
          };
          
          xhr.onerror = () => reject(new Error('网络错误'));
          
          xhr.open('POST', '/api/import');
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify({
            data,
            options: {
              mode: 'merge',
              skipDuplicates: true,
              preserveIds: false,
            },
          }));
        });
        
        // 步骤4: 处理数据
        updateProgress({
          status: 'processing',
          progress: 90,
          message: '正在处理数据...',
          details: '更新本地数据缓存'
        });
        
        // 重新加载数据
        await loadData();
        
        // 完成
        updateProgress({
          status: 'success',
          progress: 100,
          message: '导入完成！',
          details: `成功导入 ${(result as any).summary.imagesImported} 张图片，${(result as any).summary.tagsImported} 个标签，${(result as any).summary.promptsImported} 个提示词`
        });
        
      } catch (error) {
        console.error('导入失败:', error);
        updateProgress({
          status: 'error',
          progress: 0,
          message: '导入失败',
          error: (error as Error).message
        });
      }
    };
    input.click();
  }, [updateProgress, resetProgress, loadData]);

  const handleExport = useCallback(async () => {
    // 重置并显示进度弹窗
    resetProgress();
    setIsProgressModalOpen(true);
    
    try {
      // 步骤1: 准备数据
      updateProgress({
        status: 'preparing',
        progress: 20,
        message: '正在准备导出数据...',
        details: '收集图片、标签和提示词数据'
      });
      
      // 使用XMLHttpRequest以获取下载进度
      const { blob, filename } = await new Promise<{blob: Blob, filename: string}>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onprogress = (event) => {
          if (event.lengthComputable) {
            const downloadProgress = 20 + (event.loaded / event.total) * 60;
            updateProgress({
              status: 'downloading',
              progress: downloadProgress,
              message: '正在下载数据...',
              details: `已下载: ${(event.loaded / 1024 / 1024).toFixed(2)} MB / ${(event.total / 1024 / 1024).toFixed(2)} MB`
            });
          }
        };
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // 获取文件名
            const contentDisposition = xhr.getResponseHeader('Content-Disposition');
            const filename = contentDisposition
              ? contentDisposition.split('filename="')[1]?.split('"')[0]
              : `gallery-export-${new Date().toISOString().split('T')[0]}.json`;
            
            resolve({ blob: xhr.response, filename });
          } else {
            reject(new Error(xhr.statusText || '导出失败'));
          }
        };
        
        xhr.onerror = () => reject(new Error('网络错误'));
        
        xhr.open('GET', '/api/export');
        xhr.responseType = 'blob';
        xhr.send();
      });
      
      // 步骤2: 生成下载
      updateProgress({
        status: 'downloading',
        progress: 90,
        message: '正在生成下载文件...',
        details: `文件大小: ${(blob.size / 1024 / 1024).toFixed(2)} MB`
      });
      
      // 下载文件
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // 完成
      updateProgress({
        status: 'success',
        progress: 100,
        message: '导出完成！',
        details: `文件已保存: ${filename}`
      });
      
    } catch (error) {
      console.error('导出失败:', error);
      updateProgress({
        status: 'error',
        progress: 0,
        message: '导出失败',
        error: (error as Error).message
      });
    }
  }, [updateProgress, resetProgress]);

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
    // 设置功能暂时禁用
    console.log('设置功能');
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

  // 关闭进度弹窗
  const closeProgressModal = useCallback(() => {
    setIsProgressModalOpen(false);
    resetProgress();
  }, [resetProgress]);



  // 取消操作
  const handleCancelOperation = useCallback(() => {
    updateProgress({
      status: 'cancelled',
      progress: 0,
      message: '操作已取消'
    });
  }, [updateProgress]);


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

        {/* 进度弹窗 */}
        <ProgressModal
          isOpen={isProgressModalOpen}
          onClose={closeProgressModal}
          onCancel={handleCancelOperation}
          progressInfo={progressInfo}
          title={progressInfo.status === 'uploading' || progressInfo.status === 'reading' || progressInfo.status === 'parsing' ? '数据导入' : '数据导出'}
          allowCancel={!['success', 'error', 'cancelled'].includes(progressInfo.status)}
        />


      </div>
    </>
  );
}