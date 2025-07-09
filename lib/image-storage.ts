import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

// 图片压缩配置
const COMPRESSION_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'webp'
};

// 压缩图片到指定格式和质量
export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算压缩后的尺寸
      let { width, height } = img;
      const { maxWidth, maxHeight } = COMPRESSION_CONFIG;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      // 设置画布尺寸
      canvas.width = width;
      canvas.height = height;
      
      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 转换为 WebP 格式
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('图片压缩失败'));
          }
        },
        `image/${COMPRESSION_CONFIG.format}`,
        COMPRESSION_CONFIG.quality
      );
    };
    
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
};

// 上传图片到 Firebase Storage
export const uploadImageToStorage = (
  file: File,
  filename: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 压缩图片
      const compressedBlob = await compressImage(file);
      
      // 生成存储路径
      const imagePath = `images/${filename}`;
      const storageRef = ref(storage, imagePath);
      
      // 创建上传任务
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, {
        contentType: `image/${COMPRESSION_CONFIG.format}`,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });
      
      // 监听上传进度
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          console.error('上传失败:', error);
          reject(error);
        },
        async () => {
          try {
            // 上传完成，获取下载 URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

// 从 Firebase Storage 删除图片
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    // 从 URL 中提取文件路径
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.*?)\?/);
    
    if (!pathMatch) {
      throw new Error('无效的图片 URL');
    }
    
    const filePath = decodeURIComponent(pathMatch[1]);
    const fileRef = ref(storage, filePath);
    
    await deleteObject(fileRef);
  } catch (error) {
    console.error('删除图片失败:', error);
    throw error;
  }
};

// 生成唯一的文件名
export const generateImageFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = COMPRESSION_CONFIG.format;
  
  // 清理原始文件名
  const cleanName = originalName
    .replace(/\.[^/.]+$/, '') // 移除扩展名
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') // 替换特殊字符
    .substring(0, 50); // 限制长度
  
  return `${cleanName}_${timestamp}_${randomId}.${extension}`;
};

// 验证文件类型
export const validateImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('不支持的文件格式，请选择 JPG、PNG、GIF 或 WebP 格式的图片');
  }
  
  if (file.size > maxSize) {
    throw new Error('文件大小超过限制，请选择小于 50MB 的图片');
  }
  
  return true;
};