// 基础数据类型
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 图片数据接口 - 精简版
export interface ImageData extends BaseEntity {
  url: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  tags: string[]; // 简化为字符串数组
  prompt?: string;
  size: {
    width: number;
    height: number;
    fileSize: number;
  };
  metadata?: {
    format: string;
    colorSpace?: string;
    hasTransparency?: boolean;
  };
}

// 标签接口 - 精简版
export interface Tag extends BaseEntity {
  name: string;
  color: string;
  groupId?: string;
  usageCount: number; // 使用次数，用于排序和清理
}

// 标签分组接口 - 精简版
export interface TagGroup extends BaseEntity {
  name: string;
  color: string;
  description?: string;
  tagCount: number; // 包含的标签数量
}

// 提示词接口 - 精简版
export interface Prompt extends BaseEntity {
  text: string;
  category?: string;
  tags: string[];
  usageCount: number;
  isTemplate: boolean;
  color?: string;
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
  sortBy: "createdAt" | "updatedAt" | "title" | "size";
  sortOrder: "asc" | "desc";
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
  tagGroups: TagGroup[];
  prompts: Prompt[];
  metadata: {
    totalImages: number;
    totalTags: number;
    totalPrompts: number;
  };
}

// Firestore 文档类型（用于数据库存储）
export interface ImageDocument {
  url: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  tags: string[];
  prompt?: string;
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
  name: string;
  color: string;
  groupId?: string;
  usageCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface TagGroupDocument {
  name: string;
  color: string;
  description?: string;
  tagCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface PromptDocument {
  text: string;
  category?: string;
  tags: string[];
  usageCount: number;
  isTemplate: boolean;
  createdAt: any;
  updatedAt: any;
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
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#64748b",
  "#6b7280",
  "#374151",
] as const;

export const COLOR_THEMES: ColorTheme[] = [
  {
    name: "default",
    primary: "#3b82f6",
    secondary: "#64748b",
    accent: "#f59e0b",
    bg: "#dbeafe",
    text: "#1e40af",
  },
  {
    name: "warm",
    primary: "#f97316",
    secondary: "#78716c",
    accent: "#eab308",
    bg: "#fed7aa",
    text: "#c2410c",
  },
  {
    name: "cool",
    primary: "#06b6d4",
    secondary: "#64748b",
    accent: "#8b5cf6",
    bg: "#cffafe",
    text: "#0891b2",
  },
  {
    name: "nature",
    primary: "#22c55e",
    secondary: "#6b7280",
    accent: "#f59e0b",
    bg: "#dcfce7",
    text: "#166534",
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
  tagGroups: TagGroup[];
  prompts: Prompt[];
  searchFilters: SearchFilters;
  isLoading: boolean;
  error: string | null;
  connectionStatus: "connected" | "disconnected" | "reconnecting";
}

// 缓存状态接口
export interface CacheState {
  lastUpdated: Date;
  isValid: boolean;
  source: "memory" | "localStorage" | "network";
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
  defaultSortBy: SearchFilters["sortBy"];
  defaultSortOrder: SearchFilters["sortOrder"];
  autoSave: boolean;
  cacheEnabled: boolean;
}

// 类型守卫函数
export function isImageData(obj: any): obj is ImageData {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.url === "string" &&
    typeof obj.title === "string"
  );
}

export function isTag(obj: any): obj is Tag {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.color === "string"
  );
}

export function isTagGroup(obj: any): obj is TagGroup {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.color === "string"
  );
}

// 工具类型
export type SortableFields = keyof Pick<
  ImageData,
  "createdAt" | "updatedAt" | "title"
>;
export type FilterableFields = keyof Pick<
  ImageData,
  "title" | "description" | "tags"
>;
export type SearchableEntities = ImageData | Tag | TagGroup | Prompt;

// 事件类型
export type DataChangeEvent = {
  type: "create" | "update" | "delete";
  entity: "image" | "tag" | "tagGroup" | "prompt";
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
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
] as const;
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  query: "",
  tags: [], // 修改为 tags
  sortBy: "createdAt",
  sortOrder: "desc",
};

// 连接状态类型
export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

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
    public details?: any,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, "NETWORK_ERROR", details);
    this.name = "NetworkError";
  }
}

export class CacheError extends AppError {
  constructor(message: string, details?: any) {
    super(message, "CACHE_ERROR", details);
    this.name = "CacheError";
  }
}
