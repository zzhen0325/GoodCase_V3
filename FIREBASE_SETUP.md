# Firebase 初始化指南

本文档提供了完整的 Firebase Storage 和 Firestore 初始化步骤。

## 🚀 快速开始

### 1. 环境配置

确保你的 `.env.local` 文件包含正确的 Firebase 配置：

```env
# Firebase 客户端配置
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin 配置
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. 安装依赖

```bash
npm install
```

### 3. 运行初始化脚本

```bash
npm run firebase:init
```

这个脚本将：
- 创建默认标签（自然、人像、风景、抽象）
- 设置 Storage 目录结构
- 输出建议的安全规则

## 📋 手动配置步骤

### 1. Firebase Console 配置

#### 启用服务
1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择你的项目
3. 启用以下服务：
   - **Firestore Database**
   - **Storage**
   - **Authentication**（可选）

#### 设置安全规则

**Firestore 规则：**
```javascript
// 复制 firebase/firestore.rules 的内容到 Firebase Console
```

**Storage 规则：**
```javascript
// 复制 firebase/storage.rules 的内容到 Firebase Console
```

#### 创建复合索引

在 Firestore > 索引 中创建以下复合索引：

1. **图片搜索索引**
   - 集合：`images`
   - 字段：`tags` (数组), `createdAt` (降序)

2. **图片URL索引**
   - 集合：`images`
   - 字段：`url` (升序), `createdAt` (降序)

3. **提示词搜索索引**
   - 集合：`images`
   - 字段：`prompts` (数组), `createdAt` (降序)

4. **标签使用统计索引**
   - 集合：`tags`
   - 字段：`usageCount` (降序), `name` (升序)

### 2. 服务账号配置

1. 在 Firebase Console > 项目设置 > 服务账号
2. 生成新的私钥
3. 下载 JSON 文件
4. 将私钥信息添加到 `.env.local`

## 🛠️ 可用脚本

```bash
# 初始化 Firebase
npm run firebase:init

# 启动 Firebase 模拟器
npm run firebase:emulators

# 部署到 Firebase
npm run firebase:deploy

# 仅部署安全规则
npm run firebase:deploy:rules

# 仅部署索引
npm run firebase:deploy:indexes
```

## 📊 数据结构

### Images 集合

```typescript
interface Image {
  id: string;
  url: string;
  prompts: Array<{
    content: string;
    order: number;
  }>;
  tags: Array<{
    name: string;
    color: string;
  }>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Tags 集合

```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🔧 本地开发

### 使用 Firebase 模拟器

```bash
# 启动模拟器
npm run firebase:emulators
```

模拟器将在以下端口运行：
- **Firestore**: http://localhost:8080
- **Storage**: http://localhost:9199
- **Auth**: http://localhost:9099
- **模拟器 UI**: http://localhost:4000

### 环境变量配置

在使用模拟器时，确保设置：

```env
# 开发环境
NODE_ENV=development

# 模拟器配置（可选）
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
```

## 🚨 故障排除

### 常见问题

1. **权限错误**
   - 检查服务账号密钥是否正确
   - 确认项目 ID 匹配

2. **索引错误**
   - 运行初始化脚本后，手动在 Firebase Console 创建索引
   - 等待索引构建完成（可能需要几分钟）

3. **存储上传失败**
   - 检查 Storage 安全规则
   - 确认文件大小和类型限制

### 调试技巧

```bash
# 查看 Firebase 项目信息
firebase projects:list

# 检查当前项目
firebase use

# 测试安全规则
firebase firestore:rules:test
```

## 📈 性能优化

1. **索引优化**
   - 根据查询模式创建复合索引
   - 避免不必要的字段索引

2. **存储优化**
   - 使用适当的图片格式和压缩
   - 实施缓存策略

3. **查询优化**
   - 使用分页限制结果数量
   - 实施客户端缓存

## 🔐 安全最佳实践

1. **认证**
   - 启用 Firebase Authentication
   - 实施适当的用户权限

2. **数据验证**
   - 在安全规则中验证数据结构
   - 限制文件大小和类型

3. **访问控制**
   - 最小权限原则
   - 定期审查安全规则

---

完成这些步骤后，你的 Firebase Storage 和 Firestore 就已经完全初始化并可以使用了！