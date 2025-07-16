// 图片数据类型
export interface ImageData {
  id: string;
  url: string;
  title: string;
  prompts: Prompt[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
  isLocal?: boolean;
  isUploading?: boolean;
}

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

// 颜色主题类型
export interface ColorTheme {
  name: string;
  bg: string;
  text: string;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  color: string;
  group?: string; // 分组名称，可以为空
  order?: number; // 在分组内的排序位置
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 搜索筛选参数
export interface SearchFilters {
  query: string;
  tags: string[];
  sortBy?: string;
  sortOrder?: string;
  isFavorite?: boolean;
}

// 数据库操作结果
export interface DBResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 搜索结果类型
export interface SearchResult {
  filteredImages: ImageData[];
  tagStats: TagStats;
}

// 标签统计类型
export type TagStats = Record<string, number>;

// 提示词和标签颜色主题
export const COLOR_THEMES: ColorTheme[] = [
  { name: 'slate', bg: '#f1f5f9', text: '#1e293b' },
  { name: 'amber', bg: '#fef3c7', text: '#c2410c' },
  { name: 'lime', bg: '#ecfccb', text: '#84cc16' },
  { name: 'green', bg: '#dcfce7', text: '#22c55e' },
  { name: 'cyan', bg: '#a5f3fc', text: '#0891b2' },
  { name: 'sky', bg: '#e0f2fe', text: '#38bdf8' },
  { name: 'violet', bg: '#ede9fe', text: '#8b5cf6' },
  { name: 'fuchsia', bg: '#fae8ff', text: '#d946ef' },
] as const;

// 提示词颜色选项（保持向后兼容）
export const PROMPT_COLORS = COLOR_THEMES.map(theme => theme.name);

// 标签颜色选项（保持向后兼容）
export const TAG_COLORS = COLOR_THEMES.map(theme => theme.name);

// 根据颜色名称获取主题
export const getColorTheme = (colorName: string): ColorTheme => {
  return COLOR_THEMES.find(theme => theme.name === colorName) || COLOR_THEMES[0];
};

// 数据库文档类型（用于Firestore存储）
export interface ImageDocument {
  id: string;
  url: string;
  title: string;
  tags: Tag[];
  prompts?: Prompt[];
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

export interface PromptDocument {
  id: string;
  imageId: string;
  title: string;
  content: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// 导出数据类型
export interface ExportData {
  version: string;
  exportedAt: string;
  images: ImageData[];
  tags: Tag[];
  metadata: {
    totalImages: number;
    totalTags: number;
    totalPrompts: number;
  };
}