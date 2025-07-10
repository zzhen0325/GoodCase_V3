import { ImageData, Tag, SearchFilters } from '@/types';

export class ApiClient {
  private static baseUrl = '/api';

  // 搜索图片（支持搜索词和标签过滤）
  static async searchImages(filters?: SearchFilters): Promise<ImageData[]> {
    const params = new URLSearchParams();
    
    if (filters?.query) {
      params.append('search', filters.query);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      params.append('tags', filters.tags.join(','));
    }
    
    const url = `${this.baseUrl}/images${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || '搜索图片失败');
    }
  }

  // 获取所有图片（兼容旧接口）
  static async getAllImages(): Promise<{ success: boolean; data?: ImageData[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/images`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取图片失败'
      };
    }
  }

  // 获取单个图片
  static async getImageById(id: string): Promise<ImageData> {
    const response = await fetch(`${this.baseUrl}/images/${id}`);
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || '获取图片失败');
    }
  }

  // 添加图片
  static async addImage(file: File, prompt: string, tags: string = ''): Promise<{ success: boolean; data?: ImageData; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', prompt);
      formData.append('tags', tags);

      const response = await fetch(`${this.baseUrl}/images`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to add image'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('添加图片失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '添加图片失败'
      };
    }
  }

  // 验证上传的图片URL
  static async validateUpload(imageUrl: string, metadata?: any): Promise<{ url: string; metadata: any }> {
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl, metadata }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || '验证上传失败');
    }
  }

  // 更新图片
  static async updateImage(id: string, imageData: Partial<Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; data?: ImageData; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageData),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('更新图片失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新图片失败'
      };
    }
  }

  // 删除图片（包括Storage中的文件）
  static async deleteImage(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/images/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除图片失败'
      };
    }
  }

  // 获取所有标签
  static async getAllTags(): Promise<{ success: boolean; data?: Tag[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取标签失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取标签失败'
      };
    }
  }

  // 添加标签
  static async addTag(tagData: Omit<Tag, 'id'>): Promise<{ success: boolean; data?: Tag; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tagData),
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('添加标签失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '添加标签失败'
      };
    }
  }
}