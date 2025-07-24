'use client';

import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ImageData } from '@/types';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ImageCardProps {
  image: ImageData;
  onClick: (image: ImageData) => void;
  index: number;
  isEditMode?: boolean;
  isSelected?: boolean;
  onSelect?: (imageId: string, selected: boolean) => void;
}

const animationVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
  hover: {
    y: -4,
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
};

export const ImageCard = React.memo(function ImageCard({
  image,
  onClick,
  index,
  isEditMode = false,
  isSelected = false,
  onSelect,
}: ImageCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // 当图片URL变化时重置加载状态
  React.useEffect(() => {
    setImageLoaded(false);
  }, [image.url]);

  const handleClick = useCallback(() => {
    if (isEditMode && onSelect) {
      onSelect(image.id, !isSelected);
    } else {
      onClick(image);
    }
  }, [image, onClick, isEditMode, isSelected, onSelect]);

  const cardClassName = `w-full overflow-hidden rounded-2xl transition-all duration-300 cursor-pointer bg-white hover:shadow-xl ${
    isEditMode
      ? isSelected
        ? 'ring-2 ring-blue-500 shadow-2xl scale-95'
        : 'ring-1 ring-gray-300'
      : ''
  }`;

  return (
    <motion.div
      ref={ref}
      variants={animationVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      whileHover="hover"
      className="group relative w-full"
    >
      <Card className={cardClassName} onClick={handleClick}>
        <div className="relative w-full">
          {isEditMode && (
            <div className="absolute top-3 right-3 z-10">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center backdrop-blur-sm transition-all duration-300 shadow-md ${
                  isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white/80 border-gray-300'
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

          <div className="w-full rounded-2xl relative overflow-hidden bg-muted/20">
            {image.url ? (
              <React.Fragment>
                {!imageLoaded && (
                  <div className="absolute inset-0 z-10">
                    <Skeleton className="w-full h-64 rounded-2xl" />
                  </div>
                )}
                <motion.img
                  key="image"
                  src={image.url}
                  alt={image.title || 'Image'}
                  className={`w-full h-auto object-cover transition-all duration-300 relative z-20 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  loading="lazy"
                  whileHover={imageLoaded ? { scale: 1.05 } : {}}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                />
              </React.Fragment>
            ) : (
              <div className="text-gray-400 text-xs text-center p-8">
                No Image
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
});
