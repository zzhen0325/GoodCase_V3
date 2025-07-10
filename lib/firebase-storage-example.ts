/**
 * Firebase Storage 完整实现示例
 * 基于官方文档: https://firebase.google.com/docs/storage/web/
 */

import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  getMetadata,
  updateMetadata,
  listAll,
  getBytes,
  getBlob
} from 'firebase/storage';
import { firebaseManager } from './firebase';

// 上传元数据接口
interface UploadMetadata {
  contentType?: string;
  customMetadata?: { [key: string]: string };
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
  contentLanguage?: string;
}

// 上传进度回调接口
interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  state: 'paused' | 'running' | 'success' | 'canceled' | 'error';
}

/**
 * 文件上传类 - 支持多种上传方式
 */
export class FirebaseStorageUploader {
  
  /**
   * 简单文件上传 (适用于小文件)
   * @param file 要上传的文件
   * @param path 存储路径
   * @param metadata 可选的元数据
   * @returns Promise<string> 下载URL
   */
  static async uploadFile(
    file: File, 
    path: string, 
    metadata?: UploadMetadata
  ): Promise<string> {
    try {
      const storage = await firebaseManager.getStorage();
      const storageRef = ref(storage, path);
      
      // 使用 uploadBytes 进行简单上传
      const snapshot = await uploadBytes(storageRef, file, metadata);
      
      // 获取下载URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('文件上传成功:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('文件上传失败:', error);
      throw new Error(`上传失败: ${error}`);
    }
  }
  
  /**
   * 可恢复文件上传 (适用于大文件，支持进度监控)
   * @param file 要上传的文件
   * @param path 存储路径
   * @param onProgress 进度回调函数
   * @param metadata 可选的元数据
   * @returns Promise<string> 下载URL
   */
  static async uploadFileResumable(
    file: File,
    path: string,
    onProgress?: (progress: UploadProgress) => void,
    metadata?: UploadMetadata
  ): Promise<string> {
    try {
      const storage = await firebaseManager.getStorage();
      const storageRef = ref(storage, path);
      
      // 创建可恢复上传任务
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // 监听上传进度
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state as any
            };
            
            onProgress?.(progress);
            
            // 计算进度百分比
            const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`上传进度: ${percent.toFixed(2)}%`);
          },
          (error) => {
            // 处理上传错误
            console.error('上传过程中发生错误:', error);
            reject(new Error(`上传失败: ${error.message}`));
          },
          async () => {
            // 上传完成
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('文件上传完成:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              reject(new Error(`获取下载URL失败: ${error}`));
            }
          }
        );
      });
    } catch (error) {
      console.error('创建上传任务失败:', error);
      throw new Error(`上传失败: ${error}`);
    }
  }
  
  /**
   * 上传字符串数据
   * @param data 字符串数据
   * @param path 存储路径
   * @param format 数据格式 ('raw', 'base64', 'base64url', 'data_url')
   * @param metadata 可选的元数据
   * @returns Promise<string> 下载URL
   */
  static async uploadString(
    data: string,
    path: string,
    format: 'raw' | 'base64' | 'base64url' | 'data_url' = 'raw',
    metadata?: UploadMetadata
  ): Promise<string> {
    try {
      const storage = await firebaseManager.getStorage();
      const storageRef = ref(storage, path);
      
      // 使用 uploadString 上传字符串数据
      const { uploadString } = await import('firebase/storage');
      const snapshot = await uploadString(storageRef, data, format, metadata);
      
      // 获取下载URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('字符串数据上传成功:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('字符串数据上传失败:', error);
      throw new Error(`上传失败: ${error}`);
    }
  }
}

/**
 * 文件下载类
 */
export class FirebaseStorageDownloader {
  
  /**
   * 获取文件下载URL
   * @param path 文件路径
   * @returns Promise<string> 下载URL
   */
  static async getDownloadURL(path: string): Promise<string> {
    try {
      const storage = await firebaseManager.getStorage();
      const storageRef = ref(storage, path);
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log('获取下载URL成功:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('获取下载URL失败:', error);
      throw new Error(`获取下载URL失败: ${error}`);
    }
  }
  
  /**
   * 下载文件为字节数组
   * @param path 文件路径
   * @param maxDownloadSizeBytes 最大下载大小（字节）
   * @returns Promise<ArrayBuffer> 文件数据
   */
  static async downloadAsBytes(
    path: string, 
    maxDownloadSizeBytes?: number
  ): Promise<ArrayBuffer> {
    try {
      const storage = await firebaseManager.getStorage();
      const storageRef = ref(storage, path);
      
      const arrayBuffer = await getBytes(storageRef, maxDownloadSizeBytes);
      console.log('文件下载成功 (字节数组):', arrayBuffer.byteLength, 'bytes');
      return arrayBuffer;
    } catch (error) {
      console.error('下载文件失败:', error);
      throw new Error(`下载失败: ${error}`);
    }
  }
  
  /**
   * 下载文件为Blob对象 (仅浏览器环境)
   * @param path 文件路径
   * @param maxDownloadSizeBytes 最大下载大小（字节）
   * @returns Promise<Blob> Blob对象
   */
  static async downloadAsBlob(
    path: string, 
    maxDownloadSizeBytes?: number
  ): Promise<Blob> {
    try {
      if (typeof window === 'undefined') {
        throw new Error('getBlob() 仅在浏览器环境中可用');
      }
      
      const storage = await firebaseManager.getStorage();
      const storageRef = ref(storage, path);
      
      const blob = await getBlob(storageRef, maxDownloadSizeBytes);
      console.log('文件下载成功 (Blob):', blob.size, 'bytes');
      return blob;
    } catch (error) {
      console.error('下载文件失败:', error);
      throw new Error(`下载失败: ${error}`);
    }
  }
}

/**
 * 文件管理类
 */
export class FirebaseStorageManager {
  
