'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ImageData } from '@/types';
import { Loader2 } from 'lucide-react';

interface WaterfallImageGridProps {
  images: ImageData[];
  onImageClick: (image: ImageData) => void;
  loading?: boolean;
  isEditMode?: boolean;
  selectedImageIds?: Set<string>;
  onSelectImage?: (imageId: string, selected: boolean) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

// 纯图片卡片组件
const WaterfallImageCard = React.memo(function WaterfallImageCard({
  image,
  onClick,
  index,
  isEditMode = false,
  isSelected = false,
  onSelect,
}: {
  image: ImageData;
  onClick: (image: ImageData) => void;
  index: number;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: (imageId: string, selected: boolean) => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);
  const [beforeError, setBeforeError] = useState(false);
  const [afterError, setAfterError] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // 当图片URL变化时重置状态
  useEffect(() => {
    if (image.type === 'single') {
      setImageLoaded(false);
      setImageError(false);
    } else {
      setBeforeLoaded(false);
      setAfterLoaded(false);
      setBeforeError(false);
      setAfterError(false);
    }
  }, [image.type, image.url, image.beforeImage?.url, image.afterImage?.url]);

  const handleClick = useCallback(() => {
    if (isEditMode && onSelect) {
      onSelect(image.id, !isSelected);
    } else {
      onClick(image);
    }
  }, [image, onClick, isEditMode, isSelected, onSelect]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoaded(true);
    setImageError(true);
  }, []);

  const handleBeforeLoad = useCallback(() => {
    setBeforeLoaded(true);
    setBeforeError(false);
  }, []);

  const handleBeforeError = useCallback(() => {
    setBeforeLoaded(true);
    setBeforeError(true);
  }, []);

  const handleAfterLoad = useCallback(() => {
    setAfterLoaded(true);
    setAfterError(false);
  }, []);

  const handleAfterError = useCallback(() => {
    setAfterLoaded(true);
    setAfterError(true);
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        delay: index * 0.02, 
        duration: 0.4,
        ease: "easeOut"
      }}
      className="relative group cursor-pointer break-inside-avoid mb-4"
      onClick={handleClick}
    >
      {/* 编辑模式选择框 */}
      {isEditMode && (
        <div className="absolute top-2 right-2 z-20">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center backdrop-blur-sm transition-all duration-300 shadow-lg ${
              isSelected
                ? 'bg-blue-500 border-blue-500'
                : 'bg-white/90 border-gray-300 hover:border-gray-400'
            }`}
          >
            {isSelected && (
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* 图片容器 */}
      <div className="relative overflow-hidden rounded-xl bg-gray-100">
        {image.type === 'single' ? (
          // 单图显示
          image.url ? (
            <>
              {/* 骨架屏 */}
              {!imageLoaded && (
                <div className="absolute inset-0 z-9">
                  <div className="w-full h-64 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
                    <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
                  </div>
                </div>
              )}
              
              {/* 实际图片 */}
              <motion.img
                src={image.url}
                alt={image.title || 'Image'}
                className={`w-full h-auto object-cover transition-all duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                } ${imageError ? 'hidden' : ''}`}
                loading="lazy"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              
              {/* 错误状态 */}
              {imageError && (
                <div className="w-full h-64 flex items-center justify-center bg-gray-100 text-gray-400">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">加载失败</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-gray-100 text-gray-400">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">暂无图片</p>
              </div>
            </div>
          )
        ) : (
          // 双图对比显示
          <div className="relative">
            {/* Before & After 标签
            <div className="absolute top-2 left-2 right-2 z-20 flex justify-between pointer-events-none">
              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                Before
              </div>
              <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                After
              </div>
            </div> */}
            
            {(() => {
              // 计算图片比例来决定布局方向
              const beforeImage = image.beforeImage;
              const afterImage = image.afterImage;
              
              // 如果有图片尺寸信息，计算平均宽高比
              let isHorizontalLayout = false; // 默认垂直布局（上下排列）
              
        
              
              if (beforeImage?.width && beforeImage?.height && afterImage?.width && afterImage?.height) {
                const beforeRatio = beforeImage.width / beforeImage.height;
                const afterRatio = afterImage.width / afterImage.height;
                const avgRatio = (beforeRatio + afterRatio) / 2;
                
                // 宽高比 > 1：宽图，使用水平布局（左右排列）
                // 宽高比 <= 1：长图或正方形，使用垂直布局（上下排列）
                isHorizontalLayout = avgRatio < 1;
              }
                
              
              
              const layoutClassName = `flex ${isHorizontalLayout ? 'flex-row' : 'flex-col'}`;
            
              return (
                <div className={`${layoutClassName} ${isHorizontalLayout ? 'h-full' : ''}` }>
                  {/* Before 图片 */}
                  <div className={`relative ${isHorizontalLayout ? 'flex-1' : ''}`}>
                {image.beforeImage?.url ? (
                  <>
                    {/* Before 骨架屏 */}
                    {!beforeLoaded && (
                      <div className="absolute inset-0 z-9">
                        <div className="w-full h-64 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
                          <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
                        </div>
                      </div>
                    )}
                    
                    {/* Before 实际图片 */}
                    <motion.img
                      src={image.beforeImage.url}
                      alt="Before"
                      className={`w-full ${isHorizontalLayout ? 'h-full' : 'h-auto'} object-cover transition-all duration-300 ${
                        beforeLoaded ? 'opacity-100' : 'opacity-0'
                      } ${beforeError ? 'hidden' : ''}`}
                      loading="lazy"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      onLoad={handleBeforeLoad}
                      onError={handleBeforeError}
                    />
                    
                    {/* Before 错误状态 */}
                    {beforeError && (
                      <div className=" h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs">加载失败</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs">暂无图片</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 分割线 */}
              <div className={`bg-white relative z-9 ${
                isHorizontalLayout 
                  ? 'w-px h-full mx-0' 
                  : 'h-px w-full my-0'
              }`}>
                <div className={`absolute inset-0 ${
                  isHorizontalLayout 
                    ? 'w-px h-full mx-1' 
                    : 'h-px w-full my-0'
                }`} />
              </div>
              
              {/* After 图片 */}
              <div className={`relative ${isHorizontalLayout ? 'flex-1' : ''}`}>
                {image.afterImage?.url ? (
                  <>
                    {/* After 骨架屏 */}
                    {!afterLoaded && (
                      <div className="absolute inset-0 z-10">
                        <div className="w-full h-64 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse">
                          <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
                        </div>
                      </div>
                    )}
                    
                    {/* After 实际图片 */}
                    <motion.img
                      src={image.afterImage.url}
                      alt="After"
                      className={`w-full ${isHorizontalLayout ? 'h-full' : 'h-auto'} object-cover transition-all duration-300 ${
                        afterLoaded ? 'opacity-100' : 'opacity-0'
                      } ${afterError ? 'hidden' : ''}`}
                      loading="lazy"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      onLoad={handleAfterLoad}
                      onError={handleAfterError}
                    />
                    
                    {/* After 错误状态 */}
                    {afterError && (
                      <div className="w-full h-64 flex items-center justify-center bg-gray-100 text-gray-400">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-xs">加载失败</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-64 flex items-center justify-center bg-gray-100 text-gray-400">
                    <div className="text-center">
                      <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs">暂无图片</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
              );
            })()}
          </div>
        )}
        
        {/* 悬停效果 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5  transition-all duration-300" />
      </div>
    </motion.div>
  );
});

export const WaterfallImageGrid = React.memo(function WaterfallImageGrid({
  images,
  onImageClick,
  loading = false,
  isEditMode = false,
  selectedImageIds = new Set(),
  onSelectImage,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
}: WaterfallImageGridProps) {
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
      (window as any).scrollTimer = setTimeout(
        () => setIsScrolling(false),
        150
      );
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
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 space-y-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: index * 0.05, 
              duration: 0.4,
              ease: "easeOut"
            }}
            className="break-inside-avoid mb-4"
          >
            <div className="bg-gray-200 animate-pulse rounded-xl overflow-hidden">
              <div
                className="w-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200"
                style={{ 
                  height: `${Math.random() * 200 + 200}px`
                }}
              />
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
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-gray-400"
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无图片</h3>
        <p className="text-gray-500 max-w-sm">
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
            className="fixed top-20 right-6 z-50 bg-white/80 backdrop-blur-sm border rounded-full p-2 shadow-lg"
          >
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 瀑布流布局 */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4">
        {images.map((image, index) => (
          <WaterfallImageCard
            key={image.id}
            image={image}
            onClick={onImageClick}
            index={index}
            isEditMode={isEditMode}
            isSelected={selectedImageIds.has(image.id)}
            onSelect={onSelectImage}
          />
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
            <div className="flex items-center gap-3 text-gray-500">
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
            <div className="text-center text-gray-500">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 13l4 4L19 7"
                  />
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