"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ImageData } from '@/types';
import { Card } from '@/components/ui/card';
import Magnet from '@/components/magnet';

// 图片卡片组件属性
interface ImageCardProps {
  image: ImageData;
  onClick: (image: ImageData) => void;
  index: number;
}

// 图片卡片组件
export function ImageCard({ image, onClick, index }: ImageCardProps) {
  // 使用 Intersection Observer 检测元素是否进入视口
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // 简单淡入动画变体
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
        delay: index * 0.05, // 错开动画时间
        ease: "easeOut",
      },
    },
  };

  // hover动画变体
  const hoverVariants = {
    hover: {
      y: -4,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={{...cardVariants, ...hoverVariants}}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      whileHover="hover"
      className="cursor-pointer"
      onClick={() => onClick(image)}
    >
      <Magnet
        padding={40}
        magnetStrength={3}
        activeTransition="transform 0.2s ease-out"
        inactiveTransition="transform 0.4s ease-in-out"
      >
        <Card className="aspect-square overflow-hidden rounded-[2rem]   hover:shadow-xl transition-shadow duration-300">
          <div className="relative w-full h-full">
            {/* 图片容器 */}
            <div className="w-full h-full bg-muted rounded-[2rem] flex items-center justify-center relative">
              {image.url ? (
                inView ? (
                  <>
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover rounded-[2rem] transition-opacity duration-300"
                      loading="lazy"
                      onLoad={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorDiv = e.currentTarget.parentElement?.querySelector('.error-placeholder');
                        if (errorDiv) {
                          errorDiv.classList.remove('hidden');
                        }
                      }}
                      style={{ opacity: 0 }}
                    />
                    {/* 错误状态占位符 */}
                    <div className="error-placeholder hidden absolute inset-0 w-full h-full bg-muted rounded-[2rem] flex items-center justify-center text-muted-foreground text-sm">
                      图片加载失败
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-muted/50 rounded-[2rem] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  </div>
                )
              ) : (
                <div className="text-muted-foreground text-sm text-center p-4 rounded-[2rem]">
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
}