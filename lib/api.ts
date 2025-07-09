import { ImageData, Tag, DBResult } from '@/types';

// 客户端 API 调用类
export class ApiClient {
  // 获取所有图片
  static async getAllImages(): Promise<DBResult<ImageData[]>> {
    try {
      const response = await fetch('/api/images');
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: '网络请求失败',
      };
    }
  }

  // 添加图片
  static async addImage(imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBResult<ImageData>> {
    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageData),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('添加图片失败:', error);
      return {
        success: false,
        error: '网络请求失败',
      };
    }
  }

  // 更新图片
  static async updateImage(id: string, updates: Partial<ImageData>): Promise<DBResult<ImageData>> {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('更新图片失败:', error);
      return {
        success: false,
        error: '网络请求失败',
      };
    }
  }

  // 删除图片
  static async deleteImage(id: string): Promise<DBResult<void>> {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: '网络请求失败',
      };
    }
  }

  // 获取所有标签
  static async getAllTags(): Promise<DBResult<Tag[]>> {
    try {
      const response = await fetch('/api/tags');
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('获取标签失败:', error);
      return {
        success: false,
        error: '网络请求失败',
      };
    }
  }
}