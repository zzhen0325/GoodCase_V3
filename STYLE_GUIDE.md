# Gooodcase 样式指南

## 🎨 颜色系统

### CSS 变量定义 (globals.css)

#### 浅色主题

```css
:root {
  --background: 0 0% 100%; /* 白色背景 */
  --foreground: 222.2 84% 4.9%; /* 深色文字 */
  --card: 0 0% 100%; /* 卡片背景 */
  --card-foreground: 222.2 84% 4.9%; /* 卡片文字 */
  --popover: 0 0% 100%; /* 弹窗背景 */
  --popover-foreground: 222.2 84% 4.9%; /* 弹窗文字 */
  --primary: 222.2 47.4% 11.2%; /* 主色调 */
  --primary-foreground: 210 40% 98%; /* 主色调文字 */
  --secondary: 210 40% 96%; /* 次要色 */
  --secondary-foreground: 222.2 84% 4.9%; /* 次要色文字 */
  --muted: 210 40% 96%; /* 静音色 */
  --muted-foreground: 215.4 16.3% 46.9%; /* 静音色文字 */
  --accent: 210 40% 96%; /* 强调色 */
  --accent-foreground: 222.2 84% 4.9%; /* 强调色文字 */
  --destructive: 0 84.2% 60.2%; /* 危险色 */
  --destructive-foreground: 210 40% 98%; /* 危险色文字 */
  --border: 214.3 31.8% 91.4%; /* 边框色 */
  --input: 214.3 31.8% 91.4%; /* 输入框边框 */
  --ring: 222.2 84% 4.9%; /* 焦点环 */
  --radius: 0.5rem; /* 圆角半径 */
}
```

#### 深色主题

```css
.dark {
  --background: 222.2 84% 4.9%; /* 深色背景 */
  --foreground: 210 40% 98%; /* 浅色文字 */
  --card: 222.2 84% 4.9%; /* 卡片背景 */
  --card-foreground: 210 40% 98%; /* 卡片文字 */
  --popover: 222.2 84% 4.9%; /* 弹窗背景 */
  --popover-foreground: 210 40% 98%; /* 弹窗文字 */
  --primary: 210 40% 98%; /* 主色调 */
  --primary-foreground: 222.2 47.4% 11.2%; /* 主色调文字 */
  --secondary: 217.2 32.6% 17.5%; /* 次要色 */
  --secondary-foreground: 210 40% 98%; /* 次要色文字 */
  --muted: 217.2 32.6% 17.5%; /* 静音色 */
  --muted-foreground: 215 20.2% 65.1%; /* 静音色文字 */
  --accent: 217.2 32.6% 17.5%; /* 强调色 */
  --accent-foreground: 210 40% 98%; /* 强调色文字 */
  --destructive: 0 62.8% 30.6%; /* 危险色 */
  --destructive-foreground: 210 40% 98%; /* 危险色文字 */
  --border: 217.2 32.6% 17.5%; /* 边框色 */
  --input: 217.2 32.6% 17.5%; /* 输入框边框 */
  --ring: 212.7 26.8% 83.9%; /* 焦点环 */
}
```

### 标签和提示词颜色主题

```typescript
export const COLOR_THEMES: ColorTheme[] = [
  { name: "slate", bg: "#f1f5f9", text: "#1e293b" },
  { name: "amber", bg: "#fef3c7", text: "#c2410c" },
  { name: "lime", bg: "#ecfccb", text: "#84cc16" },
  { name: "green", bg: "#dcfce7", text: "#22c55e" },
  { name: "cyan", bg: "#a5f3fc", text: "#0891b2" },
  { name: "sky", bg: "#e0f2fe", text: "#38bdf8" },
  { name: "violet", bg: "#ede9fe", text: "#8b5cf6" },
  { name: "fuchsia", bg: "#fae8ff", text: "#d946ef" },
];
```

## 🧩 UI 组件库

### 基础组件 (components/ui/)

#### Button 组件

**变体 (variants):**

- `default`: 主要按钮 - `bg-primary text-primary-foreground hover:bg-primary/90`
- `destructive`: 危险按钮 - `bg-destructive text-destructive-foreground hover:bg-destructive/90`
- `outline`: 轮廓按钮 - `border border-input bg-background hover:bg-accent hover:text-accent-foreground`
- `secondary`: 次要按钮 - `bg-secondary text-secondary-foreground hover:bg-secondary/80`
- `ghost`: 幽灵按钮 - `hover:text-accent-foreground`
- `link`: 链接按钮 - `text-primary underline-offset-4 hover:underline`

**尺寸 (sizes):**

- `default`: `h-10 px-4 py-2`
- `sm`: `h-9 rounded-md px-3`
- `lg`: `h-11 rounded-md px-8`
- `icon`: `h-10 w-10`

