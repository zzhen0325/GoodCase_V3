// ==================== 轻量级图片标签系统类型定义 ====================

// 预制主题颜色系统
export const PRESET_THEMES = {
  pink: {
    primary: "#F4BFEA",
    secondary: "#F4BFEA", 
    accent: "#F4BFEA",
    bg: "#FFE5FA",
    text: "#7F4073"
  },
  cyan: {
    primary: "#80E3F5",
    secondary: "#80E3F5",
    accent: "#80E3F5", 
    bg: "#D7F9FF",
    text: "#54848D"
  },
  yellow: {
    primary: "#FFE1B3",
    secondary: "#FFE1B3",
    accent: "#FFE1B3",
    bg: "#FFF7D7", 
    text: "#CF8D4B"
  },
  green: {
    primary: "#A6E19E",
    secondary: "#A6E19E",
    accent: "#A6E19E",
    bg: "#D1FFCB",
    text: "#60BA54"
  },
  purple: {
    primary: "#D8C0FF",
    secondary: "#D8C0FF", 
    accent: "#D8C0FF",
    bg: "#EADDFF",
    text: "#A180D7"
  },
  blue: {
    primary: "#A3C4F3",
    secondary: "#A3C4F3",
    accent: "#A3C4F3",
    bg: "#E1F0FF",
    text: "#5A7BA8"
  }
} as const;

export type ThemeColor = keyof typeof PRESET_THEMES;

// ==================== 核心数据类型 ====================

// 图片类型枚举
export type ImageType = 'single' | 'comparison';

// 标签分类类型（运行时使用）
export interface TagCategory {
  id: string;
  name: string;
  description?: string;
  color: ThemeColor;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Firestore 标签分类文档类型（数据库存储）
export interface FirestoreTagCategory {
  id: string;
  name: string;
  description?: string;
  color: ThemeColor;
  isDefault: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// 标签类型（运行时使用）
export interface Tag {
  id: string;
  name: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

// Firestore 标签文档类型（数据库存储）
export interface FirestoreTag {
  id: string;
  name: string;
  categoryId: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// 提示词块类型
export interface PromptBlock {
  id: string;
  title?: string;
  content: string;
  color: ThemeColor;
  order: number;
}

// 图片类型（运行时使用）
export interface ImageData {
  id: string;
  type: ImageType; // 图片类型：单图或对比图
  
  // 单图字段（type='single'时使用）
  storagePath?: string;
  url?: string;
  size?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  format?: string;
  
  // 双图字段（type='comparison'时使用）
  beforeImage?: {
    storagePath: string;
    url: string;
    fileSize: number;
    width: number;
    height: number;
    mimeType: string;
    format: string;
  };
  afterImage?: {
    storagePath: string;
    url: string;
    fileSize: number;
    width: number;
    height: number;
    mimeType: string;
    format: string;
  };
  
  // 通用字段
  name: string;
  title?: string; // 兼容性字段，等同于name
  description?: string;
  link?: string; // 关联链接，可选
  tags: string[]; // 标签ID数组
  promptBlocks: PromptBlock[];
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

// Firestore 图片文档类型（数据库存储）
export interface FirestoreImage {
  id: string;
  type: ImageType; // 图片类型：单图或对比图
  
  // 单图字段（type='single'时使用）
  storagePath?: string;
  url?: string;
  size?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  format?: string;
  
  // 双图字段（type='comparison'时使用）
  beforeImage?: {
    storagePath: string;
    url: string;
    fileSize: number;
    width: number;
    height: number;
    mimeType: string;
    format: string;
  };
  afterImage?: {
    storagePath: string;
    url: string;
    fileSize: number;
    width: number;
    height: number;
    mimeType: string;
    format: string;
  };
  
