import { getStorageInstance } from './firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// 客户端图片上传服务
export class ImageStorageService {
  // 重试上传的辅助方法
  private static async retryUpload<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`上传尝试 ${attempt}/${maxRetries} 失败:`, error.message);

        // 如果是最后一次尝试，或者是不可重试的错误，直接抛出
        if (
          attempt === maxRetries ||
          error.code === 'storage/unauthorized' ||
          error.message.includes('文件大小') ||
          error.message.includes('文件类型')
        ) {
          throw error;
        }

        // 等待一段时间后重试（指数退避）
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // 上传图片到Firebase Storage
  static async uploadImage(
    file: File,
    folder: string = 'images'
  ): Promise<string> {
    try {
      // 确保在客户端环境
      if (typeof window === 'undefined') {
        throw new Error('图片上传只能在客户端环境中进行');
      }

      // 检查文件大小 (限制为 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('文件大小超过限制 (10MB)');
      }

      // 检查文件类型
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('不支持的文件类型');
      }

      // 生成唯一文件名
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;

      console.log('开始上传图片:', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
      });

      // 使用重试机制上传
      return await this.retryUpload(async () => {
        // 创建存储引用
        const storageInstance = getStorageInstance();
        if (!storageInstance) {
          console.error('Storage 初始化失败，请检查 Firebase 配置');
          throw new Error('Storage 未初始化，请刷新页面重试');
        }
        const storageRef = ref(storageInstance, filePath);

        // 设置上传元数据
        const metadata = {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            uploadTime: new Date().toISOString(),
          },
        };

        // 上传文件
        console.log('正在上传到 Firebase Storage...');
        const snapshot = await uploadBytes(storageRef, file, metadata);
        console.log('上传完成，获取下载URL...');

        // 获取下载URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('获取下载URL成功:', downloadURL);

        return downloadURL;
      });
    } catch (error: any) {
      console.error('图片上传失败:', error);

      // 根据错误类型提供更具体的错误信息
      if (error.code === 'storage/retry-limit-exceeded') {
        throw new Error('网络连接超时，请检查网络连接后重试');
      } else if (error.code === 'storage/unauthorized') {
        throw new Error('没有上传权限，请检查 Firebase Storage 规则');
      } else if (error.code === 'storage/canceled') {
        throw new Error('上传被取消');
      } else if (error.code === 'storage/unknown') {
        throw new Error('未知错误，请稍后重试');
      } else if (
        error.message.includes('文件大小') ||
        error.message.includes('文件类型')
      ) {
        throw error; // 重新抛出我们自定义的错误
      } else {
        throw new Error(`图片上传失败: ${error.message || '未知错误'}`);
      }
    }
  }

  // 删除图片
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      console.log('正在删除图片:', imageUrl);
      
      let filePath: string;
      
      // 处理不同的URL格式
      if (imageUrl.startsWith('http')) {
        // 完整的HTTP URL
        const url = new URL(imageUrl);
        
        // 支持多种Firebase Storage URL格式
        // 格式1: /v0/b/bucket/o/path?query
        // 格式2: /v0/b/bucket/o/path (无查询参数)
        let pathMatch = url.pathname.match(/\/o\/(.*?)(?:\?|$)/);
        
        if (!pathMatch) {
          console.log('URL pathname:', url.pathname);
          console.log('完整URL:', imageUrl);
          throw new Error(`无效的图片URL格式: ${url.pathname}`);
        }
        
        filePath = decodeURIComponent(pathMatch[1]);
      } else if (imageUrl.startsWith('/')) {
        // 相对路径格式，如: /perceptive-map-465407-s9.firebasestorage.app/images/xxx.png
        // 提取 images/ 后面的部分
        const pathMatch = imageUrl.match(/\/images\/(.*?)(?:\?|$)/);
        if (pathMatch) {
          filePath = `images/${pathMatch[1]}`;
        } else {
          // 如果没有 /images/ 前缀，直接使用去掉开头斜杠的路径
          filePath = imageUrl.substring(1);
          // 进一步处理，提取文件名部分
          const segments = filePath.split('/');
          if (segments.length >= 2) {
            // 假设格式是 domain/images/filename
            const imagesIndex = segments.indexOf('images');
            if (imagesIndex !== -1 && imagesIndex < segments.length - 1) {
              filePath = segments.slice(imagesIndex).join('/');
            }
          }
        }
      } else {
        // 直接的文件路径
        filePath = imageUrl;
      }
      
      console.log('提取的文件路径:', filePath);
      
      const storageInstance = getStorageInstance();
      if (!storageInstance) {
        throw new Error('Storage 未初始化');
      }
      const storageRef = ref(storageInstance, filePath);

      await deleteObject(storageRef);
      console.log('图片删除成功:', filePath);
    } catch (error: any) {
      console.error('图片删除失败:', error);
      
      // 如果是URL解析错误，提供更详细的错误信息
      if (error.message.includes('无效的图片URL')) {
        throw error;
      }
      
      throw new Error(`图片删除失败: ${error.message || '未知错误'}`);
    }
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
