# 快速重构操作指南

## 🚀 立即可执行的优化命令

### 1. 清理废弃文件（5分钟）

```bash
# 删除已废弃的文件
rm lib/firebase-server.ts
rm lib/image-storage.ts

# 删除临时文件
rm components/.syncthing.toast-demo.tsx.tmp

# 清理等待移出目录（如果确认不需要）
# rm -rf 等待移出/
```

### 2. 分析未使用的依赖（10分钟）

```bash
# 安装依赖分析工具
npm install -g depcheck

# 分析未使用的依赖
depcheck

# 分析包大小
npx webpack-bundle-analyzer .next/static/chunks/*.js
```

### 3. 代码质量检查（5分钟）

```bash
# 运行所有检查
npm run lint
npm run type-check
npm run build

# 格式化代码
npm run format
```

## 📁 创建新目录结构

### 创建通用组件目录

```bash
# 创建新的组件目录结构
mkdir -p components/common/{modals,forms,displays,inputs}
mkdir -p components/features/{image-management,upload,tags}
mkdir -p components/layout

# 创建新的hooks目录结构
mkdir -p hooks/{core,data,ui,features}

# 创建新的lib目录结构
mkdir -p lib/{api,firebase,utils,constants}
```

## 🔧 具体重构代码示例

### 1. 创建BaseModal组件

```bash
# 创建BaseModal文件
cat > components/common/modals/BaseModal.tsx << 'EOF'
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils/common';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className
}: BaseModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-4xl'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
EOF
```

### 2. 创建通用API Hook

```bash
# 创建useApi hook
cat > hooks/core/useApi.ts << 'EOF'
import { useState, useCallback } from 'react';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useApi<T = any>(endpoint: string, options?: UseApiOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (requestOptions?: RequestInit) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...requestOptions,
      });
      
      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      options?.onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}
EOF
```

### 3. 拆分utils.ts文件

```bash
# 创建通用工具函数
cat > lib/utils/common.ts << 'EOF'
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 合并CSS类名
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 生成随机ID
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'absolute';
      textArea.style.left = '-999999px';
      document.body.prepend(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      return true;
    }
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
EOF

# 创建图片工具函数
cat > lib/utils/image.ts << 'EOF'
import { ImageData, SearchFilters } from '@/types';

// 图片筛选函数
export function filterImages(
  images: ImageData[],
  filters: SearchFilters
): ImageData[] {
  let filtered = [...images];

  // 文本搜索
  if (filters.query && filters.query.trim()) {
    const query = filters.query.toLowerCase().trim();
    const searchTerms = query.split(/\s+/);

    filtered = filtered.filter((image) => {
      const searchableText = [
        image.title || image.name,
        image.description || '',
        image.promptBlocks?.map(p => p.content).join(' ') || '',
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // 标签筛选
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((image) =>
      filters.tags!.some(tagId => image.tags.includes(tagId))
    );
  }

  // 状态筛选
  if (filters.status) {
    filtered = filtered.filter((image) => image.status === filters.status);
  }

  // 排序
  if (filters.sort) {
    const sortField = filters.sort;
    const sortOrder = filters.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof ImageData] as string;
      const bValue = b[sortField as keyof ImageData] as string;
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }

  return filtered;
}

// 验证图片文件
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: '不支持的文件格式，请上传 JPG、PNG、GIF 或 WebP 格式的图片'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: '文件大小超过限制，请上传小于 10MB 的图片'
    };
  }

  return { isValid: true };
}

// 获取图片元数据
export function getImageMetadata(file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法读取图片信息'));
    };
    
    img.src = url;
  });
}
EOF
```

### 4. 创建主题常量文件

