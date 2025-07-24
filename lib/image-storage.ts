// 此文件已被重构，请使用 unified-image-storage.ts
// 为了保持向后兼容性，重新导出统一存储服务的功能

import { UnifiedImageStorageService } from './unified-image-storage';

// 重新导出以保持向后兼容
/** @deprecated 请使用 unified-image-storage.ts 中的 UnifiedImageStorageService */
export class ImageStorageService {
  // 重新导出统一存储服务的方法
  static async uploadImage(
    file: File,
    folder: string = 'images'
  ): Promise<string> {
    return UnifiedImageStorageService.uploadImageClient(file, folder);
  }

  // 删除图片
  static async deleteImage(imageUrl: string): Promise<void> {
    return UnifiedImageStorageService.deleteImage(imageUrl);
  }

  // 批量上传图片
  static async uploadMultipleImages(
    files: File[],
    folder: string = 'images'
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadImage(file, folder)
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('批量图片上传失败:', error);
      throw new Error('批量图片上传失败');
    }
  }
}

// 导出便捷函数
export const uploadImage = ImageStorageService.uploadImage.bind(ImageStorageService);
export const deleteImage = ImageStorageService.deleteImage.bind(ImageStorageService);

// 重新导出统一存储服务
export { UnifiedImageStorageService } from './unified-image-storage';
