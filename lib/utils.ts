import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { ImageData, SearchFilters } from '@/types';

// 合并CSS类名
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 生成随机ID
export function generateId(): string {
  // 使用浏览器兼容的UUID生成方法
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 降级方案：生成类似UUID的随机字符串
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 搜索和筛选图片
export function filterImages(images: ImageData[], filters: SearchFilters): ImageData[] {
  return images.filter(image => {
    // 搜索查询匹配
    const queryMatch = !filters.query || 
      image.title.toLowerCase().includes(filters.query.toLowerCase()) ||
      image.prompts.some(prompt => 
        (prompt.title && prompt.title.toLowerCase().includes(filters.query.toLowerCase())) ||
        (prompt.content && prompt.content.toLowerCase().includes(filters.query.toLowerCase()))
      ) ||
      image.tags.some(tag => 
        tag.name.toLowerCase().includes(filters.query.toLowerCase())
      );

    // 标签筛选匹配
    const tagMatch = filters.tags.length === 0 || 
      filters.tags.every(filterTag => 
        image.tags.some(imageTag => imageTag.id === filterTag.id)
      );

    return queryMatch && tagMatch;
  });
}

// 格式化日期
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// 文件大小格式化
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}