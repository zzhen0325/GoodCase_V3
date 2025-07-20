// 基础数据类型
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 图片数据类型
export interface ImageData {
  id: string;
  url: string;
  title: string;
  prompts: Prompt[];
  // tags字段移除，改为通过ImageTag关联表获取
  createdAt: string;
  updatedAt: string;
  sortOrder?: number;

  isLocal?: boolean;
  isUploading?: boolean;
  // 运行时添加的标签数据（用于显示）
  tags?: Tag[];
}

// 标签类型 - 独立存储
export interface Tag {
  id: string;
  name: string;
  color: string;
  categoryId?: string; // 分类ID，可选
  usageCount?: number; // 使用次数
  order?: number; // 在分类内的排序位置

  createdAt?: string;
  updatedAt?: string;
  // 运行时添加的分类信息（用于显示）
  categoryName?: string;
}

// 分类类型（原标签分组）
export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  order?: number; // 自定义排序字段，数值越小排序越靠前
  tagCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 图片标签关联类型（多对多关系）
export interface ImageTag {
  id: string;
  imageId: string;
  tagId: string;
  createdAt: string;
  updatedAt: string;
}

// 保持向后兼容的别名
export type TagGroup = Category;

// 提示词类型
export interface Prompt {
  id: string;
  title: string;
  content: string;
  color: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromptBlock {
  id: string;
  title?: string;
  content: string;
  text?: string; // 兼容旧版本
  color?: string;
  order?: number;
  sortOrder?: number;
  imageId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// 搜索过滤器 - 优化版
export interface SearchFilters {
  query: string;
  tags: string[]; // 修改为 tags 而不是 tagIds
  dateRange?: {
    start: Date;
    end: Date;
  };
  sizeRange?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
  };
  sortBy: 'createdAt' | 'updatedAt' | 'title' | 'size';
  sortOrder: 'asc' | 'desc';
}

// 分页接口
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
  startAfter?: any; // 用于 Firestore 分页
}

// 搜索结果 - 优化版
export interface SearchResult {
  images: ImageData[];
  pagination: Pagination;
  filters: SearchFilters;
  total: number; // 修改为 total
  searchTime: number; // 搜索耗时（毫秒）
}

// 数据库操作结果
export interface DBResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// 批量操作结果
export interface BatchResult {
  success: number;
  failed: number;
  errors: string[];
  results: DBResult[];
}

// 导出数据格式 - 精简版
export interface ExportData {
  version: string;
  exportDate: Date;
  images: ImageData[];
  tags: Tag[];
  metadata: {
    totalImages: number;
    totalTags: number;
  };
}

// Firestore 文档类型（用于数据库存储）
export interface ImageDocument {
  id?: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  prompts: Prompt[]; // 提示词数组（嵌套存储）
  // tags字段移除，改为通过ImageTag关联表存储
  width: number;
  height: number;
  fileSize: number;
  format: string;
  colorSpace?: string;
  hasTransparency?: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface TagDocument {
  id?: string;
  name: string;
  color: string;
  categoryId?: string;
  usageCount?: number;
  order?: number;
  createdAt: any;
  updatedAt: any;
}

export interface CategoryDocument {
  id?: string;
  name: string;
  description?: string;
  color?: string;
  order?: number; // 显示顺序
  tagCount?: number;
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

export interface ImageTagDocument {
  id?: string;
  imageId: string;
  tagId: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// 保持向后兼容的别名
export type TagGroupDocument = CategoryDocument;

export interface PromptDocument {
  id?: string;
  title: string; // 提示词标题
  content: string; // 提示词内容
  color: string; // 颜色主题
  order: number; // 显示顺序
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// 颜色主题 - 精简版
export interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
}

// 预定义颜色和主题
export const AVAILABLE_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#64748b',
  '#6b7280',
  '#374151',
] as const;

export const COLOR_THEMES: ColorTheme[] = [
  {
    name: 'pink',
    primary: '#F4BFEA',
    secondary: '#F4BFEA',
    accent: '#F4BFEA',
    bg: '#FFE5FA',
    text: '#7F4073',
  },
  {
    name: 'cyan',
    primary: '#80E3F5',
    secondary: '#80E3F5',
    accent: '#80E3F5',
    bg: '#D7F9FF',
    text: '#54848D',
  },
  {
    name: 'yellow',
    primary: '#FFE1B3',
    secondary: '#FFE1B3',
    accent: '#FFE1B3',
    bg: '#FFF7D7',
    text: '#CF8D4B',
  },
  {
    name: 'green',
    primary: '#A6E19E',
    secondary: '#A6E19E',
    accent: '#A6E19E',
    bg: '#D1FFCB',
    text: '#60BA54',
  },
  {
    name: 'purple',
    primary: '#D8C0FF',
    secondary: '#D8C0FF',
    accent: '#D8C0FF',
    bg: '#EADDFF',
    text: '#A180D7',
  },
];

// 获取颜色主题的辅助函数
export function getColorTheme(themeName: string): ColorTheme {
  return (
    COLOR_THEMES.find((theme) => theme.name === themeName) || COLOR_THEMES[0]
  );
}

// 应用状态接口
export interface AppState {
  images: ImageData[];
  filteredImages: ImageData[];
  tags: Tag[];
  searchFilters: SearchFilters;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

// 缓存状态接口
export interface CacheState {
  lastUpdated: Date;
  isValid: boolean;
  source: 'memory' | 'localStorage' | 'network';
}

// 性能监控接口
export interface PerformanceMetrics {
  loadTime: number;
  searchTime: number;
  renderTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  totalRequests: number;
  errorCount: number;
  averageResponseTime: number;
  cacheHits: number;
  cacheMisses: number;
  lastUpdated: Date;
}

// 用户偏好设置
export interface UserPreferences {
  theme: string;
  language: string;
  itemsPerPage: number;
  defaultSortBy: SearchFilters['sortBy'];
  defaultSortOrder: SearchFilters['sortOrder'];
  autoSave: boolean;
  cacheEnabled: boolean;
}

// 类型守卫函数
export function isImageData(obj: any): obj is ImageData {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.url === 'string' &&
    typeof obj.title === 'string'
  );
}

export function isTag(obj: any): obj is Tag {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.color === 'string'
  );
}

// TagGroup 功能已简化，不再需要类型检查函数

// 工具类型
export type SortableFields = keyof Pick<
  ImageData,
  'createdAt' | 'updatedAt' | 'title'
>;
export type FilterableFields = keyof Pick<ImageData, 'title' | 'tags'>;
export type SearchableEntities = ImageData | Tag;

// 事件类型
export type DataChangeEvent = {
  type: 'create' | 'update' | 'delete';
  entity: 'image' | 'tag';
  id: string;
  data?: any;
};

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

// 文件上传相关
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
}

export interface UploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
  metadata?: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
  };
}

// 常量
export const DEFAULT_PAGINATION_LIMIT = 20;
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_FORMATS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
] as const;
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  query: '',
  tags: [], // 修改为 tags
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

// 默认提示词块模板
export const DEFAULT_PROMPT_BLOCKS = [
  { title: '风格', text: '' },
  { title: '主体', text: '' },
  { title: '场景', text: '' },
] as const;

// 连接状态类型
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// 文件上传相关接口
export interface UploadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FileUploadOptions {
  maxSize?: number;
  allowedFormats?: string[];
  generateThumbnail?: boolean;
  quality?: number;
}

// 监听器选项
export interface ListenerOptions {
  useCache?: boolean;
  cacheTimeout?: number;
}

// 错误类型
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class CacheError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'CACHE_ERROR', details);
    this.name = 'CacheError';
  }
}
