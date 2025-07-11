"use client"

import React, { useState, useCallback } from 'react';
import { ImageData } from '@/types';
import { ImageCard } from './image-card';

// 磁力状态接口
interface MagnetState {
  index: number;
  position: { x: number; y: number };
  isActive: boolean;
}

// 图片网格组件属性
interface ImageGridProps {
  images: ImageData[];
  onImageClick: (image: ImageData) => void;
  loading?: boolean;
  isEditMode?: boolean;
  selectedImageIds?: Set<string>;
  onSelectImage?: (imageId: string, selected: boolean) => void;
}

// 图片网格组件
export const ImageGrid = React.memo(function ImageGrid({ 
  images, 
  onImageClick, 
  loading = false, 
  isEditMode = false, 
  selectedImageIds = new Set(), 
  onSelectImage 
}: ImageGridProps) {
  // 全局磁力状态管理
  const [magnetStates, setMagnetStates] = useState<Map<number, MagnetState>>(new Map());

  // 更新磁力状态的回调函数
  const updateMagnetState = useCallback((index: number, state: Partial<MagnetState>) => {
    setMagnetStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(index) || { index, position: { x: 0, y: 0 }, isActive: false };
      newStates.set(index, { ...currentState, ...state });
      return newStates;
    });
  }, []);

  // 计算周围图片的偏移量
  const calculateNearbyOffset = useCallback((currentIndex: number) => {
    const activeMagnet = Array.from(magnetStates.values()).find(state => state.isActive && state.index !== currentIndex);
    if (!activeMagnet) return { x: 0, y: 0 };

    // 计算网格位置 - 使用最大列数进行计算
    const cols = 5; // 3xl:grid-cols-5
    const currentRow = Math.floor(currentIndex / cols);
    const currentCol = currentIndex % cols;
    const activeRow = Math.floor(activeMagnet.index / cols);
    const activeCol = activeMagnet.index % cols;

    // 计算距离和方向
    const rowDiff = currentRow - activeRow;
    const colDiff = currentCol - activeCol;
    const distance = Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);

    // 只影响相邻的图片（距离小于等于2）
    if (distance > 2) return { x: 0, y: 0 };

    // 计算推斥力（距离越近，推斥力越强）
    const force = Math.max(0, (2 - distance) / 2) * 15;
    const offsetX = colDiff !== 0 ? (colDiff / Math.abs(colDiff)) * force : 0;
    const offsetY = rowDiff !== 0 ? (rowDiff / Math.abs(rowDiff)) * force : 0;

    return { x: offsetX, y: offsetY };
  }, [magnetStates]);
  // 加载状态
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 gap-20">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square bg-muted animate-pulse rounded-2xl"
          />
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 gap-20">
      {images.map((image, index) => {
        const nearbyOffset = calculateNearbyOffset(index);
        return (
          <div
            key={image.id}
            style={{
              transform: `translate3d(${nearbyOffset.x}px, ${nearbyOffset.y}px, 0)`,
              transition: 'transform 0.3s ease-out'
            }}
          >
            <ImageCard
              image={image}
              onClick={onImageClick}
              index={index}
              onMagnetStateChange={updateMagnetState}
              isEditMode={isEditMode}
              isSelected={selectedImageIds.has(image.id)}
              onSelect={onSelectImage}
            />
          </div>
        );
      })}
    </div>
  );
});