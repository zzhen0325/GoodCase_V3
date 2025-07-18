# 图片画廊管理系统 API 接口文档

## 项目概述

本项目是一个基于 Next.js 和 Firebase 的图片画廊管理系统，支持图片上传、标签管理、提示词管理、数据导入导出等功能。

## 接口基本信息

- **基础URL**: `http://localhost:3001/api`
- **数据格式**: JSON
- **认证方式**: 无需认证（本地开发环境）
- **错误码说明**:
  - `200`: 请求成功
  - `400`: 请求参数错误
  - `404`: 资源不存在
  - `500`: 服务器内部错误

## 通用响应格式

```json
{
  "success": boolean,
  "data": any,
  "error": string,
  "timestamp": string
}
```

---

## 1. 图片管理接口

### 1.1 获取所有图片

**接口名称**: 获取图片列表  
**接口描述**: 获取系统中所有图片的信息  
**请求路径**: `/api/images`  
**请求方法**: `GET`  
**接口版本**: v1  

#### 请求参数
无

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "image_123",
      "url": "https://firebasestorage.googleapis.com/...",
      "title": "示例图片",
      "prompts": [
        {
          "id": "prompt_123",
          "title": "风格",
          "content": "写实风格",
          "color": "#3b82f6",
          "order": 0
        }
      ],
      "tags": [
        {
          "id": "tag_123",
          "name": "风景",
          "color": "#22c55e",
          "groupId": "group_123"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "获取图片失败"
}
```

### 1.2 上传图片

**接口名称**: 图片上传  
**接口描述**: 上传新图片到系统  
**请求路径**: `/api/images`  
**请求方法**: `POST`  
**接口版本**: v1  

#### 请求参数

**请求体参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| imageUrl | string | 是 | 图片URL（Firebase Storage） | "https://firebasestorage.googleapis.com/..." |
| filename | string | 否 | 文件名 | "example.jpg" |
| size | number | 否 | 文件大小（字节） | 1024000 |
| type | string | 否 | 文件类型 | "image/jpeg" |
| prompt | string | 是 | 提示词内容 | "美丽的风景照片" |

**请求示例**:
```json
{
  "imageUrl": "https://firebasestorage.googleapis.com/v0/b/project/o/images%2Fexample.jpg",
  "filename": "example.jpg",
  "size": 1024000,
  "type": "image/jpeg",
  "prompt": "美丽的风景照片"
}
```

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "image_new_123"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "缺少图片URL",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 1.3 获取单个图片

**接口名称**: 获取图片详情  
**接口描述**: 根据ID获取单个图片的详细信息  
**请求路径**: `/api/images/{id}`  
**请求方法**: `GET`  
**接口版本**: v1  

#### 请求参数

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| id | string | 是 | 图片ID |

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "image_123",
    "url": "https://firebasestorage.googleapis.com/...",
    "title": "示例图片",
    "prompts": [...],
    "tags": [...],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "图片不存在"
}
```

### 1.4 更新图片

**接口名称**: 更新图片信息  
**接口描述**: 更新图片的标题、标签、提示词等信息  
**请求路径**: `/api/images/{id}`  
**请求方法**: `PUT`  
**接口版本**: v1  

#### 请求参数

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| id | string | 是 | 图片ID |

**请求体参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| title | string | 否 | 图片标题 |
| tags | array | 否 | 标签数组 |
| prompts | array | 否 | 提示词数组 |

**请求示例**:
```json
{
  "title": "更新后的标题",
  "tags": ["tag_123", "tag_456"],
  "prompts": [
    {
      "id": "prompt_123",
      "title": "风格",
      "content": "更新的提示词",
      "color": "#3b82f6",
      "order": 0
    }
  ]
}
```

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "image_123",
    "title": "更新后的标题",
    // ... 其他字段
  }
}
```

### 1.5 删除图片

**接口名称**: 删除图片  
**接口描述**: 删除指定的图片及其关联数据  
**请求路径**: `/api/images/{id}`  
**请求方法**: `DELETE`  
**接口版本**: v1  

#### 请求参数

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| id | string | 是 | 图片ID |

#### 响应数据

**成功响应示例**:
```json
{
  "success": true
}
```

---

## 2. 文件上传接口

### 2.1 验证上传文件

**接口名称**: 文件上传验证  
**接口描述**: 验证上传的文件URL是否有效  
**请求路径**: `/api/upload`  
**请求方法**: `POST`  
**接口版本**: v1  

#### 请求参数

**请求体参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| imageUrl | string | 是 | 图片URL |
| metadata | object | 否 | 文件元数据 |

**约束条件**:
- imageUrl 必须是有效的URL格式
- imageUrl 必须是Firebase Storage的URL
- 支持的图片格式：jpg, jpeg, png, gif, webp, svg
- 最大文件大小：10MB

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "url": "https://firebasestorage.googleapis.com/...",
    "metadata": {}
  }
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "只允许Firebase Storage的图片URL"
}
```

