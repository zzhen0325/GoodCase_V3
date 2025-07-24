'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ImageData } from '@/types';
import { ImageCard } from './image-card';

interface OptimizedImageGridProps {
  images: ImageData[];
  onImageClick: (image: ImageData) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
}

// 虚拟滚动配置
const ITEM_HEIGHT = 300; // 每个图片卡片的高度
const BUFFER_SIZE = 5; // 缓冲区大小
const COLUMNS = 4; // 网格列数

// 优化的图片组件，支持懒加载和预加载
const OptimizedImageCard = React.memo(({ 
  image, 
  onClick, 
  index 
}: { 
  image: ImageData; 
  onClick: (image: ImageData) => void;
  index: number;
}) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
    rootMargin: '200px 0px', // 提前200px开始加载
  });

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 预加载图片
  useEffect(() => {
    if (inView && !imageLoaded && !imageError) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = image.url;
    }
  }, [inView, image.url, imageLoaded, imageError]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05 // 错开动画时间
      }}
      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
      onClick={() => onClick(image)}
      style={{ height: ITEM_HEIGHT }}
    >
      {inView && (
        <>
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-2xl mb-2">📷</div>
                <div className="text-sm">加载失败</div>
              </div>
            </div>
          )}
          
          {imageLoaded && (
            <img
              src={image.url}
              alt={image.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          )}
          
          {/* 覆盖层 */}
          
          

        </>
      )}
    </motion.div>
  );
});

OptimizedImageCard.displayName = 'OptimizedImageCard';

// 虚拟滚动Hook
function useVirtualScroll({
  items,
  itemHeight,
  containerHeight,
  bufferSize = 5
}: {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  bufferSize?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const itemsPerRow = COLUMNS;
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const totalHeight = totalRows * itemHeight;
  
  const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const endRow = Math.min(
    totalRows - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + bufferSize
  );
  
  const visibleItems = useMemo(() => {
    const result = [];
    for (let row = startRow; row <= endRow; row++) {
      const startIndex = row * itemsPerRow;
      const endIndex = Math.min(startIndex + itemsPerRow, items.length);
      for (let i = startIndex; i < endIndex; i++) {
        result.push({
          index: i,
          item: items[i],
          row,
          col: i % itemsPerRow,
          top: row * itemHeight
        });
      }
    }
    return result;
  }, [items, startRow, endRow, itemHeight, itemsPerRow]);
  
  return {
    visibleItems,
    totalHeight,
    setScrollTop
  };
}

export function OptimizedImageGrid({
  images,
  onImageClick,
  onLoadMore,
  hasMore = false,
  loading = false,
  className = ''
}: OptimizedImageGridProps) {
  const [containerHeight, setContainerHeight] = useState(800);
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  // 虚拟滚动
  const { visibleItems, totalHeight, setScrollTop } = useVirtualScroll({
    items: images,
    itemHeight: ITEM_HEIGHT,
    containerHeight,
    bufferSize: BUFFER_SIZE
  });

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, [setScrollTop]);

  // 加载更多
  useEffect(() => {
    if (inView && hasMore && !loading && onLoadMore) {
      onLoadMore();
    }
  }, [inView, hasMore, loading, onLoadMore]);

  // 响应式容器高度
  useEffect(() => {
    const updateHeight = () => {
      setContainerHeight(window.innerHeight - 200); // 减去头部和其他元素高度
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  if (images.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <div className="text-6xl mb-4">📷</div>
        <p className="text-lg">暂无图片</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 虚拟滚动容器 */}
      <div
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div 
            className="grid gap-4"
            style={{ 
              gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.map(({ index, item, top }) => (
              <div
                key={`${item.id}-${index}`}
                style={{
                  position: 'absolute',
                  top: top,
                  left: `${(index % COLUMNS) * (100 / COLUMNS)}%`,
                  width: `${100 / COLUMNS}%`,
                  padding: '0 8px'
                }}
              >
                <OptimizedImageCard
                  image={item}
                  onClick={onImageClick}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* 加载更多触发器 */}
        {hasMore && (
          <div ref={ref} className="h-20 flex items-center justify-center">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">加载中...</span>
              </div>
            ) : (
              <div className="text-gray-400">滚动加载更多</div>
            )}
          </div>
        )}
      </div>
      
      {/* 初始加载状态 */}
      {loading && images.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">加载图片中...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OptimizedImageGrid;