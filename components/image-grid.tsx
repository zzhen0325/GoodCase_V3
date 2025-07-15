"use client"

import React, { useState, useCallback } from 'react';
import { ImageData } from '@/types';
import { gridConfig, getGridColumnsClass } from '@/lib/utils';
import { ImageCard } from './image-card';

interface ImageGridProps {
  images: ImageData[];
  onImageClick: (image: ImageData) => void;
  loading?: boolean;
  isEditMode?: boolean;
  selectedImageIds?: Set<string>;
  onSelectImage?: (imageId: string, selected: boolean) => void;
  isCompact?: boolean;
}

export const ImageGrid = React.memo(function ImageGrid({ 
  images, 
  onImageClick, 
  loading = false, 
  isEditMode = false, 
  selectedImageIds = new Set(), 
  onSelectImage,
  isCompact = false 
}: ImageGridProps) {
  // 加载状态
  if (loading) {
    return (
      <div className="grid ${getGridColumnsClass()} gap-${gridConfig.gap}">
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
    <div className={`grid gap-8 ${
      isCompact 
        ? 'grid-cols-1' 
        : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
    }`}>
      {images.map((image, index) => (
        <ImageCard
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
  );
});