```bash
# 创建主题配置
cat > lib/constants/theme.ts << 'EOF'
export const THEME_COLORS = {
  pink: {
    primary: '#F4BFEA',
    secondary: '#F4BFEA',
    accent: '#F4BFEA',
    bg: '#FFE5FA',
    text: '#7F4073'
  },
  cyan: {
    primary: '#80E3F5',
    secondary: '#80E3F5',
    accent: '#80E3F5',
    bg: '#D7F9FF',
    text: '#54848D'
  },
  yellow: {
    primary: '#FFE1B3',
    secondary: '#FFE1B3',
    accent: '#FFE1B3',
    bg: '#FFF7D7',
    text: '#CF8D4B'
  },
  green: {
    primary: '#A6E19E',
    secondary: '#A6E19E',
    accent: '#A6E19E',
    bg: '#D1FFCB',
    text: '#60BA54'
  },
  purple: {
    primary: '#D8C0FF',
    secondary: '#D8C0FF',
    accent: '#D8C0FF',
    bg: '#EADDFF',
    text: '#A180D7'
  }
} as const;

export type ThemeColor = keyof typeof THEME_COLORS;

export function getColorTheme(color: ThemeColor) {
  return THEME_COLORS[color];
}

export const AVAILABLE_COLORS = Object.keys(THEME_COLORS) as ThemeColor[];

export const COLOR_THEMES = AVAILABLE_COLORS.map(color => ({
  name: color,
  colors: THEME_COLORS[color]
}));
EOF
```

## 📝 更新导入语句

### 批量更新导入语句的脚本

```bash
# 创建更新导入语句的脚本
cat > scripts/update-imports.sh << 'EOF'
#!/bin/bash

# 更新utils导入
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|from "@/lib/utils"|from "@/lib/utils/common"|g'

# 更新主题导入
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's|from "@/types"|from "@/lib/constants/theme"|g'

echo "导入语句更新完成"
EOF

chmod +x scripts/update-imports.sh
```

## 🧪 测试重构结果

### 快速测试脚本

```bash
# 创建测试脚本
cat > scripts/test-refactor.sh << 'EOF'
#!/bin/bash

echo "🔍 开始测试重构结果..."

# 检查TypeScript编译
echo "📝 检查TypeScript编译..."
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript编译失败"
  exit 1
fi

# 检查ESLint
echo "🔍 检查代码质量..."
npm run lint
if [ $? -ne 0 ]; then
  echo "⚠️ 代码质量检查有警告"
fi

# 尝试构建
echo "🏗️ 尝试构建项目..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ 项目构建失败"
  exit 1
fi

echo "✅ 重构测试通过！"
EOF

chmod +x scripts/test-refactor.sh
```

## 📊 重构进度追踪

### 创建进度检查清单

```bash
# 创建进度追踪文件
cat > Docs/REFACTOR_PROGRESS.md << 'EOF'
# 重构进度追踪

## 📋 总体进度

- [ ] 阶段一：准备工作
- [x] 阶段二：Lib模块重构
- [ ] 阶段三：组件重构
- [ ] 阶段四：Hooks重构
- [ ] 阶段五：样式系统优化
- [ ] 阶段六：类型系统优化
- [ ] 阶段七：测试和验证

## 🔧 详细任务

### Lib模块重构
- [ ] 删除废弃文件 (lib/firebase-server.ts, lib/image-storage.ts)
- [ ] 拆分utils.ts为多个文件
- [ ] 创建主题常量文件
- [ ] 统一Firebase配置

### 组件重构
- [ ] 创建BaseModal组件
- [ ] 创建BaseForm组件
- [ ] 重构标签相关组件
- [ ] 重构模态框组件

### Hooks重构
- [ ] 创建useApi hook
- [ ] 创建useAsyncState hook
- [ ] 重构useTagOperations
- [ ] 重构useImageOperations

### 测试验证
- [ ] TypeScript编译通过
- [ ] ESLint检查通过
- [ ] 项目构建成功
- [ ] 功能测试通过

## 📝 注意事项

- 每完成一个阶段都要运行测试脚本
- 遇到问题及时记录和解决
- 保持代码提交的原子性
EOF
```

## 🚨 紧急回滚命令

```bash
# 如果重构过程中出现问题，使用以下命令快速回滚

# 回滚到最近的提交
git reset --hard HEAD

# 回滚到重构前的状态
git checkout main
git branch -D refactor/project-structure

# 从备份恢复（如果有备份）
# cp -r ../good3-backup-$(date +%Y%m%d)/* .
```

## 📈 性能监控命令

```bash
# 分析包大小
npx webpack-bundle-analyzer .next/static/chunks/*.js

# 检查未使用的依赖
npx depcheck

# 分析代码复杂度
npx complexity-report --format json src/

# 检查重复代码
npx jscpd --min-lines 10 --min-tokens 50 src/
```

---

**使用说明**：
1. 按顺序执行上述命令
2. 每个步骤完成后运行测试脚本验证
3. 遇到问题及时查看错误日志
4. 保持代码提交的频率，便于回滚