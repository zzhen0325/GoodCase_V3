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
 * 压缩图片
 * @param dataUrl - 原始图片的base64数据URL
 * @param maxSizeKB - 最大文件大小（KB）
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @returns Promise<string> - 压缩后的base64数据URL
 */
export async function compressImage(
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
