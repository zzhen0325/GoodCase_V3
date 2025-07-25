// API端点常量
export const API_ENDPOINTS = {
  // 图片相关
  IMAGES: '/api/images',
  IMAGE_BY_ID: (id: string) => `/api/images/${id}`,
  IMAGE_DUPLICATE: '/api/images/duplicate',
  
  // 标签相关
  TAGS: '/api/tags',
  TAG_BY_ID: (id: string) => `/api/tags/${id}`,
  
  // 标签分类相关
  TAG_CATEGORIES: '/api/tag-categories',
  TAG_CATEGORY_BY_ID: (id: string) => `/api/tag-categories/${id}`,
  
  // 主题相关
  THEMES: '/api/themes',
} as const;

// HTTP方法常量
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

// API响应状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// 请求头常量
export const HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_FORM: 'application/x-www-form-urlencoded',
  CONTENT_TYPE_MULTIPART: 'multipart/form-data',
} as const;

// API配置
export const API_CONFIG = {
  TIMEOUT: 30000, // 30秒超时
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000, // 1秒重试延迟
} as const;