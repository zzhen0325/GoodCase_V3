"use client"

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageData } from '@/types';
import { ImageCard } from './image-card';
import { Loader2 } from 'lucide-react';

interface ImageGridProps {
  images: ImageData[];
  onImageClick: (image: ImageData) => void;
  loading?: boolean;
  isEditMode?: boolean;
  selectedImageIds?: Set<string>;
  onSelectImage?: (imageId: string, selected: boolean) => void;
  isCompact?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

export const ImageGrid = React.memo(function ImageGrid({ 
  images, 
  onImageClick, 
  loading = false, 
  isEditMode = false, 
  selectedImageIds = new Set(), 
  onSelectImage,
  isCompact = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false
}: ImageGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // 滚动加载检测
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore || !hasMore) return;
    
    const handleScroll = () => {
      setIsScrolling(true);
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      if (scrollHeight - scrollTop - clientHeight < 200 && !loadingMore) {
        onLoadMore();
      }
      
      clearTimeout((window as any).scrollTimer);
      (window as any).scrollTimer = setTimeout(() => setIsScrolling(false), 150);
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout((window as any).scrollTimer);
    };
  }, [onLoadMore, hasMore, loadingMore]);
  // 加载状态
  if (loading) {
    return (
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-10 space-y-10">
        {Array.from({ length: 12 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="break-inside-avoid mb-6"
          >
            <div className="bg-muted animate-pulse rounded-2xl overflow-hidden">
              <div 
                className="w-full bg-gradient-to-br from-muted to-muted/50"
                style={{ height: `${Math.random() * 200 + 200}px` }}
              />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted-foreground/20 rounded animate-pulse" />
                <div className="h-3 bg-muted-foreground/10 rounded w-3/4 animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-6 w-12 bg-muted-foreground/10 rounded-full animate-pulse" />
                  <div className="h-6 w-16 bg-muted-foreground/10 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // 空状态
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          暂无图片
        </h3>
        <p className="text-muted-foreground max-w-sm">
          还没有添加任何图片，点击右下角的 + 按钮开始添加您的第一张图片吧！
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 滚动指示器 */}
      <AnimatePresence>
        {isScrolling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-20 right-6 z-50 bg-background/80 backdrop-blur-sm border rounded-full p-2 shadow-lg"
          >
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 图片网格 */}
      <div className={`columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-10 space-y-10${isCompact ? ' !columns-1' : ''}`}>
        {images.map((image, index) => (
          <div 
            key={image.id} 
            className="break-inside-avoid mb-6"
          >
            <ImageCard
              image={image}
              onClick={onImageClick}
              index={index}
              isEditMode={isEditMode}
              isSelected={selectedImageIds.has(image.id)}
              onSelect={onSelectImage}
            />
          </div>
        ))}
      </div>
      
      {/* 加载更多指示器 */}
      <AnimatePresence>
        {loadingMore && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center py-8"
          >
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">加载更多图片...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 到达底部提示 */}
      <AnimatePresence>
        {!hasMore && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center py-8"
          >
            <div className="text-center text-muted-foreground">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium">已显示全部图片</p>
              <p className="text-xs mt-1">共 {images.length} 张图片</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});