---

## 3. 标签管理接口

### 3.1 获取所有标签

**接口名称**: 获取标签列表  
**接口描述**: 获取系统中所有标签  
**请求路径**: `/api/tags`  
**请求方法**: `GET`  
**接口版本**: v1  
**状态**: 已修复  

#### 请求参数
无

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": "tag_123",
        "name": "风景",
        "color": "#22c55e",
        "groupId": "group_123",
        "usageCount": 5,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### 3.2 创建标签

**接口名称**: 创建标签  
**接口描述**: 创建新标签  
**请求路径**: `/api/tags`  
**请求方法**: `POST`  
**接口版本**: v1  
**状态**: 已修复  

#### 请求参数

**请求体参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| name | string | 是 | 标签名称 | "风景" |
| color | string | 是 | 标签颜色（十六进制） | "#22c55e" |
| groupId | string | 否 | 所属分组ID | "group_123" |

**请求示例**:
```json
{
  "name": "风景",
  "color": "#22c55e",
  "groupId": "group_123"
}
```

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "tag": {
      "id": "tag_new_123",
      "name": "风景",
      "color": "#22c55e",
      "groupId": "group_123",
      "usageCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "标签名称不能为空",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3.3 更新标签

**接口名称**: 更新标签信息  
**接口描述**: 更新指定标签的名称、颜色等信息  
**请求路径**: `/api/tags/{id}`  
**请求方法**: `PUT`  
**接口版本**: v1  

#### 请求参数

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| id | string | 是 | 标签ID |

**请求体参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| name | string | 是 | 标签名称 |
| color | string | 是 | 标签颜色（十六进制） |
| groupId | string | 是 | 所属分组ID |

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "tag_123",
    "name": "更新后的标签",
    "color": "#22c55e",
    "groupId": "group_123"
  }
}
```

### 3.4 删除标签

**接口名称**: 删除标签  
**接口描述**: 删除指定标签并从所有图片中移除  
**请求路径**: `/api/tags/{id}`  
**请求方法**: `DELETE`  
**接口版本**: v1  

#### 请求参数

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| id | string | 是 | 标签ID |

#### 响应数据

**成功响应示例**:
```json
{
  "success": true
}
```

---

## 4. 提示词管理接口

### 4.1 获取所有提示词

**接口名称**: 获取提示词列表  
**接口描述**: 获取系统中所有提示词  
**请求路径**: `/api/prompts`  
**请求方法**: `GET`  
**接口版本**: v1  

#### 请求参数
无

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prompt_123",
      "title": "风格描述",
      "text": "写实风格，高清画质"
    }
  ]
}
```

---

## 5. 标签分组管理接口

### 5.1 获取所有标签分组

**接口名称**: 获取标签分组列表  
**接口描述**: 获取系统中所有标签分组  
**请求路径**: `/api/tag-groups`  
**请求方法**: `GET`  
**接口版本**: v1  
**状态**: 已修复  

