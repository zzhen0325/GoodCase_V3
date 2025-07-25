'use client';

import React from 'react';
import { WaterfallImageGrid } from './waterfall-image-grid';
import { ImageData } from '@/types';

// 示例：如何使用新的瀑布流组件
export function WaterfallExample() {
  // 示例图片数据
  const sampleImages: ImageData[] = [
    {
      id: '1',
      storagePath: 'images/sample1.jpg',
      url: 'https://picsum.photos/300/400?random=1',
      name: '示例图片 1',
      title: '示例图片 1',
      tags: [],
      promptBlocks: [],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      storagePath: 'images/sample2.jpg', 
      url: 'https://picsum.photos/300/600?random=2',
      name: '示例图片 2',
      title: '示例图片 2',
      tags: [],
      promptBlocks: [],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      storagePath: 'images/sample3.jpg',
      url: 'https://picsum.photos/300/350?random=3', 
      name: '示例图片 3',
      title: '示例图片 3',
      tags: [],
      promptBlocks: [],
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // 更多示例图片...
  ];

  const handleImageClick = (image: ImageData) => {
    console.log('点击图片:', image);
    // 这里可以打开图片详情模态框
  };

  const handleLoadMore = () => {
    console.log('加载更多图片');
    // 这里可以加载更多图片数据
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">瀑布流图片展示</h1>
      
      <WaterfallImageGrid
        images={sampleImages}
        onImageClick={handleImageClick}
        loading={false}
        hasMore={true}
        onLoadMore={handleLoadMore}
        loadingMore={false}
      />
    </div>
  );
}

/*
使用说明：

1. 新的 WaterfallImageGrid 组件特点：
   - 使用 CSS columns 实现真正的瀑布流布局
   - 响应式设计：1-6列自适应
   - 纯图片展示，无额外信息和蒙层
   - 保留编辑模式和选择功能
   - 优化的加载动画和骨架屏
   - 平滑的悬停效果

2. 与原有组件的区别：
   - 原 ImageGrid: 使用 CSS Grid，固定宽度
   - 新 WaterfallImageGrid: 使用 CSS columns，真正瀑布流
   - 移除了图片信息显示区域（标题、标签等）
   - 移除了复杂的蒙层效果
   - 更简洁的视觉设计

3. 如何替换现有组件：
   将 ImageGrid 替换为 WaterfallImageGrid 即可，API 基本兼容

4. 响应式断点：
   - 1列: 默认（小屏幕）
   - 2列: sm (640px+)
   - 3列: md (768px+) 
   - 4列: lg (1024px+)
   - 5列: xl (1280px+)
   - 6列: 2xl (1536px+)
*/