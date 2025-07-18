import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ImageData, SearchFilters } from '@/types';

// 合并CSS类名
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 生成随机ID
export function generateId(): string {
  // 使用浏览器兼容的UUID生成方法
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // 降级方案：生成类似UUID的随机字符串
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 格式化日期
export function formatDate(date: Date | string | number): string {
  try {
    const dateObj = new Date(date);
    
    // 检查日期是否有效
    if (isNaN(dateObj.getTime())) {
      return '无效日期';
    }
    
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '无效日期';
  }
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
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案：使用传统的复制方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
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
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 图片筛选函数 - 优化版
export function filterImages(
  images: ImageData[],
  filters: SearchFilters
): ImageData[] {
  let filtered = [...images];

  // 文本搜索 - 支持多字段搜索
  if (filters.query && filters.query.trim()) {
    const query = filters.query.toLowerCase().trim();
    const searchTerms = query.split(/\s+/); // 支持多关键词搜索

    filtered = filtered.filter((image) => {
      const searchableText = [
        image.title,
        image.prompts?.[0]?.content || '',
        ...image.tags.map(tag => typeof tag === 'string' ? tag : tag.name),
      ]
        .join(' ')
        .toLowerCase();

      // 所有搜索词都必须匹配（AND逻辑）
      return searchTerms.every((term) => searchableText.includes(term));
    });
  }

  // 标签筛选 - 支持多标签筛选
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((image) =>
      filters.tags.some((filterTag) => 
        image.tags.some(imageTag => 
          typeof imageTag === 'string' ? imageTag === filterTag : imageTag.name === filterTag
        )
      )
    );
  }

  // 日期范围筛选
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    filtered = filtered.filter((image) => {
      const imageDate = new Date(image.createdAt);
      return imageDate >= start && imageDate <= end;
    });
  }

  // 尺寸范围筛选 - 暂时跳过，因为 ImageData 没有 size 属性
  // if (filters.sizeRange) {
  //   const { minWidth, maxWidth, minHeight, maxHeight } = filters.sizeRange;
  //   filtered = filtered.filter((image) => {
  //     // ImageData 类型中没有 size 属性
  //     return true;
  //   });
  // }

  // 排序 - 支持更多排序字段
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case 'size':
          // ImageData 类型中没有 size 属性，使用默认排序
          aValue = 0;
          bValue = 0;
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
  }

  return filtered;
}

// 高性能搜索函数 - 使用索引和缓存
export function searchImagesOptimized(
  images: ImageData[],
  query: string,
  options: {
    fuzzy?: boolean;
    maxResults?: number;
    threshold?: number;
  } = {}
): ImageData[] {
  if (!query.trim()) return images;

  const { fuzzy = false, maxResults = 100, threshold = 0.6 } = options;
  const searchTerms = query.toLowerCase().trim().split(/\s+/);

  const results = images
    .map((image) => {
      const searchableText = [
        image.title,
        image.prompts?.[0]?.content || '',
        ...image.tags.map(tag => typeof tag === 'string' ? tag : tag.name),
      ]
        .join(' ')
        .toLowerCase();

      let score = 0;

      if (fuzzy) {
        // 模糊搜索评分
        searchTerms.forEach((term) => {
          if (searchableText.includes(term)) {
            score += 1;
          } else {
            // 简单的编辑距离评分
            const words = searchableText.split(/\s+/);
            const bestMatch = words.reduce((best, word) => {
              const similarity = calculateSimilarity(term, word);
              return similarity > best ? similarity : best;
            }, 0);
            score += bestMatch;
          }
        });
        score = score / searchTerms.length;
      } else {
        // 精确搜索
        const matchCount = searchTerms.filter((term) =>
          searchableText.includes(term)
        ).length;
        score = matchCount / searchTerms.length;
      }

      return { image, score };
    })
    .filter((result) => result.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((result) => result.image);

  return results;
}

// 计算字符串相似度（简化版）
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// 计算编辑距离
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