#### 请求参数
无

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "tagGroups": [
      {
        "id": "group_123",
        "name": "风格分类",
        "color": "#3b82f6",
        "description": "图片风格相关标签",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "获取标签分组失败"
}
```

### 5.2 创建标签分组

**接口名称**: 创建标签分组  
**接口描述**: 创建新的标签分组  
**请求路径**: `/api/tag-groups`  
**请求方法**: `POST`  
**接口版本**: v1  
**状态**: 已修复  

#### 请求参数

**请求体参数**:
| 参数名 | 类型 | 必填 | 描述 | 示例值 |
|--------|------|------|------|--------|
| name | string | 是 | 分组名称 | "风格分类" |
| color | string | 是 | 分组颜色（十六进制） | "#3b82f6" |
| description | string | 否 | 分组描述 | "图片风格相关标签" |

**请求示例**:
```json
{
  "name": "风格分类",
  "color": "#3b82f6",
  "description": "图片风格相关标签"
}
```

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "tagGroup": {
      "id": "group_new_123",
      "name": "风格分类",
      "color": "#3b82f6",
      "description": "图片风格相关标签",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "分组名称不能为空",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5.3 更新标签分组

**接口名称**: 更新标签分组信息  
**接口描述**: 更新指定标签分组的名称、颜色等信息  
**请求路径**: `/api/tag-groups/{id}`  
**请求方法**: `PUT`  
**接口版本**: v1  

#### 请求参数

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| id | string | 是 | 标签分组ID |

**请求体参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| name | string | 是 | 分组名称 |
| color | string | 是 | 分组颜色（十六进制） |
| description | string | 否 | 分组描述 |

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "group_123",
    "name": "更新后的分组",
    "color": "#22c55e",
    "description": "更新后的描述"
  }
}
```

### 5.4 删除标签分组

**接口名称**: 删除标签分组  
**接口描述**: 删除指定标签分组及其下所有标签  
**请求路径**: `/api/tag-groups/{id}`  
**请求方法**: `DELETE`  
**接口版本**: v1  

#### 请求参数

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| id | string | 是 | 标签分组ID |

#### 响应数据

**成功响应示例**:
```json
{
  "success": true
}
```

---

## 6. 数据导入导出接口

### 6.1 导出数据

**接口名称**: 数据导出  
**接口描述**: 导出系统中所有数据为JSON文件  
**请求路径**: `/api/export`  
**请求方法**: `GET`  
**接口版本**: v1  

#### 请求参数
无

#### 响应数据

**响应格式**: JSON文件下载  
**文件名格式**: `gallery-export-YYYY-MM-DD.json`  

**响应头**:
```
Content-Type: application/json
Content-Disposition: attachment; filename="gallery-export-2024-01-01.json"
Cache-Control: no-cache
```

**文件内容示例**:
```json
{
  "version": "1.0",
  "exportDate": "2024-01-01T00:00:00.000Z",
  "images": [...],
  "tags": [...],
  "metadata": {
    "totalImages": 100,
    "totalTags": 50
  }
}
```

### 6.2 导入数据

**接口名称**: 数据导入  
**接口描述**: 从JSON文件导入数据到系统  
**请求路径**: `/api/import`  
**请求方法**: `POST`  
**接口版本**: v1  

#### 请求参数

**请求体参数**:
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|----- |
| data | object | 是 | 导出的数据对象 |

**数据格式约束**:
- data.version: 必须存在
- data.images: 必须是数组
- 每个图片对象必须包含基本字段

#### 响应数据

**成功响应示例**:
```json
{
  "imported": 95,
  "failed": 5,
  "total": 100
}
```

**错误响应示例**:
```json
{
  "error": "无效的导入数据格式"
}
```

---

## 7. 健康检查接口

### 7.1 Firebase健康检查

**接口名称**: Firebase连接检查  
**接口描述**: 检查Firebase服务的连接状态和配置  
**请求路径**: `/api/health/firebase`  
**请求方法**: `GET`  
**接口版本**: v1  

#### 请求参数
无

#### 响应数据

**成功响应示例**:
```json
{
  "success": true,
  "data": {
    "overall": "healthy",
    "client": {
      "status": "healthy",
      "errors": [],
      "warnings": []
    },
    "admin": {
      "status": "healthy",
      "errors": [],
      "warnings": []
    },
    "report": {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "details": "..."
    }
  }
}
```

**错误响应示例**:
```json
{
  "success": false,
  "error": "Firebase健康检查失败",
  "details": "连接超时"
}
```

---

## 8. 数据类型定义

### 8.1 核心数据类型

#### ImageData
```typescript
interface ImageData {
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
```

#### Tag
```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
  groupId: string;
  order?: number;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
```

#### Prompt
```typescript
interface Prompt {
  id: string;
  title: string;
  content: string;
  color: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}
```

### 8.2 响应类型

#### ApiResponse
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}
```

#### DBResult
```typescript
interface DBResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
```

---

## 9. 错误处理

### 9.1 常见错误码

| 错误码 | 描述 | 解决方案 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数格式和必填字段 |
| 404 | 资源不存在 | 确认资源ID是否正确 |
| 500 | 服务器内部错误 | 查看服务器日志，联系开发人员 |

### 9.2 错误响应格式

```json
{
  "success": false,
  "error": "错误描述信息",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 10. 使用限制和约束

### 10.1 请求频率限制
- 无特殊限制（本地开发环境）

### 10.2 数据格式约束
- 日期格式：ISO 8601 格式 (YYYY-MM-DDTHH:mm:ss.sssZ)
- 颜色格式：十六进制颜色码 (#RRGGBB)
- URL格式：必须是有效的HTTP/HTTPS URL
- 文件大小：最大10MB
- 图片格式：jpg, jpeg, png, gif, webp, svg

### 10.3 业务约束
- 图片必须上传到Firebase Storage
- 标签支持独立创建和管理，也可从图片数据中自动提取
- 提示词与图片关联存储
- 删除图片时会自动更新相关标签的使用计数
- 标签分组支持完整的CRUD操作

---

## 11. 开发说明

### 11.1 本地开发
- 开发服务器地址：http://localhost:3001
- API基础路径：/api
- 数据库：Firebase Firestore
- 文件存储：Firebase Storage

### 11.2 技术栈
- 框架：Next.js 14
- 数据库：Firebase Firestore
- 存储：Firebase Storage
- 语言：TypeScript
- 样式：Tailwind CSS

### 11.3 注意事项
- 部分接口已废弃或简化，请参考具体接口说明
- 标签和标签分组功能已简化，现在从图片数据中自动提取
- 所有文件上传都通过Firebase Storage处理
- 接口响应时间可能因网络和数据量而异

---

**文档版本**: v1.0  
**最后更新**: 2024-01-01  
**维护人员**: 开发团队