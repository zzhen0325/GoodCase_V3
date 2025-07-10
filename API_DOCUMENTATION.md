# API 接口文档

本文档描述了迁移到 Firebase 后的 API 接口设计，支持实时数据读写。

## 基础信息

- **基础URL**: `/api`
- **数据格式**: JSON
- **认证**: 暂无（可根据需要添加 Firebase Auth）

## 响应格式

所有 API 响应都遵循统一格式：

```json
{
  "success": boolean,
  "data": any,        // 成功时返回
  "error": string     // 失败时返回
}
```

## 图片相关接口

### 1. 搜索/获取图片

**GET** `/api/images`

支持通过搜索词和标签过滤图片。

**查询参数**:
- `search` (可选): 搜索词，会在图片URL、提示词内容中搜索
- `tags` (可选): 标签列表，用逗号分隔，如 `tag1,tag2,tag3`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "image_id_1",
      "url": "https://firebasestorage.googleapis.com/...",
      "prompts": [
        {
          "id": "prompt_id_1",
          "content": "提示词内容",
          "order": 1
        }
      ],
      "tags": [
        {
          "id": "tag_id_1",
          "name": "标签名称",
          "color": "#FF5733",
          "usageCount": 5
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. 获取单个图片

**GET** `/api/images/{id}`

**路径参数**:
- `id`: 图片ID

**响应**: 同上，但 `data` 为单个图片对象

### 3. 添加图片

**POST** `/api/images`

用于添加已上传到 Firebase Storage 的图片信息。

**请求体**:
```json
{
  "url": "https://firebasestorage.googleapis.com/...",
  "prompts": [
    {
      "content": "提示词内容",
      "order": 1
    }
  ],
  "tags": [
    {
      "name": "标签名称",
      "color": "#FF5733"
    }
  ]
}
```

**响应**: 创建的图片对象

### 4. 更新图片

**PUT** `/api/images/{id}`

**路径参数**:
- `id`: 图片ID

**请求体**: 同添加图片，但所有字段都是可选的

**响应**: 更新后的图片对象

### 5. 删除图片

**DELETE** `/api/images/{id}`

删除图片信息和 Firebase Storage 中的文件。

**路径参数**:
- `id`: 图片ID

**响应**:
```json
{
  "success": true
}
```

## 标签相关接口

### 1. 获取所有标签

**GET** `/api/tags`

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "tag_id_1",
      "name": "标签名称",
      "color": "#FF5733",
      "usageCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## 上传相关接口

### 1. 验证上传

**POST** `/api/upload`

验证已上传到 Firebase Storage 的图片URL。

**请求体**:
```json
{
  "imageUrl": "https://firebasestorage.googleapis.com/...",
  "metadata": {
    "originalName": "image.jpg",
    "size": 1024000
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "url": "https://firebasestorage.googleapis.com/...",
    "metadata": {
      "originalName": "image.jpg",
      "size": 1024000
    }
  }
}
```

## 数据模型

### ImageData
```typescript
interface ImageData {
  id: string;
  url: string;
  prompts: Prompt[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}
```

### Prompt
```typescript
interface Prompt {
  id: string;
  content: string;
  order: number;
}
```

### Tag
```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}
```

## 实时数据

### 客户端实时监听

使用 Firebase SDK 可以实现实时数据监听：

```typescript
import { Database } from '@/lib/database';

// 监听图片数据变化
const unsubscribe = Database.subscribeToImages((images) => {
  console.log('图片数据更新:', images);
});

// 取消监听
unsubscribe();
```

### 搜索和过滤

```typescript
// 搜索图片
const searchResults = await Database.searchImages({
  searchTerm: '风景',
  tags: ['自然', '山水']
});
```

## 错误处理

### 常见错误码

- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

### 错误响应示例

```json
{
  "success": false,
  "error": "图片不存在"
}
```

## 环境配置

### 环境变量

```env
# Firebase 客户端配置
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket

# Firebase Admin 配置（服务端）
FIREBASE_SERVICE_ACCOUNT_KEY=your_service_account_key_json
```

### Firebase 安全规则

**Firestore 规则示例**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 图片集合
    match /images/{imageId} {
      allow read, write: if true; // 根据需要调整权限
    }
    
    // 标签集合
    match /tags/{tagId} {
      allow read, write: if true; // 根据需要调整权限
    }
  }
}
```

**Storage 规则示例**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{allPaths=**} {
      allow read, write: if true; // 根据需要调整权限
    }
  }
}
```

## 迁移说明

### 主要变化

1. **数据存储**: 从 Neon PostgreSQL 迁移到 Firebase Firestore
2. **文件存储**: 图片文件存储到 Firebase Storage
3. **实时功能**: 支持实时数据监听和更新
4. **搜索功能**: 改进的搜索和过滤功能
5. **API 设计**: 更加 RESTful 的 API 设计

### 客户端使用

```typescript
import { ApiClient } from '@/lib/api';
import { ImageStorageService } from '@/lib/image-storage';

// 上传图片
const file = // File 对象
const uploadResult = await ImageStorageService.uploadImage(file);

// 添加图片信息
const imageData = await ApiClient.addImage({
  url: uploadResult.url,
  prompts: [{ content: '美丽的风景', order: 1 }],
  tags: [{ name: '自然', color: '#4CAF50' }]
});

// 搜索图片
const images = await ApiClient.searchImages({
  searchTerm: '风景',
  tags: ['自然']
});
```