#### Badge 组件

**变体 (variants):**

- `default`: `border-transparent bg-primary text-primary-foreground hover:bg-primary/80`
- `secondary`: `border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80`
- `destructive`: `border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80`
- `outline`: `text-foreground`

#### Card 组件

**基础样式:**

- `Card`: `rounded-3xl bg-card text-card-foreground`
- `CardHeader`: `flex flex-col space-y-1.5 p-6`
- `CardTitle`: `text-2xl font-semibold leading-none tracking-tight`
- `CardDescription`: `text-sm text-muted-foreground`
- `CardContent`: `p-6 pt-0`
- `CardFooter`: `flex items-center p-6 pt-0`

#### Input 组件

**基础样式:**

```css
flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm
ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium
placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2
focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
```

### 其他UI组件

- `Dialog`: 对话框组件
- `Dropdown Menu`: 下拉菜单
- `Label`: 标签组件
- `Popover`: 弹出框
- `Progress`: 进度条
- `Select`: 选择器
- `Separator`: 分隔符
- `Slider`: 滑块
- `Switch`: 开关
- `Toast`: 提示消息
- `Tooltip`: 工具提示

## 🎯 业务组件

### Dock 导航栏

**样式特点:**

- 使用 Framer Motion 动画
- 磁力悬停效果
- 圆角设计 `rounded-2xl`
- 毛玻璃效果背景

### ImageCard 图片卡片

**样式特点:**

- 圆角卡片 `rounded-3xl`
- 悬停动画效果
- 磁力交互效果
- 选择状态指示

### SearchBar 搜索栏

**样式特点:**

- 圆角输入框 `rounded-2xl`
- 图标装饰
- 标签筛选集成

### TagManager 标签管理

**样式特点:**

- 彩色标签 (使用 COLOR_THEMES)
- 圆角标签 `rounded-xl`
- 动态颜色背景

### PromptBlock 提示词块

**样式特点:**

- 可拖拽排序
- 颜色主题切换
- 内联编辑
- 复制功能

## 🎨 动画系统

### Framer Motion 配置

```typescript
const ANIMATION_CONFIG = {
  duration: 0.3,
  ease: [0.25, 0.46, 0.45, 0.94],
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 25,
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};
```

### 常用动画变体

```typescript
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

const hoverVariants = {
  hover: {
    y: -4,
    transition: { duration: 0.2, ease: "easeOut" },
  },
};
```

## 📱 响应式设计

### 断点配置 (tailwind.config.js)

```javascript
screens: {
  "2xl": "1400px",
  "3xl": "1900px"
}
```

### 容器配置

```javascript
container: {
  center: true,
  padding: "2rem",
  screens: {
    "2xl": "1400px"
  }
}
```

## 🎨 自定义样式

### 滚动条样式

```css
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground));
}
```

## 🔧 样式修改指南

### 1. 修改主题颜色

编辑 `app/globals.css` 中的 CSS 变量:

```css
:root {
  --primary: 你的颜色值;
  --secondary: 你的颜色值;
  /* ... 其他颜色 */
}
```

### 2. 修改标签颜色

编辑 `types/index.ts` 中的 `COLOR_THEMES` 数组:

```typescript
export const COLOR_THEMES: ColorTheme[] = [
  { name: "新颜色名", bg: "背景色", text: "文字色" },
  // ... 其他颜色
];
```

### 3. 修改组件样式

- 基础组件: 编辑 `components/ui/` 目录下的对应文件
- 业务组件: 编辑 `components/` 目录下的对应文件

### 4. 修改动画效果

编辑组件中的 Framer Motion 配置或 `ANIMATION_CONFIG` 常量

### 5. 修改圆角大小

编辑 `app/globals.css` 中的 `--radius` 变量或 `tailwind.config.js` 中的 `borderRadius` 配置

## 📦 依赖库

### 样式相关依赖

- `tailwindcss`: 原子化CSS框架
- `tailwindcss-animate`: Tailwind动画插件
- `framer-motion`: 动画库
- `class-variance-authority`: 组件变体管理
- `clsx`: 条件类名工具
- `@radix-ui/*`: 无样式UI组件库
- `lucide-react`: 图标库

### 图标使用

项目使用 Lucide React 图标库，常用图标:

- `Search`, `X`, `Plus`, `Download`, `Upload`
- `Settings`, `Heart`, `FileText`, `Edit3`
- `Check`, `Tag`, `Bot`, `Wrench`
- `Copy`, `Trash2`, `Palette`, `GripVertical`

---

**注意**: 修改样式时请保持设计一致性，遵循现有的设计模式和颜色体系。
