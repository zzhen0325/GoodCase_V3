"use client"

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ImageData } from '@/types';
import { Card } from '@/components/ui/card';
import Magnet from '@/components/magnet';

// 磁力状态接口
interface MagnetState {
  index: number;
  position: { x: number; y: number };
  isActive: boolean;
}

// 图片卡片组件属性
interface ImageCardProps {
  image: ImageData;
  onClick: (image: ImageData) => void;
  index: number;
  onMagnetStateChange?: (index: number, state: Partial<MagnetState>) => void;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: (imageId: string, selected: boolean) => void;
}

// 预定义动画变体，避免每次渲染重新创建
const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const hoverVariants = {
  hover: {
    y: -4,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

// 图片卡片组件
export const ImageCard = React.memo(function ImageCard({ 
  image, 
  onClick, 
  index, 
  onMagnetStateChange, 
  isEditMode = false, 
  isSelected = false, 
  onSelect 
}: ImageCardProps) {
  // 使用 Intersection Observer 检测元素是否进入视口
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // 使用 useCallback 缓存点击处理函数
  const handleClick = useCallback(() => {
    if (isEditMode && onSelect) {
      // 编辑模式下切换选择状态
      onSelect(image.id, !isSelected);
    } else {
      // 正常模式下打开图片详情
      onClick(image);
    }
  }, [image, onClick, isEditMode, isSelected, onSelect]);

  // 使用 useMemo 缓存合并的动画变体
  const combinedVariants = useMemo(() => ({
    ...cardVariants,
    ...hoverVariants
  }), []);

  // 处理磁力状态变化
  const handleMagnetChange = useCallback((isActive: boolean, position: { x: number; y: number }) => {
    if (onMagnetStateChange) {
      onMagnetStateChange(index, {
        index,
        position,
        isActive
      });
    }
  }, [index, onMagnetStateChange]);

  return (
    <motion.div
      ref={ref}
      variants={combinedVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover="hover"
      className="cursor-pointer"
      onClick={handleClick}
    >
      <Magnet
        padding={40}
        magnetStrength={3}
        activeTransition="transform 0.2s ease-out"
        onStateChange={handleMagnetChange}
      >
        <Card className={`aspect-square overflow-hidden rounded-3xl hover:shadow-xl transition-all duration-300 ${
          isEditMode ? (isSelected ? 'border-8 border-white shadow-2xl' : 'border-6 border-gray-300') : ''
        }`}>
          <div className="relative w-full h-full">
            {/* 选择指示器 */}
            {isEditMode && (
              <div className="absolute top-2 right-2 z-10">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected 
                    ? 'bg-black border-black' 
                    : 'bg-white border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            )}
            
            {/* 图片容器 */}
            <div className="w-full h-full bg-muted rounded-3xl flex items-center justify-center">
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover  transition-all duration-300 hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="text-muted-foreground text-sm text-center p-4 rounded-2xl">
                  暂无图片
                </div>
              )}
            </div>
            
            {/* 图片信息覆盖层
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-medium text-sm truncate mb-1">
                  {image.title || '未命名图片'}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {image.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block px-2 py-1 text-xs bg-white/20 text-white rounded-full backdrop-blur-sm"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {image.tags.length > 3 && (
                    <span className="inline-block px-2 py-1 text-xs bg-white/20 text-white rounded-full backdrop-blur-sm">
                      +{image.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div> */}
          </div>
        </Card>
      </Magnet>
    </motion.div>
  );
});