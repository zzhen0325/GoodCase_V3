import {
  ImageData,
  Tag,
  TagCategory,
  DBResult,
  SearchFilters,
  SearchResult,
  Pagination,
  BatchResult,
  UploadValidationResult,
  FileUploadOptions,
} from '@/types';

class ApiClient {
  private static instance: ApiClient | null = null;
  private baseUrl = '/api';

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // ==================== 图片相关 ====================

  // 获取所有图片（支持分页）
  async getAllImages(pagination?: { page?: number; limit?: number }): Promise<DBResult<{ data: ImageData[]; pagination: any }>> {
    try {
      const params = new URLSearchParams();
      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit) params.append('limit', pagination.limit.toString());
      
      const url = `${this.baseUrl}/images${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '获取图片失败',
          
        };
      }

      return {
        ...result,
        
      };
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: '网络错误',
        
      };
    }
  }

  // 根据ID获取图片
  async getImageById(id: string): Promise<DBResult<ImageData | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/images/${id}`);
      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '获取图片失败',
          
        };
      }

      return {
        ...result,
        
      };
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: '网络错误',
        
      };
    }
  }

  // 搜索图片
  async searchImages(
    filters: SearchFilters,
    pagination?: Pagination
  ): Promise<SearchResult> {
    try {
      const params = new URLSearchParams();

      if (filters.query) params.append('query', filters.query);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.dateRange?.start)
        params.append('dateStart', filters.dateRange.start.toISOString());
      if (filters.dateRange?.end)
        params.append('dateEnd', filters.dateRange.end.toISOString());
      if (filters.sizeRange?.minWidth)
        params.append('minWidth', filters.sizeRange.minWidth.toString());
      if (filters.sizeRange?.maxWidth)
        params.append('maxWidth', filters.sizeRange.maxWidth.toString());
      if (filters.sizeRange?.minHeight)
        params.append('minHeight', filters.sizeRange.minHeight.toString());
      if (filters.sizeRange?.maxHeight)
        params.append('maxHeight', filters.sizeRange.maxHeight.toString());

      if (pagination?.page) params.append('page', pagination.page.toString());
      if (pagination?.limit)
        params.append('limit', pagination.limit.toString());

      const response = await fetch(`${this.baseUrl}/images/search?${params}`);
      const result = await response.json();

      if (!response.ok) {
        return {
          images: [],
          page: 1,
          limit: 20,
          total: 0,
          hasNext: false,
          hasPrev: false,
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }

      return {
        ...result,
        
      };
    } catch (error) {
      console.error('搜索图片失败:', error);
      return {
        images: [],
        page: 1,
        limit: 20,
        total: 0,
        hasNext: false,
        hasPrev: false,
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  }

  // 添加图片
  async addImage(
    imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DBResult<ImageData>> {
    try {
      const response = await fetch(`${this.baseUrl}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageData),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '添加图片失败',
          
        };
      }

      return {
        ...result,
        
      };
    } catch (error) {
      console.error('添加图片失败:', error);
      return {
        success: false,
        error: '网络错误',
        
      };
    }
  }

  // 更新图片
  async updateImage(
    id: string,
    updates: Partial<ImageData>
  ): Promise<DBResult<ImageData>> {
    try {
      const response = await fetch(`${this.baseUrl}/images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '更新图片失败',
          
        };
      }

      return {
        ...result,
        
      };
    } catch (error) {
      console.error('更新图片失败:', error);
      return {
        success: false,
        error: '网络错误',
        
      };
    }
  }

  // 删除图片
  async deleteImage(id: string): Promise<DBResult<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/images/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '删除图片失败',
          
        };
      }

      return {
        ...result,
        
      };
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: '网络错误',
        
      };
    }
  }

  // 批量删除图片
  async deleteImages(ids: string[]): Promise<BatchResult> {
    try {
      const response = await fetch(`${this.baseUrl}/images/batch`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          successCount: 0,
          failedCount: ids.length,
          results: ids.map((id) => ({
            id,
            success: false,
            error: result.error || '批量删除失败',
          })),
        };
      }

      return result;
    } catch (error) {
      console.error('批量删除图片失败:', error);
      const errorMessage = '网络错误';
      return {
        successCount: 0,
        failedCount: ids.length,
        results: ids.map((id) => ({
          id,
          success: false,
          error: errorMessage,
        })),
      };
    }
  }

  // ==================== 文件上传相关 ====================

  // 验证上传
  async validateUpload(
    file: File,
    options?: FileUploadOptions
  ): Promise<UploadValidationResult> {
    const maxSize = options?.maxSize || 10 * 1024 * 1024; // 默认10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        errors: ['不支持的文件类型'],
        warnings: [],
      };
    }

    // 检查文件大小
    if (file.size > maxSize) {
      return {
        isValid: false,
        errors: [`文件大小不能超过${Math.round(maxSize / 1024 / 1024)}MB`],
        warnings: [],
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
    };
  }

  // 上传文件
  async uploadFile(
    file: File,
    options?: FileUploadOptions
  ): Promise<DBResult<{ url: string; thumbnailUrl?: string }>> {
    try {
      // 先验证文件
      const validation = await this.validateUpload(file, options);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ') || '文件验证失败',
          
        };
      }

      const formData = new FormData();
      formData.append('file', file);

      if ((options as any)?.generateThumbnail) {
        formData.append('thumbnail', 'true');
      }

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || '上传失败',
          
        };
      }

      return {
        ...result,
        
      };
    } catch (error) {
      console.error('上传文件失败:', error);
      return {
        success: false,
        error: '网络错误',
        
      };
    }
  }


}

export const apiClient = ApiClient.getInstance();
export default apiClient;
