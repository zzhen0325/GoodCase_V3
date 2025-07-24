import { getStorageInstance } from './firebase';
import { getAdminStorage } from './firebase-admin';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// 统一的图片存储服务
export class UnifiedImageStorageService {
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
          error.message.includes('文件类型') ||
          error.message.includes('DECODER routines::unsupported') ||
          error.code === 'ERR_OSSL_UNSUPPORTED'
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

  // 验证文件
  private static validateFile(file: File): void {
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
      throw new Error(
        `不支持的文件类型: ${file.type}。支持的类型: ${allowedTypes.join(', ')}`
      );
    }
  }

  // 生成文件路径
  private static generateFilePath(file: File, folder: string = 'images'): string {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    return `${folder}/${fileName}`;
  }

  // 客户端上传图片
  static async uploadImageClient(
    file: File,
    folder: string = 'images'
  ): Promise<string> {
    try {
      // 确保在客户端环境
      if (typeof window === 'undefined') {
        throw new Error('客户端上传只能在浏览器环境中进行');
      }

      this.validateFile(file);
      const filePath = this.generateFilePath(file, folder);

      console.log('客户端开始上传图片:', {
        fileName: filePath,
        fileSize: file.size,
        fileType: file.type,
      });

      // 使用重试机制上传
      return await this.retryUpload(async () => {
        // 创建存储引用
        const storageInstance = getStorageInstance();
        if (!storageInstance) {
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
        const snapshot = await uploadBytes(storageRef, file, metadata);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        console.log('客户端图片上传成功:', downloadURL);
        return downloadURL;
      });
    } catch (error: any) {
      console.error('客户端图片上传失败:', error);
      this.handleUploadError(error);
    }
  }

  // 服务端上传图片
  static async uploadImageServer(
    file: File,
    folder: string = 'images'
  ): Promise<string> {
    try {
      this.validateFile(file);
      const filePath = this.generateFilePath(file, folder);

      console.log('服务端开始上传图片:', {
        fileName: filePath,
        fileSize: file.size,
        fileType: file.type,
      });

      // 在重试循环外部先读取buffer，避免流被销毁的问题
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log('准备上传文件:', {
        bufferSize: buffer.length,
        fileType: file.type,
        fileName: file.name
      });

      // 使用重试机制上传
      return await this.retryUpload(async () => {
        // 每次重试都重新获取存储桶和文件引用，避免流被销毁的问题
        const storage = getAdminStorage();
        const bucket = storage.bucket();
        console.log('获取到bucket:', bucket.name);
        
        const fileRef = bucket.file(filePath);
        console.log('创建文件引用:', filePath);

        // 设置上传选项
        const options = {
          metadata: {
            contentType: file.type,
            metadata: {
              originalName: file.name,
              uploadTime: new Date().toISOString(),
            },
          },
          timeout: 30000, // 30秒超时
          resumable: false, // 禁用可恢复上传，避免某些编码问题
        };

        console.log('开始测试bucket权限');
        
        // 首先测试bucket是否存在和可访问
        try {
          const [exists] = await bucket.exists();
          console.log('Bucket存在状态:', exists);
          
          if (!exists) {
            console.log('尝试创建bucket');
            await bucket.create();
          }
        } catch (error) {
          console.error('Bucket访问错误:', error);
        }
        
        console.log('开始使用save方法上传文件');

        // 尝试使用传统的save方法
        await fileRef.save(buffer, options);
        console.log('文件保存完成');
        
        console.log('开始设置文件为公开访问');
        await fileRef.makePublic();

        // 生成公开访问URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        console.log('服务端图片上传成功:', publicUrl);
        return publicUrl;
      });
    } catch (error: any) {
      console.error('服务端图片上传失败:', error);
      this.handleUploadError(error);
    }
  }

  // 智能上传（自动选择客户端或服务端）
  static async uploadImage(
    file: File,
    folder: string = 'images'
  ): Promise<string> {
    if (typeof window !== 'undefined') {
      return this.uploadImageClient(file, folder);
    } else {
      return this.uploadImageServer(file, folder);
    }
  }

  // 删除图片
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      console.log('正在删除图片:', imageUrl);
      
      const filePath = this.extractFilePathFromUrl(imageUrl);
      console.log('提取的文件路径:', filePath);
      
      if (typeof window !== 'undefined') {
        // 客户端删除
        const storageInstance = getStorageInstance();
        if (!storageInstance) {
          throw new Error('Storage 未初始化');
        }
        const storageRef = ref(storageInstance, filePath);
        await deleteObject(storageRef);
      } else {
        // 服务端删除
        const storage = getAdminStorage();
        const bucket = storage.bucket();
        const file = bucket.file(filePath);
        await file.delete();
      }
      
      console.log('图片删除成功:', filePath);
    } catch (error: any) {
      console.error('图片删除失败:', error);
      throw new Error(`图片删除失败: ${error.message}`);
    }
  }

  // 从URL提取文件路径
  private static extractFilePathFromUrl(imageUrl: string): string {
    let filePath: string;
    
    if (imageUrl.startsWith('http')) {
      // 完整的HTTP URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.*?)(?:\?|$)/);
      
      if (!pathMatch) {
        throw new Error(`无效的图片URL格式: ${url.pathname}`);
      }
      
      filePath = decodeURIComponent(pathMatch[1]);
    } else if (imageUrl.startsWith('/')) {
      // 相对路径格式
      const pathMatch = imageUrl.match(/\/images\/(.*?)(?:\?|$)/);
      if (pathMatch) {
        filePath = `images/${pathMatch[1]}`;
      } else {
        filePath = imageUrl.substring(1);
        const segments = filePath.split('/');
        if (segments.length >= 2) {
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
    
    return filePath;
  }

  // 处理上传错误
  private static handleUploadError(error: any): never {
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
      throw error;
    } else if (
      error.message.includes('DECODER routines::unsupported') ||
      error.code === 'ERR_OSSL_UNSUPPORTED'
    ) {
      throw new Error('图片格式不受支持或文件已损坏，请尝试其他格式的图片');
    } else {
      throw new Error(`图片上传失败: ${error.message || '未知错误'}`);
    }
  }

  // 获取图片元数据（仅服务端）
  static async getImageMetadata(imageUrl: string) {
    if (typeof window !== 'undefined') {
      throw new Error('获取图片元数据只能在服务端进行');
    }

    try {
      const filePath = this.extractFilePathFromUrl(imageUrl);
      const storage = getAdminStorage();
      const bucket = storage.bucket();
      const file = bucket.file(filePath);

      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error('获取图片元数据失败:', error);
      throw new Error('获取图片元数据失败');
    }
  }
}

// 导出便捷函数
export const uploadImage = UnifiedImageStorageService.uploadImage;
export const deleteImage = UnifiedImageStorageService.deleteImage;
export const getImageMetadata = UnifiedImageStorageService.getImageMetadata;

// 向后兼容的导出
export { UnifiedImageStorageService as ImageStorageService };
export { UnifiedImageStorageService as ClientImageStorageService };
export { UnifiedImageStorageService as AdminImageStorageService };