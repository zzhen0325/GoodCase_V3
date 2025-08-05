/**
 * 图片处理工具函数
 */

/**
 * 获取图片的显示尺寸
 */
export function getImageDisplaySize(width: number, height: number, maxWidth: number = 300) {
  if (width <= maxWidth) {
    return { width, height };
  }
  
  const ratio = maxWidth / width;
  return {
    width: maxWidth,
    height: Math.round(height * ratio)
  };
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 检查是否为有效的图片URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  
  // 检查是否为有效的URL格式
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取图片文件扩展名
 */
export function getImageExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext || '';
}

/**
 * 检查是否为支持的图片格式
 */
export function isSupportedImageFormat(filename: string): boolean {
  const supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const ext = getImageExtension(filename);
  return supportedFormats.includes(ext);
}

/**
 * 获取图片元数据（客户端版本）
 */
export function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type
      });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 获取图片元数据（服务端版本）
 */
export async function getImageMetadataServer(buffer: Buffer, mimeType: string): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
  format: string;
}> {
  // 简单的图片尺寸检测，实际项目中可能需要使用sharp等库
  const format = mimeType.split('/')[1] || 'unknown';
  return {
    width: 0, // 需要实际的图片处理库来获取
    height: 0, // 需要实际的图片处理库来获取
    size: buffer.length,
    type: mimeType,
    format: format
  };
}

/**
 * 压缩图片文件
 */
export async function compressImageFile(
  file: File,
  config: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    format?: string;
  } = {}
): Promise<File> {
  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'jpeg'
  } = config;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 计算新尺寸
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // 绘制图片
      ctx?.drawImage(img, 0, 0, width, height);

      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: `image/${format}`,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('压缩失败'));
          }
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: '请选择图片文件'
    };
  }

  // 检查文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: '文件大小不能超过10MB'
    };
  }

  // 检查支持的格式
  if (!isSupportedImageFormat(file.name)) {
    return {
      isValid: false,
      error: '不支持的图片格式'
    };
  }

  return { isValid: true };
}