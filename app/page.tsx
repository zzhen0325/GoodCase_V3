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
import { DownloadProgressToast, useDownloadProgress } from '@/components/download-progress-toast';
import { LemoTagger } from '@/components/lemo-tagger';

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  
  // 下载进度管理
  const {
    isVisible: isDownloadVisible,
    progress: downloadProgress,
    startDownload,
    updateProgress,
    completeDownload,
    errorDownload,
    hideToast: hideDownloadToast
  } = useDownloadProgress();

  // ESC键退出编辑模式
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEditMode) {
        setIsEditMode(false);
        setSelectedImageIds(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditMode]);

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

  // 搜索和筛选图片（前端搜索）
  useEffect(() => {
    const filtered = filterImages(images, searchFilters);
    setFilteredImages(filtered);
  }, [images, searchFilters]);

  // 处理搜索变化（前端搜索）
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
    console.log('📤 开始上传图片:', { fileName: file.name, imageName, promptsCount: prompts.length, tagsCount: tags.length });
    
    // 生成临时ID
    const tempId = `temp_${Date.now()}`;
    
    // 创建预览URL
    const previewUrl = URL.createObjectURL(file);
    
    // 立即在UI中显示加载状态的图片
    const loadingImageData: ImageData = {
      id: tempId,
      url: previewUrl,
      title: imageName,
      tags: tags,
      prompts: prompts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isUploading: true, // 标记为上传中
    };
    
    // 立即更新UI，在列表顶部显示加载状态的图片
    setImages(prevImages => [loadingImageData, ...prevImages]);
    
    try {
      if (connectionStatus === 'connected') {
        // 在线上传
        const tagsString = tags.map(tag => tag.name).join(',');
        const result = await ApiClient.addImage(file, imageName, tagsString);
        
        if (result.success && result.data) {
          console.log('✅ 图片上传成功，实时监听器将自动更新UI');
          
          // 移除临时图片，实时监听器会自动添加真实图片
          setImages(prevImages => prevImages.filter(img => img.id !== tempId));
          
          // 清理预览URL
          URL.revokeObjectURL(previewUrl);
          
          // 如果有提示词，批量更新
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

          // 更新临时图片为本地图片
          setImages(prevImages => 
            prevImages.map(img => 
              img.id === tempId ? localImageData : img
            )
          );
          
          // 清理预览URL
          URL.revokeObjectURL(previewUrl);

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
            throw error;
          }
        };
      }
    } catch (error) {
      console.error('❌ 上传失败:', error);
      
      // 移除临时图片
      setImages(prevImages => prevImages.filter(img => img.id !== tempId));
      
      // 清理预览URL
      URL.revokeObjectURL(previewUrl);
      
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

  // 辅助函数：从URL获取文件扩展名
  const getFileExtensionFromUrl = useCallback((url: string): string => {
    try {
      const pathname = new URL(url).pathname;
      const extension = pathname.split('.').pop();
      return extension || 'jpg';
    } catch {
      return 'jpg';
    }
  }, []);

  // Lemo Tagger 状态
  const [isLemoTaggerOpen, setIsLemoTaggerOpen] = useState(false);

  // 处理图片复制
  const handleImageDuplicate = useCallback(async (image: ImageData) => {
    try {
      console.log('🔄 开始复制图片:', image.title);
      
      // 立即打开当前图片的详情弹窗并进入编辑模式
      setSelectedImage(image);
      setIsImageModalOpen(true);
      
      // 后台异步复制图片
      (async () => {
        try {
          // 从图片URL下载文件
          const response = await fetch(image.url);
          if (!response.ok) {
            throw new Error(`下载图片失败: ${response.status}`);
          }
          
          const blob = await response.blob();
          
          // 获取文件扩展名
          const extension = getFileExtensionFromUrl(image.url);
          
          // 创建新的文件对象
          const newFileName = `${image.title}_copy.${extension}`;
          const file = new File([blob], newFileName, { type: blob.type });
          
          // 创建新的标题
          const newTitle = `${image.title} (副本)`;
          
          // 使用现有的上传逻辑，包含所有提示词和标签数据
          await handleImageUpload(file, newTitle, image.prompts || [], image.tags || []);
          
          console.log('✅ 图片复制成功');
        } catch (error) {
          console.error('❌ 后台复制图片失败:', error);
        }
      })();
      
    } catch (error) {
      console.error('❌ 复制图片失败:', error);
      throw error;
    }
  }, [handleImageUpload, getFileExtensionFromUrl]);

  // Dock 导航处理函数
  const handleUpload = useCallback(() => {
    setIsUploadModalOpen(true);
  }, []);

  const handleImport = useCallback(() => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // 退出编辑模式时清空选择
      setSelectedImageIds(new Set());
    }
  }, [isEditMode]);

  const handleExport = useCallback(async () => {
    alert('暂时没用，为了对称');
  }, []);

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

  // 处理 Lemo Tagger
  const handleLemoTagger = useCallback(() => {
    setIsLemoTaggerOpen(true);
  }, []);

  // 关闭 Lemo Tagger
  const closeLemoTagger = useCallback(() => {
    setIsLemoTaggerOpen(false);
  }, []);

  // 处理标签删除
  const handleTagDelete = useCallback(async (tagId: string) => {
    const confirmed = confirm('确定要删除这个标签吗？删除后将从所有图片中移除。');
    if (!confirmed) return;

    try {
      const result = await ApiClient.deleteTag(tagId);
      if (result.success) {
        console.log('✅ 标签删除成功，实时监听器将自动更新UI');
        // 实时监听器会自动更新tags状态，无需手动更新
      } else {
        console.error('❌ 标签删除失败:', result.error);
        alert('删除标签失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 删除标签时出错:', error);
      alert('删除标签失败: ' + (error as Error).message);
    }
  }, []);

  // 批量操作处理函数
  const handleSelectImage = useCallback((imageId: string, selected: boolean) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(imageId);
      } else {
        newSet.delete(imageId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedImageIds.size === filteredImages.length) {
      // 如果已全选，则取消全选
      setSelectedImageIds(new Set());
    } else {
      // 否则全选
      setSelectedImageIds(new Set(filteredImages.map(img => img.id)));
    }
  }, [selectedImageIds.size, filteredImages]);

  const handleBatchDelete = useCallback(async () => {
    if (selectedImageIds.size === 0) return;
    
    const confirmed = confirm(`确定要删除选中的 ${selectedImageIds.size} 张图片吗？`);
    if (!confirmed) return;

    try {
      const deletePromises = Array.from(selectedImageIds).map(id => ApiClient.deleteImage(id));
      await Promise.all(deletePromises);
      setSelectedImageIds(new Set());
      console.log('✅ 批量删除成功');
    } catch (error) {
      console.error('❌ 批量删除失败:', error);
      alert('批量删除失败: ' + (error as Error).message);
    }
  }, [selectedImageIds]);



  const handleBatchExport = useCallback(async () => {
    if (selectedImageIds.size === 0) return;

    try {
      const selectedImages = filteredImages.filter(img => selectedImageIds.has(img.id));

      // 导出图片
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        if (!image.url) continue;

        try {
          const imgElements = document.querySelectorAll('img');
          let cachedImg: HTMLImageElement | null = null;

          for (let j = 0; j < imgElements.length; j++) {
            const imgEl = imgElements[j];
            if (imgEl.src === image.url) {
              cachedImg = imgEl;
              break;
            }
          }

          let blob: Blob;

          if (cachedImg && cachedImg.complete) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = cachedImg.naturalWidth;
            canvas.height = cachedImg.naturalHeight;
            ctx?.drawImage(cachedImg, 0, 0);
            blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((blob) => {
                resolve(blob!);
              }, 'image/png');
            });
          } else {
            const response = await fetch(image.url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            blob = await response.blob();
          }

          const extension = getFileExtensionFromUrl(image.url);
          const filename = `${image.title || `image-${image.id}`}.${extension}`;

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          if (i < selectedImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`❌ 下载图片 ${image.title || image.id} 失败:`, error);
        }
      }

      // 导出JSON数据
      const exportData = {
        images: selectedImages,
        tags: tags.filter(tag =>
          selectedImages.some(img =>
            img.tags.some(imgTag =>
              typeof imgTag === 'string' ? imgTag === tag.name : imgTag.id === tag.id
            )
          )
        ),
        exportTime: new Date().toISOString(),
        totalCount: selectedImages.length
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `selected-images-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`已开始下载 ${selectedImages.length} 张图片并导出JSON数据`);
    } catch (error) {
      console.error('❌ 批量导出失败:', error);
      alert('批量导出失败: ' + (error as Error).message);
    }
  }, [selectedImageIds, filteredImages, tags, getFileExtensionFromUrl]);

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
      />
      
      <div className="flex w-full justify-center pt-8 sm:pt-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-[65%] max-w-[1280px]"
        >
          <div className="text-center">
           <p className="mb-2 text-xs tracking-[0.08em] text-gray-300 sm:text-sm">
              Manage your images and prompt words to make creation more efficient.
            </p>
            <div className="relative h-[clamp(7rem,13vw,12rem)] w-full">
              <TextPressure
                text="GoooodCase!"
                flex
                alpha={false}
                stroke={false}
                width
                weight
                italic
                scale={false}
                textColor="#000"
                minFontSize={24} />
            </div>
             
          </div>
        </motion.div>
      </div>
      
      <div className="min-h-screen  bg-background">
        {/* 主要内容区域 */}
        <div className="w-[65%] mx-auto px-4 mb-4 pb-24 mt-10">
          {/* 搜索栏
          {!isEditMode && (
            <SearchBar
              onSearch={setSearchFilters}
              selectedTags={searchFilters.tags}
              onTagsChange={(tags) => setSearchFilters(prev => ({ ...prev, tags }))}
              availableTags={tags} />
          )} */}
          
          {/* 批量操作工具栏 */}
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-muted rounded-2xl border mt-10"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    已选择 {selectedImageIds.size} 张图片
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedImageIds.size === filteredImages.length ? '取消全选' : '全选'}
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-2xl">
                  <button
                    onClick={handleBatchExport}
                    disabled={selectedImageIds.size === 0}
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    导出
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={selectedImageIds.size === 0}
                    className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    删除
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 标签管理区域
          {isEditMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-muted rounded-2xl border"
            >
              <div className="flex gap-3  mb-3">
                <h3 className="text-sm font-medium text-foreground mb-2">标签管理</h3>
                <p className="text-xs text-muted-foreground">点击删除按钮可以清除无用的标签</p>
              </div>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 px-3 py-1 bg-background rounded-full border text-sm"
                    >
                      <span className="text-foreground">{tag.name}</span>
                      <button
                        onClick={() => handleTagDelete(tag.id)}
                        className="text-destructive hover:text-destructive/80 transition-colors duration-200"
                        title="删除标签"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无标签</p>
              )}
            </motion.div>
          )} */}
          
          {/* 图片网格 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ImageGrid
              images={filteredImages}
              loading={isLoading}
              onImageClick={handleImageClick}
              isEditMode={isEditMode}
              selectedImageIds={selectedImageIds}
              onSelectImage={handleSelectImage} />
          </motion.div>

          {/* 统计信息 */}
          {filteredImages.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-20 text-center text-sm text-muted-foreground"
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
          onFavorites={handleFavorites}
          onSettings={handleSettings}
          onLarkDoc={handleLarkDoc}
          onLemoTagger={handleLemoTagger}
          onEdit={handleImport}
          isEditMode={isEditMode}
          onSearch={handleSearchChange}
          selectedTags={searchFilters.tags}
          onTagsChange={(tags) => setSearchFilters(prev => ({ ...prev, tags }))}
          availableTags={tags}
          searchQuery={searchFilters.query}
          onSearchQueryChange={(query) => setSearchFilters(prev => ({ ...prev, query }))}
        />

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
        
        {/* 下载进度Toast */}
        <DownloadProgressToast
          isVisible={isDownloadVisible}
          progress={downloadProgress}
          onClose={hideDownloadToast}
        />
        
        {/* Lemo Tagger 弹窗 */}
        <LemoTagger
          isOpen={isLemoTaggerOpen}
          onClose={closeLemoTagger}
        />
      </div>
    </>
  );
}
