/**
 * 图片处理工具函数
 */

/**
 * 检测图片格式
 * @param dataUrl - base64格式的图片数据URL
 * @returns 图片格式 (webp, jpeg, png, gif, 等)
 */
export function detectImageFormat(dataUrl: string): string {
  if (!dataUrl.startsWith('data:image/')) {
    return 'unknown';
  }

  const mimeType = dataUrl.split(';')[0].split(':')[1];
  const format = mimeType.split('/')[1];

  return format.toLowerCase();
}

/**
 * 估算图片大小（字节）
 * @param dataUrl - base64格式的图片数据URL
 * @returns 估算的文件大小（字节）
 */
export function estimateImageSize(dataUrl: string): number {
  if (!dataUrl.startsWith('data:')) {
    return 0;
  }

  const base64Data = dataUrl.split(',')[1];
  if (!base64Data) {
    return 0;
  }

  // Base64编码会增加约33%的大小，所以实际大小约为base64长度的75%
  return Math.round(base64Data.length * 0.75);
}

/**
 * 将图片转换为WebP格式
 * @param dataUrl - 原始图片的base64数据URL
 * @param quality - 压缩质量 (0-1)
 * @returns Promise<string> - 转换后的WebP格式base64数据URL
 */
export async function convertToWebp(
  dataUrl: string,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 创建图片元素
      const img = new Image();

      img.onload = () => {
        try {
          // 创建canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('无法获取canvas上下文'));
            return;
          }

          // 设置canvas尺寸
          canvas.width = img.width;
          canvas.height = img.height;

          // 绘制图片到canvas
          ctx.drawImage(img, 0, 0);

          // 转换为WebP格式
          const webpDataUrl = canvas.toDataURL('image/webp', quality);

          resolve(webpDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      // 加载图片
      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 调整图片尺寸
 * @param dataUrl - 原始图片的base64数据URL
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @param quality - 压缩质量 (0-1)
 * @returns Promise<string> - 调整后的base64数据URL
 */
export async function resizeImage(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('无法获取canvas上下文'));
            return;
          }

          // 计算新尺寸
          let { width, height } = img;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          // 设置canvas尺寸
          canvas.width = width;
          canvas.height = height;

          // 绘制调整后的图片
          ctx.drawImage(img, 0, 0, width, height);

          // 输出为WebP格式
          const resizedDataUrl = canvas.toDataURL('image/webp', quality);

          resolve(resizedDataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = dataUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 压缩图片（基于base64数据URL）
 * @param dataUrl - 原始图片的base64数据URL
 * @param maxSizeKB - 最大文件大小（KB）
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @returns Promise<string> - 压缩后的base64数据URL
 */
export async function compressImageDataUrl(
  dataUrl: string,
  maxSizeKB: number = 500,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): Promise<string> {
  let quality = 0.9;
  let compressed = await resizeImage(dataUrl, maxWidth, maxHeight, quality);

  // 如果文件仍然太大，逐步降低质量
  while (estimateImageSize(compressed) > maxSizeKB * 1024 && quality > 0.1) {
    quality -= 0.1;
    compressed = await resizeImage(dataUrl, maxWidth, maxHeight, quality);
  }

  return compressed;
}

/**
 * 验证图片格式是否支持
 * @param dataUrl - 图片的base64数据URL
 * @returns boolean - 是否为支持的格式
 */
export function isSupportedImageFormat(dataUrl: string): boolean {
  const supportedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
  const format = detectImageFormat(dataUrl);
  return supportedFormats.includes(format);
}

/**
 * 获取图片尺寸信息
 * @param dataUrl - 图片的base64数据URL
 * @returns Promise<{width: number, height: number}> - 图片尺寸
 */
export async function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('无法加载图片'));
    };

    img.src = dataUrl;
  });
}

// 图片元数据获取工具

/**
 * 获取图片元数据（宽高、大小、格式等）
 * @param file 图片文件
 * @returns 图片元数据
 */
export const getImageMetadata = async (file: File): Promise<{
  width: number;
  height: number;
  fileSize: number;
  format: string;
}> => {
  // 检查是否在浏览器环境
  if (typeof window !== 'undefined' && typeof Image !== 'undefined') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          fileSize: file.size,
          format: file.type.split('/')[1] || 'png'
        });
      };
      
      img.onerror = () => {
        reject(new Error('无法读取图片元数据'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  } else {
    // 服务器端环境，返回基本信息
    return {
      width: 0, // 在服务器端无法获取真实尺寸
      height: 0,
      fileSize: file.size,
      format: file.type.split('/')[1] || 'png'
    };
  }
};

/**
 * 验证图片文件
 * @param file 文件对象
 * @returns 验证结果
 */
export const validateImageFile = (file: File): {
  isValid: boolean;
  error?: string;
} => {
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    return {
      isValid: false,
      error: '只支持图片文件'
    };
  }
  
  // 检查文件大小（10MB限制）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: '文件大小不能超过10MB'
    };
  }
  
  // 检查文件格式
  const allowedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp'];
  const format = file.type.split('/')[1];
  if (!allowedFormats.includes(format)) {
    return {
      isValid: false,
      error: `不支持的图片格式: ${format}`
    };
  }
  
  return { isValid: true };
};

/**
 * 压缩图片文件
 * @param file 原始图片文件
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @param quality 压缩质量 (0-1)
 * @returns 压缩后的图片文件
 */
export const compressImageFile = async (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算缩放比例
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // 设置canvas尺寸
      canvas.width = width;
      canvas.height = height;
      
      // 绘制图片
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('图片压缩失败'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('无法加载图片'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 生成图片缩略图
 * @param file 原始图片文件
 * @param width 缩略图宽度
 * @param height 缩略图高度
 * @returns 缩略图Blob
 */
export const generateThumbnail = async (
  file: File,
  width: number = 200,
  height: number = 200
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = width;
    canvas.height = height;
    
    img.onload = () => {
      // 计算缩放和裁剪
      const scale = Math.max(width / img.width, height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // 居中裁剪
      const offsetX = (scaledWidth - width) / 2;
      const offsetY = (scaledHeight - height) / 2;
      
      ctx?.drawImage(
        img,
        offsetX / scale,
        offsetY / scale,
        width / scale,
        height / scale,
        0,
        0,
        width,
        height
      );
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('生成缩略图失败'));
          }
        },
        'image/jpeg',
        0.8
      );
    };
    
    img.onerror = () => {
      reject(new Error('无法加载图片'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};
