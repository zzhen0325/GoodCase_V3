# Gooodcase

一个基于Next.js和Firebase的现代化图片管理应用，支持图片上传、标签管理、搜索和数据导入导出功能。

## 功能特点

- 📸 **图片管理** - 支持图片上传、预览、编辑和删除
- 🏷️ **标签系统** - 灵活的标签分类和管理
- 🔍 **智能搜索** - 基于标题、标签和提示词的搜索功能
- 📱 **响应式设计** - 适配桌面和移动设备
- 🎨 **现代化UI** - 使用Tailwind CSS和Framer Motion
- ☁️ **云端存储** - 基于Firebase的实时数据同步
- 📦 **数据导入导出** - 支持数据备份和迁移
- 🔄 **离线支持** - 网络断开时的本地缓存功能
- 🖼️ **图片详情弹窗** - 支持多种关闭方式（按钮、ESC键、遮罩层）

## 技术栈

- **前端框架**: Next.js 14, React 18
- **样式**: Tailwind CSS, Framer Motion
- **UI组件**: Radix UI, DND Kit
- **后端服务**: Firebase (Firestore, Storage, Auth)
- **类型检查**: TypeScript
- **状态管理**: React Hooks + Context

## 开始使用

### 1. 克隆仓库

```bash
git clone [repository-url]
cd good3
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置Firebase

复制环境变量模板：

```bash
cp .env.example .env.local
```

在 `.env.local` 中配置你的Firebase项目信息：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. 运行开发服务器

```bash
npm run dev
```

### 5. 打开浏览器访问 `http://localhost:3000`

## 构建部署

```bash
npm run build
npm start
```

## 项目结构

```
├── app/                 # Next.js App Router
│   ├── api/            # API路由
│   ├── globals.css     # 全局样式
│   └── page.tsx        # 主页面
├── components/         # React组件
│   ├── ui/            # 基础UI组件
│   └── ...            # 业务组件
├── lib/               # 工具库
│   ├── firebase.ts    # Firebase配置
│   ├── database.ts    # 数据库操作
│   └── ...           # 其他工具
├── types/             # TypeScript类型定义
└── hooks/             # 自定义Hooks
```

## API文档

### 图片管理

- `GET /api/images` - 获取图片列表
- `POST /api/images` - 上传新图片
- `PUT /api/images/[id]` - 更新图片信息
- `DELETE /api/images/[id]` - 删除图片

### 标签管理

- `GET /api/tags` - 获取所有标签
- `POST /api/tags` - 创建新标签

### 提示词管理

- `GET /api/prompts` - 获取所有提示词

### 数据导入导出

- `GET /api/export` - 导出数据
- `POST /api/import` - 导入数据
- `GET /api/export-package` - 导出完整数据包
- `POST /api/migrate-to-firestore` - 迁移数据到Firestore

## 开发指南

### 添加新功能

1. 在 `types/` 目录下定义相关类型
2. 在 `lib/database.ts` 中添加数据库操作方法
3. 在 `app/api/` 下创建API路由
4. 在 `components/` 中创建UI组件
5. 更新相关的Hooks和Context

### 数据库操作

项目使用Firebase Firestore作为数据库，主要集合包括：

- `images` - 图片信息
- `tags` - 标签数据
- `prompts` - 提示词数据

### 样式指南

- 使用Tailwind CSS进行样式设计
- 遵循响应式设计原则
- 使用Framer Motion添加动画效果
- 保持组件的可复用性

## 最近更新

### 2024-12-19
- 🚀 **重大优化**：上传和更新图片逻辑全面优化
  - ✅ 实现批量操作和原子性保证，确保数据一致性
  - ✅ 添加标签usageCount维护，提升统计准确性
  - ✅ 实现异常回滚机制，避免垃圾文件
  - ✅ 添加图片元数据获取，确保数据准确性
  - ✅ 优化前端上传逻辑，提升用户体验
- 🔧 代码清理：移除过时的类型定义和冗余调试日志
- 🐛 修复类型安全问题，提升代码质量
- 📝 完善文档和错误处理

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开Pull Request

## 许可证

MIT
