import React from 'react';
import { FileImage } from 'lucide-react';
import { ImageData } from '@/types';

interface ImagePreviewProps {
  image: ImageData;
  onClose: () => void;
}

export function ImagePreview({ image, onClose }: ImagePreviewProps) {
  if (!image?.url) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8 relative bg-white">
        <div className="flex flex-col items-center justify-center text-center">
          <FileImage className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">图片加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-8 relative bg-white">
      <img
        src={image.url}
        alt={image.title || '图片'}
        className="max-w-full max-h-[calc(85vh-20rem)] object-contain rounded-2xl"
        loading="lazy"
      />
    </div>
  );
} 