  // 通用字段
  name: string;
  description?: string;
  link?: string; // 关联链接，可选
  tags: string[]; // 标签ID数组
  promptBlocks: PromptBlock[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  status: 'ACTIVE' | 'ARCHIVED';
}

// ==================== API 响应类型 ====================

// 通用API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// 验证错误详情
export interface ValidationError {
  field: string;
  message: string;
  allowedValues?: string[];
}

// 批量操作结果
export interface BatchOperationResult {
  successCount: number;
  failedCount: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

// 级联删除预览结果
export interface CascadeDeletePreview {
  canDelete: boolean;
  affectedTags?: number;
  affectedImages?: number;
  targetCategory?: {
    id: string;
    name: string;
  };
  isDefault?: boolean;
}

// ==================== 搜索和过滤类型 ====================

export interface SearchFilters {
  query?: string;
  tagId?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
  sort?: 'createdAt' | 'updatedAt' | 'name';
  order?: 'asc' | 'desc';
  limit?: number;
  page?: number;
}

export interface SearchResult {
  images: ImageData[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ==================== 系统状态类型 ====================

export interface SystemStats {
  categories: {
    total: number;
    default: number;
    custom: number;
  };
  tags: {
    total: number;
    byCategory: Record<string, number>;
  };
  images: {
    total: number;
    active: number;
    archived: number;
    withTags: number;
    withPrompts: number;
  };
  storage?: {
    totalSize: string;
    averageFileSize: string;
  };
}

export interface ValidationIssues {
  orphanedTags: number;
  invalidThemeReferences: number;
  brokenImageReferences: number;
  duplicateTagNames: string[];
}

export interface SystemValidation {
  isValid: boolean;
  issues: ValidationIssues;
  summary: {
    totalCategories: number;
    totalTags: number;
    totalImages: number;
    activeImages: number;
    archivedImages: number;
  };
}

// ==================== 常量 ====================

export const DEFAULT_PAGINATION_LIMIT = 20;
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;

// 验证规则常量
export const VALIDATION_RULES = {
  CATEGORY_NAME_MAX_LENGTH: 50,
  CATEGORY_DESCRIPTION_MAX_LENGTH: 200,
  TAG_NAME_MAX_LENGTH: 30,
  IMAGE_NAME_MAX_LENGTH: 100,
  IMAGE_DESCRIPTION_MAX_LENGTH: 500,
  PROMPT_CONTENT_MAX_LENGTH: 200,
} as const;

// ==================== 工具类型 ====================

export type SortableFields = 'createdAt' | 'updatedAt' | 'name';
export type FilterableFields = 'name' | 'tags';

// 类型守卫函数
export function isImageData(obj: any): obj is ImageData {
  return obj && 
    typeof obj.id === 'string' && 
    typeof obj.name === 'string' && 
    (obj.type === 'single' || obj.type === 'comparison') &&
    (
      // 单图类型验证
      (obj.type === 'single' && typeof obj.url === 'string') ||
      // 双图类型验证
      (obj.type === 'comparison' && obj.beforeImage && obj.afterImage &&
       typeof obj.beforeImage.url === 'string' && typeof obj.afterImage.url === 'string')
    );
}

export function isTag(obj: any): obj is Tag {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.categoryId === 'string';
}

export function isTagCategory(obj: any): obj is TagCategory {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.color === 'string';
}

export function isValidThemeColor(color: string): color is ThemeColor {
  return Object.keys(PRESET_THEMES).includes(color);
}

// ==================== 兼容性类型 ====================

// 搜索过滤器扩展
export interface SearchFilters {
  query?: string;
  tags?: string[];
  sort?: 'createdAt' | 'updatedAt' | 'name';
  sortBy?: 'createdAt' | 'updatedAt' | 'name'; // 兼容性
  sortOrder?: 'asc' | 'desc';
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
}

// 默认搜索过滤器
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  query: '',
  tags: [],
  sort: 'createdAt',
  sortOrder: 'desc'
};

// 搜索结果
export interface SearchResult {
  images: ImageData[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 颜色主题工具函数
export function getColorTheme(color: ThemeColor) {
  return PRESET_THEMES[color] || PRESET_THEMES.pink;
}

// 可用颜色列表
export const AVAILABLE_COLORS = Object.keys(PRESET_THEMES) as ThemeColor[];

// 颜色主题列表
export const COLOR_THEMES = AVAILABLE_COLORS.map(color => ({
  name: color,
  colors: PRESET_THEMES[color]
}));

// 默认提示词块模板
export const DEFAULT_PROMPT_BLOCKS: Omit<PromptBlock, 'id'>[] = [
  {
    content: '一个美丽的风景',
    color: 'green',
    order: 0
  },
  {
    content: '高质量，4K分辨率',
    color: 'cyan',
    order: 1
  }
];

// 双图类型默认提示词
export const DEFAULT_COMPARISON_PROMPT: Omit<PromptBlock, 'id'> = {
  title: '指令',
  content: '',
  color: 'blue',
  order: 0
};

// ==================== 数据库相关类型 ====================

// 数据库操作结果
export interface DBResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 分页信息
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 批量操作结果
export interface BatchResult {
  successCount: number;
  failedCount: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

// 上传验证结果
export interface UploadValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// 文件上传选项
export interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  compress?: boolean;
  quality?: number;
}
