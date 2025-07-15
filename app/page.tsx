"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { ImageGrid } from '@/components/image-grid';
import { ImageModal } from '@/components/image-modal';
import { UploadModal } from '@/components/upload-modal';

import { ConnectionStatus } from '@/components/connection-status';
import CircularText from '@/components/circular-text';
import { DownloadProgressToast } from '@/components/download-progress-toast';
import { LemoTagger } from '@/components/lemo-tagger';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useHomePage } from '@/hooks/use-home-page';
import { Button } from '@/components/ui/button';
import { Bot, Wrench, FileText } from 'lucide-react';

// 主页面组件
export default function HomePage() {
  // 使用整合的 hook 管理所有状态和操作
  const {
    // 状态
    images,
    filteredImages,
    tags,
    isLoading,
    searchFilters,
    connectionStatus,
    selectedImage,
    isImageModalOpen,
    isUploadModalOpen,
    isLemoTaggerOpen,
    activeView,
    isEditMode,
    selectedImageIds,
    downloadProgress,
    
    // 操作函数
    handleSearchChange,
    handleImageClick,
    handleImageUpdate,
    handleImageUpload,
    handleImageDelete,
    handleImageDuplicate,
    handleCopyPrompt,
    handleTagCreate,
    handleCreateTag,
    handleTagDelete,
    handleSelectImage,
    handleSelectAll,
    handleBatchDelete,
    handleBatchExport,
    handleImport,
    handleUpload,
    handleExport,
    handleFavorites,
    handleSettings,
    handleLarkDoc,
    handleLemoTagger,
    closeImageModal,
    closeUploadModal,
    closeLemoTagger,
    refreshData,
    getConnectionInfo,
  } = useHomePage();





  if (isLoading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <CircularText 
              text="LOADING • LOADING • LOADING • " 
              className="text-gray-400 text-sm font-medium tracking-wider"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              
            </div>
          </div>
    
         
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header栏 */}
      <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900">Gooodcase</h1>
        </div>
        
        {/* 右上角工具按钮 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open('https://www.coze.cn/store/agent/7517149263135670299?bot_id=true&bid=6grtojeg03g13', '_blank')}
            className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bot className="w-4 h-4 mr-2" />
            lemo-prompt
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLemoTagger}
            className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Tagger tool
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLarkDoc}
            className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4 mr-2" />
            Lemon8 AI WIKI
          </Button>
        </div>
      </header>
      
      {/* 主要内容区域 */}
      <div className="flex-1 flex ">
        <SidebarProvider>
          <AppSidebar 
            tags={tags}
            selectedTags={tags.filter(tag => searchFilters.tags.includes(tag.id))}
            onTagToggle={(tag) => {
              const isSelected = searchFilters.tags.includes(tag.id)
              const newTags = isSelected
                ? searchFilters.tags.filter(id => id !== tag.id)
                : [...searchFilters.tags, tag.id]
              handleSearchChange({
                ...searchFilters,
                tags: newTags
              })
            }}
            onSearch={(filters) => {
              handleSearchChange({
                ...searchFilters,
                query: filters.query,
                tags: filters.tags.map(tag => tag.id)
              })
            }}
            onTagsChange={(newTags) => {
              handleSearchChange({
                ...searchFilters,
                tags: newTags.map(tag => tag.id)
              })
            }}
            onUpload={handleUpload}
          />
        
        {/* 主容器 - 图片网格区域 */}
          <div className="flex-1 flex px-6">
            {/* 固定尺寸的网格容器 */}
            <div 
              className="flex rounded-3xl overflow-hidden" 
              style={{
                backgroundColor: 'hsl(var(--grid-background))',
                height: 'var(--sidebar-height)', // 使用统一的侧边栏高度变量
                width: 'calc(100vw - 20rem)', // 90vw减去侧边栏宽度(16rem)
                maxHeight: '90vh', // 限制在屏幕可视区域内
              }}
            >
              {/* ImageModal 区域 - 面板形式，居中显示 */}
              {selectedImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="w-full"
                >
                  <div className="h-full rounded-3xl overflow-hidden">
                    <ImageModal
                      isOpen={isImageModalOpen}
                      image={selectedImage}
                      onClose={closeImageModal}
                      onUpdate={handleImageUpdate}
                      onDelete={handleImageDelete}
                      onCreateTag={handleCreateTag}
                      availableTags={tags}
                      onCopyPrompt={handleCopyPrompt}
                      onDuplicate={handleImageDuplicate}
                      isPanel={true}
                      images={filteredImages}
                      currentIndex={filteredImages.findIndex(img => img.id === selectedImage.id)}
                      onNavigate={(direction) => {
                        const currentIndex = filteredImages.findIndex(img => img.id === selectedImage.id)
                        const newIndex = direction === 'prev' 
                          ? (currentIndex - 1 + filteredImages.length) % filteredImages.length
                          : (currentIndex + 1) % filteredImages.length
                        handleImageClick(filteredImages[newIndex])
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* 图片网格区域 */}
              {!selectedImage && (
                <div className="flex-1 h-full overflow-y-auto">
                  <div className="p-6">
                    <ImageGrid
                      images={filteredImages}
                      onImageClick={handleImageClick}
                      isEditMode={isEditMode}
                      selectedImageIds={selectedImageIds}
                      onSelectImage={handleSelectImage}
                      isCompact={false}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarProvider>
      </div>
      
      {/* 上传弹窗 */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        onUpload={handleImageUpload}
        availableTags={tags}
        onCreateTag={handleCreateTag}
      />
      
      {/* Lemo Tagger */}
      <LemoTagger
        isOpen={isLemoTaggerOpen}
        onClose={closeLemoTagger}
      />
      
      {/* 连接状态 */}
      <ConnectionStatus status={connectionStatus} />
      
      {/* 下载进度提示 */}
      <DownloadProgressToast
         isVisible={downloadProgress.isVisible}
         progress={downloadProgress.progress}
         onClose={downloadProgress.hideToast}
       />
    </div>
  );
}