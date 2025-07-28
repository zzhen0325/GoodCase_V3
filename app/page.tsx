'use client';

import _ from 'lodash';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WaterfallImageGrid } from '@/components/waterfall-image-grid';
import { ImageModal } from '@/components/image-modal/image-modal';
import { UploadModal } from '@/components/upload-modal/upload-modal';
import { ConnectionStatus } from '@/components/connection-status';
import CircularText from '@/components/circular-text';
import { DownloadProgressToast } from '@/components/download-progress-toast';

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/app-sidebar';
// import { useHomePage } from '@/hooks/use-home-page'; // 已移除
import { useImageState } from '@/hooks/use-image-state';
import { useModalState } from '@/hooks/use-modal-state';
import { useImageOperations } from '@/hooks/use-image-operations';
import { useBatchOperations } from '@/hooks/use-batch-operations';
import { useEditMode } from '@/hooks/use-edit-mode';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, FileText, ArrowUp, Search, X, Upload } from 'lucide-react';

// 主页面内容组件
function HomePageContent() {


  // 使用组合的 hooks 管理所有状态和操作

  // 图片状态和搜索
  const {
    images,
    filteredImages,
    isLoading,
    searchFilters,
    connectionStatus,
    handleSearchChange,
    refetch: refreshData,
    setImages
  } = useImageState();

  // 模态框状态
  const {
    selectedImage,
    isImageModalOpen,
    isUploadModalOpen,
    activeView,
    setSelectedImage,
    setIsImageModalOpen,
    handleImageClick,
    closeImageModal,
    closeUploadModal,
    handleUpload: openUploadModal
  } = useModalState();

  // 编辑模式和选择状态
  const {
    isEditMode,
    isSidebarEditMode,
    selectedImageIds,
    setIsEditMode,
    setIsSidebarEditMode,
    setSelectedImageIds,
    handleSelectImage,
    handleSelectAll,
    handleSidebarEditModeToggle
  } = useEditMode();

  // 图片操作
  const {
    handleImageUpdate,
    handleImageDelete,
    handleImageDuplicate: originalHandleImageDuplicate,
    handleCopyPrompt
  } = useImageOperations({
    selectedImage,
    setImages,
    setSelectedImage,
    setIsImageModalOpen,
    onRefresh: refreshData
  });

  // 包装复制函数，添加自动编辑模式
  const handleImageDuplicate = useCallback(async (image: any) => {
    closeImageModal(); // 先关闭原始图片弹窗，避免用户误操作
    setAutoEdit(true); // 设置自动编辑模式
    await originalHandleImageDuplicate(image);
    // 复制完成后，延迟重置autoEdit状态，确保弹窗已经打开并应用了自动编辑模式
    setTimeout(() => {
      setAutoEdit(false);
    }, 1000); // 增加延迟时间，确保弹窗完全打开并进入编辑模式
  }, [originalHandleImageDuplicate, closeImageModal]);

  // 批量操作
  const {
    handleBatchDelete,
    handleBatchExport
  } = useBatchOperations({
    selectedImageIds,
    filteredImages,
    setSelectedImageIds
  });

  // 无限滚动
  const {
    displayedImages,
    hasMore,
    loadingMore,
    loadMore
  } = useInfiniteScroll(filteredImages, 20);

  // 图片上传处理函数
  const handleImageUpload = useCallback(async (
    file: File,
    imageName: string,
    promptBlocks: any[],
    tagIds?: string[]
  ) => {
    try {
      console.log('🚀 开始上传图片:', imageName);

      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', imageName);

      // 添加提示词
      if (promptBlocks && promptBlocks.length > 0) {
        formData.append('promptBlocks', JSON.stringify(promptBlocks));
      }

      // 添加标签
      if (tagIds && tagIds.length > 0) {
        formData.append('tagIds', JSON.stringify(tagIds));
      }

      // 发送上传请求
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }

      const result = await response.json();
      console.log('✅ 图片上传成功:', result);

      // 直接添加新图片到本地状态，避免整个列表刷新
      if (result.data) {
        setImages(prev => [result.data, ...prev]);
      }

      // 显示成功提示
      // toast.success('图片上传成功！');

    } catch (error) {
      console.error('❌ 图片上传失败:', error);
      // toast.error('图片上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
      throw error; // 重新抛出错误，让UploadModal处理
    }
  }, [setImages]);

  const handleImport = useCallback(() => {
    // TODO: 实现导入逻辑
    console.log('Import');
  }, []);

  const handleUpload = useCallback(() => {
    openUploadModal();
  }, [openUploadModal]);

  const handleExport = useCallback(() => {
    // TODO: 实现导出逻辑
    console.log('Export');
  }, []);

  const handleFavorites = useCallback(() => {
    // TODO: 实现收藏逻辑
    console.log('Favorites');
  }, []);

  const handleSettings = useCallback(() => {
    // TODO: 实现设置逻辑
    console.log('Settings');
  }, []);

  const handleLarkDoc = useCallback(() => {
    // TODO: 实现飞书文档逻辑
    console.log('Lark Doc');
  }, []);

  const getConnectionInfo = useCallback(() => {
    return {
      status: connectionStatus,
      lastSync: new Date().toISOString()
    };
  }, [connectionStatus]);

  // 自动编辑模式状态
  const [autoEdit, setAutoEdit] = useState(false);

  // 下载进度状态
  const [downloadProgress, setDownloadProgress] = useState({
    isVisible: false,
    progress: 0,
    current: 0,
    total: 0,
    hideProgress: () => setDownloadProgress(prev => ({ ...prev, isVisible: false }))
  });

  // 获取边栏状态
  const { open: sidebarOpen } = useSidebar();

  // 滚动状态管理
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 监听滚动事件
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = _.throttle(() => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollTop(scrollTop > 200);

      if (
        scrollHeight - scrollTop - clientHeight < 100 &&
        !loadingMore &&
        hasMore
      ) {
        loadMore();
      }
    }, 200);

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [loadMore, loadingMore, hasMore]);

  // 滚动到顶部
  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-50 h- mx-auto mb-8">
            <CircularText
              text="LOADING • LOADING • LOADING • "
              className="text-black text-sm font-medium tracking-wider"
            />
            <div className="absolute inset-0 flex items-center justify-center"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AppSidebar
        onSearch={handleSearchChange}
        currentFilters={searchFilters}
        onImport={handleImport}
        onExport={handleExport}
      />
      <SidebarInset>
        <header className="flex h-24 shrink-0 items-center gap-4 border-b px-10 z-9999">
          <SidebarTrigger className="h-12 w-12 bg-muted/30 border border-border" />
          <Separator orientation="vertical" className="mx-2 h-4" />
          {/* 当边栏隐藏时显示标题 */}
          {!sidebarOpen && (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-black">Gooodcase!</h1>
              </div>
              <Separator orientation="vertical" className="mx-2 h-4" />
            </>
          )}
          {/* 中间搜索框区域 */}
          <div className="flex-1 ">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 " />
              <Input
                type="text"
                placeholder="Search images..."
                value={searchFilters.query || ''}
                onChange={(e) => handleSearchChange({ ...searchFilters, query: e.target.value })}
                className="w-full h-12 pl-10 pr-4 rounded-xl bg-muted/30 border-border  font-medium text-black placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300"
              />
              {searchFilters.query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => handleSearchChange({ ...searchFilters, query: '' })}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          <Separator orientation="vertical" className="mx-2 h-4" />
          {/* 右侧按钮组 */}
          <div className="flex items-center gap-2 ">

            <Button
              onClick={handleUpload}
              className="bg-black h-12 rounded-2xl text-white  font-bold px-8 hover:bg-accent hover:text-black transition-colors"
              size="sm"
            >
              <Upload className="w-4 h-4 " />
              Upload
            </Button>
          </div>
        </header>

        {/* 主容器 - 图片瀑布流区域 */}
        <div className="flex flex-1 flex-col gap-4 p-10 ">
          {/* ImageModal 区域 - 面板形式，居中显示 */}
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="w-full h-full rounded-3xl overflow-hidden">
                <ImageModal
                  isOpen={isImageModalOpen}
                  image={selectedImage}
                  onClose={() => {
                    setAutoEdit(false); // 关闭弹窗时重置自动编辑模式
                    closeImageModal();
                  }}
                  onUpdate={handleImageUpdate}
                  onDelete={handleImageDelete}
                  onCopyPrompt={handleCopyPrompt}
                  onDuplicate={handleImageDuplicate}
                  autoEdit={autoEdit}
                />
              </div>
            </motion.div>
          )}

          {/* 图片网格区域 - 瀑布流布局，可滚动 */}
          {!selectedImage && (
            <div
              ref={scrollContainerRef}
              className="h-[calc(100vh-12rem)] overflow-y-auto relative scroll-smooth custom-scrollbar px-4"
            >
              <WaterfallImageGrid
                images={displayedImages}
                onImageClick={handleImageClick}
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={loadingMore}
              />

              {/* 返回顶部按钮 */}
              <AnimatePresence>
                {showScrollTop && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      onClick={scrollToTop}
                      size="lg"
                      className="fixed bottom-8 right-8 z-50 rounded-full w-12 h-12 shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </SidebarInset>

      {/* 上传弹窗 */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        onUpload={handleImageUpload}
      />

      {/* 连接状态 */}
      <ConnectionStatus status={connectionStatus} />

      {/* 下载进度提示 */}
      <DownloadProgressToast
        isVisible={downloadProgress.isVisible}
        progress={downloadProgress.progress}
        onClose={downloadProgress.hideProgress}
      />



    </>
  );
}

// 主页面组件
export default function HomePage() {
  return (
    <SidebarProvider>
      <HomePageContent />
    </SidebarProvider>
  );
}
