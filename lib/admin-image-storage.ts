import { adminStorage } from './firebase-admin';

// 服务端图片存储服务
export class AdminImageStorageService {
  // 服务端删除图片
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // 从URL中提取文件路径
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.*?)\?/);
      if (!pathMatch) {
        throw new Error('无效的图片URL');
      }
      
      const filePath = decodeURIComponent(pathMatch[1]);
      const bucket = adminStorage.bucket();
      const file = bucket.file(filePath);
      
      await file.delete();
    } catch (error) {
      console.error('服务端图片删除失败:', error);
      throw new Error('服务端图片删除失败');
    }
  }
  
  // 获取图片元数据
  static async getImageMetadata(imageUrl: string) {
    try {
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.*?)\?/);
      if (!pathMatch) {
        throw new Error('无效的图片URL');
      }
      
      const filePath = decodeURIComponent(pathMatch[1]);
      const bucket = adminStorage.bucket();
      const file = bucket.file(filePath);
      
      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error('获取图片元数据失败:', error);
      throw new Error('获取图片元数据失败');
    }
  }
}