  /**
   * 删除文件
   * @param path 文件路径
   */
  static async deleteFile(path: string): Promise<void> {
    try {
      const storage = await firebaseManager.getStorage();
      const storageRef = ref(storage, path);
      
      await deleteObject(storageRef);
      console.log('文件删除成功:', path);
    } catch (error) {
      console.error('删除文件失败:', error);
      throw new Error(`删除失败: ${error}`);
    }
  }
  
  /**
   * 获取文件元数据
   * @param path 文件路径
   * @returns Promise<any> 文件元数据
   */
  static async getFileMetadata(path: string): Promise<any> {
    try {
      const storage = await firebaseManager.getStorage();
      const storageRef = ref(storage, path);
      
      const metadata = await getMetadata(storageRef);
      console.log('获取文件元数据成功:', metadata);
      return metadata;
    } catch (error) {
      console.error('获取文件元数据失败:', error);
      throw new Error(`获取元数据失败: ${error}`);
    }
  }
  
  /**
   * 更新文件元数据
   * @param path 文件路径
   * @param newMetadata 新的元数据
   * @returns Promise<any> 更新后的元数据
   */
  static async updateFileMetadata(
    path: string, 
    newMetadata: UploadMetadata
  ): Promise<any> {
    try {
      const storage = await firebaseManager.getStorage();
      const storageRef = ref(storage, path);
      
      const metadata = await updateMetadata(storageRef, newMetadata);
      console.log('更新文件元数据成功:', metadata);
      return metadata;
    } catch (error) {
      console.error('更新文件元数据失败:', error);
      throw new Error(`更新元数据失败: ${error}`);
    }
  }
  
  /**
   * 列出目录下的所有文件
   * @param path 目录路径
   * @returns Promise<{files: string[], folders: string[]}> 文件和文件夹列表
   */
  static async listFiles(path: string): Promise<{files: string[], folders: string[]}> {
    try {
      const storage = await firebaseManager.getStorage();
      const storageRef = ref(storage, path);
      
      const result = await listAll(storageRef);
      
      const files = result.items.map(item => item.fullPath);
      const folders = result.prefixes.map(prefix => prefix.fullPath);
      
      console.log('列出文件成功:', { files, folders });
      return { files, folders };
    } catch (error) {
      console.error('列出文件失败:', error);
      throw new Error(`列出文件失败: ${error}`);
    }
  }
}

/**
 * 图片处理工具类
 */
export class ImageStorageUtils {
  
  /**
   * 验证图片文件
   * @param file 文件对象
   * @param maxSizeMB 最大文件大小（MB）
   * @param allowedTypes 允许的文件类型
   */
  static validateImageFile(
    file: File, 
    maxSizeMB: number = 10,
    allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ): void {
    // 检查文件大小
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new Error(`文件大小不能超过 ${maxSizeMB}MB`);
    }
    
    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`不支持的文件格式，请选择: ${allowedTypes.join(', ')}`);
    }
  }
  
  /**
   * 生成唯一的文件名
   * @param originalName 原始文件名
   * @param prefix 文件名前缀
   * @returns 生成的文件名
   */
  static generateUniqueFilename(
    originalName: string, 
    prefix: string = 'file'
  ): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    
    return `${prefix}_${timestamp}_${randomString}.${extension}`;
  }
  
  /**
   * 上传图片并生成缩略图
   * @param file 图片文件
   * @param basePath 基础路径
   * @param onProgress 进度回调
   * @returns Promise<{originalUrl: string, thumbnailUrl?: string}>
   */
  static async uploadImageWithThumbnail(
    file: File,
    basePath: string = 'images',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{originalUrl: string, thumbnailUrl?: string}> {
    try {
      // 验证图片文件
      this.validateImageFile(file);
      
      // 生成文件名
      const filename = this.generateUniqueFilename(file.name, 'img');
      const originalPath = `${basePath}/original/${filename}`;
      
      // 上传原图
      const originalUrl = await FirebaseStorageUploader.uploadFileResumable(
        file,
        originalPath,
        onProgress,
        {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString()
          }
        }
      );
      
      return { originalUrl };
    } catch (error) {
      console.error('上传图片失败:', error);
      throw error;
    }
  }
}

// 默认导出一个包含所有功能的对象
export default {
  uploader: FirebaseStorageUploader,
  downloader: FirebaseStorageDownloader,
  manager: FirebaseStorageManager,
  imageUtils: ImageStorageUtils
};