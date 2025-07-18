'use client';

import _ from 'lodash';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageGrid } from '@/components/image-grid';
import { ImageModal } from '@/components/image-modal';
import { UploadModal } from '@/components/upload-modal';
import { ConnectionStatus } from '@/components/connection-status';
import CircularText from '@/components/circular-text';
import { DownloadProgressToast } from '@/components/download-progress-toast';

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/app-sidebar';
import { useHomePage } from '@/hooks/use-home-page';
import { Button } from '@/components/ui/button';
import { Bot, Wrench, FileText, ArrowUp } from 'lucide-react';

// 主页面组件
export default function HomePage() {
  // 使用整合的 hook 管理所有状态和操作
  const {
    // 状态
    images,
    filteredImages,
    displayedImages,

    isLoading,
    searchFilters,
    connectionStatus,
    selectedImage,
    isImageModalOpen,
    isUploadModalOpen,

    activeView,
    isEditMode,
    isSidebarEditMode,
    selectedImageIds,
    downloadProgress,
    hasMore,
    loadingMore,

    // 操作函数
    loadMore,
    handleSearchChange,
    handleImageClick,
    handleImageUpdate,
    handleImageUpload,
    handleImageDelete,
    handleImageDuplicate,
    handleCopyPrompt,

    handleSelectImage,
    handleSelectAll,
    handleSidebarEditModeToggle,
    handleBatchDelete,
    handleBatchExport,
    handleImport,
    handleUpload,
    handleExport,
    handleFavorites,
    handleSettings,
    handleLarkDoc,

    closeImageModal,
    closeUploadModal,

    refreshData,
    getConnectionInfo,
  } = useHomePage();

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
          <div className="relative w-32 h-32 mx-auto mb-8">
            <CircularText
              text="LOADING • LOADING • LOADING • "
              className="text-gray-400 text-sm font-medium tracking-wider"
            />
            <div className="absolute inset-0 flex items-center justify-center"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        onSearch={handleSearchChange}
        currentFilters={searchFilters}
        onUpload={handleUpload}
        // 将右上角工具按钮传递给侧边栏
        toolButtons={[
          {
            label: 'lemo-prompt',
            icon: Bot,
            onClick: () =>
              window.open(
                'https://www.coze.cn/store/agent/7517149263135670299?bot_id=true&bid=6grtojeg03g13',
                '_blank'
              ),
          },

          {
            label: 'Lemon8 AI WIKI',
            icon: FileText,
            onClick: handleLarkDoc,
          },
        ]}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">Gooodcase!</h1>
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
                  onClose={closeImageModal}
                  onUpdate={handleImageUpdate}
                  onDelete={handleImageDelete}
                  onCopyPrompt={handleCopyPrompt}
                  onDuplicate={handleImageDuplicate}
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
              <ImageGrid
                images={displayedImages}
                onImageClick={handleImageClick}
                isEditMode={isEditMode}
                selectedImageIds={selectedImageIds}
                onSelectImage={handleSelectImage}
                isCompact={false}
                hasMore={hasMore}
                onLoadMore={loadMore}
                loadingMore={loadingMore}
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
    </SidebarProvider>
  );
}
