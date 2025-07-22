import React from 'react';
import { FileImage } from 'lucide-react';
import type { ImageData } from '@/types';

export interface ImagePreviewProps {
  image: ImageData;
  onClose: () => void;
}

export function ImagePreview({ image }: ImagePreviewProps) {
  if (!image?.url) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 relative bg-white">
        <div className="flex flex-col items-center justify-center text-center">
          <FileImage className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">暂无图片</p>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center p-8 relative bg-white">
      <img
        src={image.url}
        alt={image.title || '图片'}
        className="max-w-full max-h-[calc(85vh-8rem)] object-contain rounded-2xl"
        loading="lazy"
      />
    </div>
  );
}
