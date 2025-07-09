import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { SearchFilters } from '@/types';

// POST - 搜索图片
export async function POST(request: NextRequest) {
  try {
    const filters: SearchFilters = await request.json();
    
    // 获取所有图片数据
    const allImagesResult = await Database.getAllImages();
    
    if (!allImagesResult.success) {
      return NextResponse.json(
        { success: false, error: allImagesResult.error },
        { status: 500 }
      );
    }
    
    let filteredImages = allImagesResult.data || [];
    
    // 应用搜索过滤器
    if (filters.query && filters.query.trim()) {
      const query = filters.query.toLowerCase().trim();
      filteredImages = filteredImages.filter(image => {
        // 搜索标题
        const titleMatch = image.title.toLowerCase().includes(query);
        
        // 搜索提示词内容
        const promptMatch = image.prompts.some(prompt => 
          prompt.title.toLowerCase().includes(query) ||
          prompt.content.toLowerCase().includes(query)
        );
        
        // 搜索标签
        const tagMatch = image.tags.some(tag => 
          tag.name.toLowerCase().includes(query)
        );
        
        return titleMatch || promptMatch || tagMatch;
      });
    }
    
    // 按标签过滤
    if (filters.tags && filters.tags.length > 0) {
      filteredImages = filteredImages.filter(image => 
        filters.tags!.some(filterTag => 
          image.tags.some(imageTag => imageTag.id === filterTag.id)
        )
      );
    }
    
    // 按日期范围过滤
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      if (start) {
        filteredImages = filteredImages.filter(image => 
          new Date(image.createdAt) >= new Date(start)
        );
      }
      if (end) {
        filteredImages = filteredImages.filter(image => 
          new Date(image.createdAt) <= new Date(end)
        );
      }
    }
    
    // 排序
    if (filters.sortBy) {
      filteredImages.sort((a, b) => {
        switch (filters.sortBy) {
          case 'createdAt':
            return filters.sortOrder === 'asc' 
              ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'updatedAt':
            return filters.sortOrder === 'asc'
              ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
              : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          case 'title':
            return filters.sortOrder === 'asc'
              ? a.title.localeCompare(b.title)
              : b.title.localeCompare(a.title);
          case 'usageCount':
            return filters.sortOrder === 'asc'
              ? (a.usageCount || 0) - (b.usageCount || 0)
              : (b.usageCount || 0) - (a.usageCount || 0);
          default:
            return 0;
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: filteredImages,
      total: filteredImages.length
    });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json(
      { success: false, error: '搜索失败' },
      { status: 500 }
    );
  }
}