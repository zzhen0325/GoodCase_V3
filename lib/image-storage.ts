import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// 客户端图片上传服务
export class ImageStorageService {
  // 重试上传的辅助方法
  private static async retryUpload<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        console.warn(`上传尝试 ${attempt}/${maxRetries} 失败:`, error.message);
        
        // 如果是最后一次尝试，或者是不可重试的错误，直接抛出
        if (attempt === maxRetries || 
            error.code === 'storage/unauthorized' || 
            error.message.includes('文件大小') || 
            error.message.includes('文件类型')) {
          throw error;
        }
        
        // 等待一段时间后重试（指数退避）
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // 上传图片到Firebase Storage
  static async uploadImage(file: File, folder: string = 'images'): Promise<string> {
    try {
      // 检查文件大小 (限制为 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('文件大小超过限制 (10MB)');
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('不支持的文件类型');
      }

      // 生成唯一文件名
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;
      
      console.log('开始上传图片:', { fileName, fileSize: file.size, fileType: file.type });
      
      // 使用重试机制上传
      return await this.retryUpload(async () => {
        // 创建存储引用
        const storageRef = ref(storage, filePath);
        
        // 设置上传元数据
        const metadata = {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            uploadTime: new Date().toISOString()
          }
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
      } else if (error.message.includes('文件大小') || error.message.includes('文件类型')) {
        throw error; // 重新抛出我们自定义的错误
      } else {
        throw new Error(`图片上传失败: ${error.message || '未知错误'}`);
      }
    }
  }
  
  // 删除图片
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // 从URL中提取文件路径
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.*?)\?/);
      if (!pathMatch) {
        throw new Error('无效的图片URL');
      }
      
      const filePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, filePath);
      
      await deleteObject(storageRef);
    } catch (error) {
      console.error('图片删除失败:', error);
      throw new Error('图片删除失败');
    }
  }
  
  // 批量上传图片
  static async uploadMultipleImages(files: File[], folder: string = 'images'): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => this.uploadImage(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('批量图片上传失败:', error);
      throw new Error('批量图片上传失败');
    }
  }
}