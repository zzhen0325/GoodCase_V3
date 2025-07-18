import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { initializeStorage } from '@/lib/firebase';

// 客户端图片存储服务
export class ClientImageStorageService {
  // 客户端上传图片
  static async uploadImage(
    file: File,
    folder: string = 'images'
  ): Promise<string> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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
        console.log('客户端文件类型检查:', {
          fileName: file.name,
          fileType: file.type,
          allowedTypes,
        });
        if (!allowedTypes.includes(file.type)) {
          throw new Error(
            `不支持的文件类型: ${file.type}。支持的类型: ${allowedTypes.join(', ')}`
          );
        }

        // 生成唯一文件名
        const fileExtension = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `${folder}/${fileName}`;

        console.log(`客户端开始上传图片 (尝试 ${attempt}/${maxRetries}):`, {
          fileName,
          fileSize: file.size,
          fileType: file.type,
        });

        // 获取Storage实例（确保先初始化）
        const storage = initializeStorage();
        if (!storage) {
          throw new Error('Firebase Storage 初始化失败');
        }
        const storageRef = ref(storage, filePath);

        // 设置元数据
        const metadata = {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            uploadTime: new Date().toISOString(),
          },
        };

        // 上传文件
        const snapshot = await uploadBytes(storageRef, file, metadata);
        console.log('客户端文件上传成功:', snapshot.metadata.fullPath);

        // 获取下载URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('客户端图片上传成功:', downloadURL);

        return downloadURL;
      } catch (error: any) {
        lastError = error;
        console.error(
          `客户端图片上传失败 (尝试 ${attempt}/${maxRetries}):`,
          error
        );

        // 如果是网络错误且还有重试机会，则继续重试
        if (
          (error.code === 'storage/retry-limit-exceeded' ||
            error.code === 'storage/unknown' ||
            error.message?.includes('network') ||
            error.message?.includes('ECONNRESET')) &&
          attempt < maxRetries
        ) {
          console.log(`网络错误，${2000 * attempt}ms后重试...`);
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
          continue;
        }

        // 如果不是网络错误或已达到最大重试次数，直接抛出错误
        break;
      }
    }

    throw new Error(`客户端图片上传失败: ${lastError?.message || '未知错误'}`);
  }

  // 客户端删除图片
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      const storage = getStorage();
      const imageRef = ref(storage, imageUrl);
      // 注意：客户端SDK不支持直接删除，需要通过服务端API
      console.warn('客户端不支持直接删除图片，请使用服务端API');
    } catch (error) {
      console.error('客户端图片删除失败:', error);
      throw new Error('客户端图片删除失败');
    }
  }
}
