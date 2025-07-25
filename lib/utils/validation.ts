/**
 * 验证相关工具函数
 */

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
 * 验证文件名
 * @param filename 文件名
 * @returns 验证结果
 */
export const validateFilename = (filename: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!filename || filename.trim().length === 0) {
    return {
      isValid: false,
      error: '文件名不能为空'
    };
  }
  
  if (filename.length > 255) {
    return {
      isValid: false,
      error: '文件名不能超过255个字符'
    };
  }
  
  // 检查非法字符
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(filename)) {
    return {
      isValid: false,
      error: '文件名包含非法字符'
    };
  }
  
  return { isValid: true };
};

/**
 * 验证URL格式
 * @param url URL字符串
 * @returns 是否为有效URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 验证邮箱格式
 * @param email 邮箱字符串
 * @returns 是否为有效邮箱
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证字符串长度
 * @param str 字符串
 * @param minLength 最小长度
 * @param maxLength 最大长度
 * @returns 验证结果
 */
export const validateStringLength = (
  str: string,
  minLength: number = 0,
  maxLength: number = Infinity
): {
  isValid: boolean;
  error?: string;
} => {
  if (str.length < minLength) {
    return {
      isValid: false,
      error: `长度不能少于${minLength}个字符`
    };
  }
  
  if (str.length > maxLength) {
    return {
      isValid: false,
      error: `长度不能超过${maxLength}个字符`
    };
  }
  
  return { isValid: true };
};

/**
 * 验证必填字段
 * @param value 值
 * @param fieldName 字段名
 * @returns 验证结果
 */
export const validateRequired = (
  value: any,
  fieldName: string = '字段'
): {
  isValid: boolean;
  error?: string;
} => {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      error: `${fieldName}不能为空`
    };
  }
  
  return { isValid: true };
};