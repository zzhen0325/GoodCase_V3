# 轻量级图片标签系统API接口设计

基于之前的数据库设计文档，以下是配套的API接口设计，采用RESTful风格，涵盖所有核心功能。

## 一、API设计原则

1. **RESTful风格**：使用标准HTTP方法和状态码
2. **一致性**：统一的URL命名和响应格式
3. **数据验证**：严格的输入验证和错误提示
4. **分页**：列表接口支持分页参数
5. **过滤**：支持基本的过滤和排序功能
6. **批量操作**：支持批量更新和删除操作
7. **级联处理**：提供级联删除和影响范围预览
8. **性能优化**：支持选择性字段加载和缓存策略

## 二、通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": { ... },  // 响应数据
  "meta": {         // 元数据（分页等信息）
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "请求的资源不存在",
    "details": {
      "field": "categoryId",
      "value": "invalid_id"
    }
  }
}
```

### 验证错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "数据验证失败",
    "details": {
      "errors": [
        {
          "field": "name",
          "message": "分类名称不能为空"
        },
        {
          "field": "color",
          "message": "颜色必须是预设主题之一",
          "allowedValues": ["pink", "cyan", "yellow", "green", "purple"]
        }
      ]
    }
  }
}
```



## 四、标签分类接口

### 1. 获取所有标签分类
- **URL**: `/api/tag-categories`
- **方法**: `GET`

- **查询参数**:
  - `limit` (可选): 每页数量，默认20
  - `page` (可选): 页码，默认1
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "scene",
        "name": "场景",
        "description": "图片中的场景类型",
        "color": "pink",
        "isDefault": false,
        "createdAt": "2025-07-24T08:00:00Z",
        "updatedAt": "2025-07-24T08:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
  ```

### 2. 获取单个标签分类
- **URL**: `/api/tag-categories/{categoryId}`
- **方法**: `GET`
- 
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "scene",
      "name": "场景",
      "description": "图片中的场景类型",
      "color": "pink",
      "isDefault": false,
      "createdAt": "2025-07-24T08:00:00Z",
      "updatedAt": "2025-07-24T08:00:00Z",
      "theme": {
        "primary": "#F4BFEA",
        "secondary": "#F4BFEA",
        "accent": "#F4BFEA",
        "bg": "#FFE5FA",
        "text": "#7F4073"
      }
    }
  }
  ```

### 3. 创建标签分类
- **URL**: `/api/tag-categories`
- **方法**: `POST`

- **请求体**:
  ```json
  {
    "name": "风格",
    "description": "图片的艺术风格",
    "color": "purple"
  }
  ```
- **验证规则**:
  - `name`: 必填，1-50字符，系统内唯一
  - `description`: 可选，最大200字符
  - `color`: 必填，枚举值["pink", "cyan", "yellow", "green", "purple"]
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "style",
      "name": "风格",
      "description": "图片的艺术风格",
      "color": "purple",
      "isDefault": false,
      "createdAt": "2025-07-24T10:30:00Z",
      "updatedAt": "2025-07-24T10:30:00Z"
    }
  }
  ```

### 4. 更新标签分类
- **URL**: `/api/tag-categories/{categoryId}`
- **方法**: `PATCH`

- **请求体**:
  ```json
  {
    "name": "艺术风格",
    "color": "green"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "style",
      "name": "艺术风格",
      "description": "图片的艺术风格",
      "color": "green",
      "isDefault": false,
      "createdAt": "2025-07-24T10:30:00Z",
      "updatedAt": "2025-07-24T11:15:00Z"
    }
  }
  ```

### 5. 删除标签分类（级联删除）
- **URL**: `/api/tag-categories/{categoryId}`
- **方法**: `DELETE`
- **查询参数**:
  - `preview` (可选): 设为true时只返回影响范围，不执行删除

- **预览响应** (`?preview=true`):
  ```json
  {
    "success": true,
    "data": {
      "canDelete": true,
      "isDefault": false,
      "affectedTags": 5,
      "targetCategory": {
        "id": "default",
        "name": "未分类"
      }
    }
  }
  ```

- **删除响应**:
  ```json
  {
    "success": true,
    "data": {
      "message": "分类已成功删除",
      "movedTags": 5,
      "targetCategoryId": "default"
    }
  }
  ```

- **错误响应**（默认分类）:
  ```json
  {
    "success": false,
    "error": {
      "code": "OPERATION_NOT_ALLOWED",
      "message": "默认分类不能删除"
    }
  }
  ```

## 五、标签接口

### 1. 获取所有标签
- **URL**: `/api/tags`
- **方法**: `GET`

- **查询参数**:
  - `categoryId` (可选): 按分类过滤
  - `limit` (可选): 每页数量，默认20
  - `page` (可选): 页码，默认1
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "flower_field",
        "name": "花海",
        "categoryId": "scene",
        "category": {
          "id": "scene",
          "name": "场景",
          "color": "pink"
        },
        "createdAt": "2025-07-24T09:00:00Z",
        "updatedAt": "2025-07-24T09:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 30
    }
  }
  ```

### 2. 获取单个标签
- **URL**: `/api/tags/{tagId}`
- **方法**: `GET`

- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "flower_field",
      "name": "花海",
      "categoryId": "scene",
      "category": {
        "id": "scene",
        "name": "场景",
        "color": "pink",
        "theme": {
          "primary": "#F4BFEA",
          "secondary": "#F4BFEA",
          "accent": "#F4BFEA",
          "bg": "#FFE5FA",
          "text": "#7F4073"
        }
      },
      "createdAt": "2025-07-24T09:00:00Z",
      "updatedAt": "2025-07-24T09:00:00Z"
    }
  }
  ```

### 3. 创建标签
- **URL**: `/api/tags`
- **方法**: `POST`

- **请求体**:
  ```json
  {
    "name": "山水",
    "categoryId": "scene"
  }
  ```
- **验证规则**:
  - `name`: 必填，1-30字符，同一分类内唯一
  - `categoryId`: 必填，必须引用存在的分类ID
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "landscape",
      "name": "山水",
      "categoryId": "scene",
      "createdAt": "2025-07-24T14:20:00Z",
      "updatedAt": "2025-07-24T14:20:00Z"
    }
  }
  ```
- **错误响应**（重复名称）:
  ```json
  {
    "success": false,
    "error": {
      "code": "RESOURCE_CONFLICT",
      "message": "该分类下已存在同名标签",
      "details": {
        "field": "name",
        "categoryId": "scene",
        "existingTagId": "existing_landscape_id"
      }
    }
  }
  ```

### 4. 更新标签
- **URL**: `/api/tags/{tagId}`
- **方法**: `PATCH`

- **请求体**:
  ```json
  {
    "name": "山水风景",
    "categoryId": "style"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "landscape",
      "name": "山水风景",
      "categoryId": "style",
      "createdAt": "2025-07-24T14:20:00Z",
      "updatedAt": "2025-07-24T15:05:00Z"
    }
  }
  ```

### 5. 删除标签（级联删除）
- **URL**: `/api/tags/{tagId}`
- **方法**: `DELETE`
- **查询参数**:
  - `preview` (可选): 设为true时只返回影响范围，不执行删除

- **预览响应** (`?preview=true`):
  ```json
  {
    "success": true,
    "data": {
      "canDelete": true,
      "affectedImages": 12,
      "tagName": "花海"
    }
  }
  ```

- **删除响应**:
  ```json
  {
    "success": true,
    "data": {
      "message": "标签已成功删除",
      "affectedImages": 12
    }
  }
  ```

### 6. 批量操作标签
- **URL**: `/api/tags/batch`
- **方法**: `PATCH`

- **请求体**:
  ```json
  {
    "operation": "update",
    "tagIds": ["tag1", "tag2", "tag3"],
    "updates": {
      "categoryId": "new_category_id"
    }
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "message": "批量更新完成",
      "updatedCount": 3,
      "failedCount": 0
    }
  }
  ```

## 六、图片接口

### 1. 获取图片列表
- **URL**: `/api/images`
- **方法**: `GET`

- **查询参数**:
  - `tagId` (可选): 按标签过滤
  - `status` (可选): 状态过滤，默认"ACTIVE"
  - `sort` (可选): 排序字段，默认"createdAt"
  - `order` (可选): 排序方向，"asc"或"desc"，默认"desc"
  - `limit` (可选): 每页数量，默认20
  - `page` (可选): 页码，默认1
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "img_12345",
        "name": "粉色花海",
        "url": "https://firebasestorage...",
        "tags": [
          {
            "id": "flower_field",
            "name": "花海",
            "categoryId": "scene"
          }
        ],
        "createdAt": "2025-07-24T10:00:00Z",
        "status": "ACTIVE"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 150
    }
  }
  ```

### 2. 获取图片详情
- **URL**: `/api/images/{imageId}`
- **方法**: `GET`

- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "img_12345",
      "storagePath": "images/img_12345.png",
      "url": "https://firebasestorage...",
      "name": "粉色花海",
      "description": "春季拍摄的粉色花海",
      "tags": [
        {
          "id": "flower_field",
          "name": "花海",
          "categoryId": "scene",
          "category": {
            "id": "scene",
            "name": "场景",
            "color": "pink",
            "theme": {
              "primary": "#F4BFEA",
              "secondary": "#F4BFEA",
              "accent": "#F4BFEA",
              "bg": "#FFE5FA",
              "text": "#7F4073"
            }
          }
        }
      ],
      "promptBlocks": [
        {
          "id": "block1",
          "content": "粉色花朵密集分布",
          "color": "pink",
          "theme": {
            "primary": "#F4BFEA",
            "secondary": "#F4BFEA",
            "accent": "#F4BFEA",
            "bg": "#FFE5FA",
            "text": "#7F4073"
          },
          "order": 1
        }
      ],
      "uploaderId": "user_789",
      "createdAt": "2025-07-24T10:00:00Z",
      "updatedAt": "2025-07-24T11:00:00Z",
      "status": "ACTIVE"
    }
  }
  ```

### 3. 上传图片文件
- **URL**: `/api/images/upload`
- **方法**: `POST`
- **内容类型**: `multipart/form-data`
- **请求体**:
  ```
  imageFile: [二进制图片文件]
  ```
- **验证规则**:
  - 支持格式：jpg、jpeg、png、gif、webp
  - 文件大小限制：10MB
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "imageId": "img_12345",
      "url": "https://firebasestorage...",
      "storagePath": "images/img_12345.png"
    }
  }
  ```

### 4. 添加图片元数据
- **URL**: `/api/images/{imageId}/metadata`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "粉色花海",
    "description": "春季拍摄的粉色花海",
    "tags": [
      {
        "isNew": true,
        "name": "花海",
        "category": {
          "isNew": true,
          "name": "场景",
          "description": "图片中的场景类型",
          "color": "pink"
        }
      },
      {
        "isNew": false,
        "id": "spring"
      }
    ],
    "promptBlocks": [
      {
        "content": "粉色花朵密集分布",
        "color": "pink"
      },
      {
        "content": "阳光明媚的户外场景",
        "color": "yellow"
      }
    ]
  }
  ```
- **验证规则**:
  - `name`: 必填，1-100字符
  - `description`: 可选，最大500字符
  - `tags`: 可选数组，支持新建和引用现有标签
  - `promptBlocks`: 可选数组，每个块的验证规则：
    - `content`: 必填，1-200字符
    - `color`: 必填，枚举值["pink", "cyan", "yellow", "green", "purple"]
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "img_12345",
      "name": "粉色花海",
      "url": "https://firebasestorage...",
      "message": "图片元数据添加成功",
      "createdTags": ["new_tag_id_1"],
      "createdCategories": ["new_category_id_1"]
    }
  }
  ```

### 5. 更新图片信息
- **URL**: `/api/images/{imageId}`
- **方法**: `PATCH`
- **请求体**:
  ```json
  {
    "name": "春日粉色花海",
    "description": "2025年春季拍摄的粉色花海",
    "tags": ["flower_field", "spring", "new_tag_id"]
  }
  ```
- **验证规则**:
  - `name`: 可选，1-100字符
  - `description`: 可选，最大500字符
  - `tags`: 可选数组，引用的标签ID必须存在
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "img_12345",
      "name": "春日粉色花海",
      "updatedAt": "2025-07-24T16:40:00Z"
    }
  }
  ```

### 6. 更新图片提示词块
- **URL**: `/api/images/{imageId}/prompt-blocks`
- **方法**: `PUT`
- **请求体**:
  ```json
  [
    {
      "id": "block1",
      "content": "粉色花朵密集分布，非常美丽",
      "color": "pink",
      "order": 1
    },
    {
      "id": "block3",
      "content": "拍摄于公园",
      "color": "green",
      "order": 2
    }
  ]
  ```
- **验证规则**:
  - 每个块的`content`: 必填，1-200字符
  - 每个块的`color`: 必填，枚举值["pink", "cyan", "yellow", "green", "purple"]
  - 每个块的`order`: 必填，正整数，同一图片内唯一
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "message": "提示词块已更新",
      "promptBlocks": [
        {
          "id": "block1",
          "content": "粉色花朵密集分布，非常美丽",
          "color": "pink",
          "order": 1
        },
        {
          "id": "block3",
          "content": "拍摄于公园",
          "color": "green",
          "order": 2
        }
      ]
    }
  }
  ```

### 7. 批量操作图片
- **URL**: `/api/images/batch`
- **方法**: `PATCH`

- **请求体**:
  ```json
  {
    "operation": "update",
    "imageIds": ["img_1", "img_2", "img_3"],
    "updates": {
      "status": "ARCHIVED"
    }
  }
  ```
- **支持的操作**:
  - `update`: 批量更新图片信息
  - `delete`: 批量删除图片
  - `archive`: 批量归档图片
  - `restore`: 批量恢复图片
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "message": "批量操作完成",
      "operation": "update",
      "successCount": 3,
      "failedCount": 0,
      "results": [
        {
          "imageId": "img_1",
          "success": true
        },
        {
          "imageId": "img_2",
          "success": true
        },
        {
          "imageId": "img_3",
          "success": true
        }
      ]
    }
  }
  ```

### 8. 归档图片
- **URL**: `/api/images/{imageId}/archive`
- **方法**: `POST`

- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "message": "图片已归档",
      "status": "ARCHIVED"
    }
  }
  ```

### 9. 恢复图片
- **URL**: `/api/images/{imageId}/restore`
- **方法**: `POST`

- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "message": "图片已恢复",
      "status": "ACTIVE"
    }
  }
  ```

### 10. 删除图片
- **URL**: `/api/images/{imageId}`
- **方法**: `DELETE`

- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "message": "图片已永久删除"
    }
  }
  ```





## 七、系统接口

### 1. 数据验证
- **URL**: `/api/system/validate`
- **方法**: `GET`

- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "isValid": true,
      "issues": {
        "orphanedTags": 0,
        "invalidThemeReferences": 0,
        "brokenImageReferences": 0,
        "duplicateTagNames": []
      },
      "summary": {
        "totalCategories": 5,
        "totalTags": 30,
        "totalImages": 150,
        "activeImages": 145,
        "archivedImages": 5
      }
    }
  }
  ```

### 2. 系统统计
- **URL**: `/api/system/stats`
- **方法**: `GET`

- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "categories": {
        "total": 5,
        "default": 1,
        "custom": 4
      },
      "tags": {
        "total": 30,
        "byCategory": {
          "scene": 12,
          "style": 8,
          "color": 6,
          "default": 4
        }
      },
      "images": {
        "total": 150,
        "active": 145,
        "archived": 5,
        "withTags": 140,
        "withPrompts": 120
      },
      "storage": {
        "totalSize": "2.5GB",
        "averageFileSize": "17MB"
      }
    }
  }
  ```

## 八、主题接口

### 1. 获取所有主题
- **URL**: `/api/themes`
- **方法**: `GET`

- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "pink": {
        "primary": "#F4BFEA",
        "secondary": "#F4BFEA",
        "accent": "#F4BFEA",
        "bg": "#FFE5FA",
        "text": "#7F4073"
      },
      "cyan": {
        "primary": "#80E3F5",
        "secondary": "#80E3F5",
        "accent": "#80E3F5",
        "bg": "#D7F9FF",
        "text": "#54848D"
      },
      "yellow": {
        "primary": "#FFE1B3",
        "secondary": "#FFE1B3",
        "accent": "#FFE1B3",
        "bg": "#FFF7D7",
        "text": "#CF8D4B"
      },
      "green": {
        "primary": "#A6E19E",
        "secondary": "#A6E19E",
        "accent": "#A6E19E",
        "bg": "#D1FFCB",
        "text": "#60BA54"
      },
      "purple": {
        "primary": "#D8C0FF",
        "secondary": "#D8C0FF",
        "accent": "#D8C0FF",
        "bg": "#EADDFF",
        "text": "#A180D7"
      }
    }
  }
  ```

## 九、错误码说明

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| RESOURCE_NOT_FOUND | 资源不存在 | 404 |
| VALIDATION_ERROR | 数据验证失败 | 400 |
| RESOURCE_CONFLICT | 资源冲突（如重名） | 409 |
| OPERATION_NOT_ALLOWED | 操作不被允许（如删除默认分类） | 403 |
| FILE_TOO_LARGE | 文件大小超限 | 413 |
| UNSUPPORTED_FILE_TYPE | 不支持的文件类型 | 415 |
| RATE_LIMIT_EXCEEDED | 请求频率超限 | 429 |
| INTERNAL_ERROR | 服务器内部错误 | 500 |

### 常见错误示例

**验证错误**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "数据验证失败",
    "details": {
      "errors": [
        {
          "field": "name",
          "message": "名称不能为空"
        }
      ]
    }
  }
}
```

**资源冲突**:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_CONFLICT",
    "message": "该分类下已存在同名标签",
    "details": {
      "field": "name",
      "categoryId": "scene",
      "existingTagId": "existing_tag_id"
    }
  }
}
```

**操作不允许**:
```json
{
  "success": false,
  "error": {
    "code": "OPERATION_NOT_ALLOWED",
    "message": "默认分类不能删除"
  }
}
```

## 十、API使用说明

### 基本规则
1. 所有日期时间格式均为ISO 8601格式（UTC）
2. 分页默认从第1页开始，每页20条记录
3. 图片上传接口支持的格式：jpg、jpeg、png、gif、webp
4. 单张图片大小限制：10MB
5. 所有POST/PATCH请求的Content-Type为`application/json`（除文件上传外）

### 数据验证规则
1. **分类验证**：
   - 名称：1-50字符，系统内唯一
   - 颜色：必须是预设主题之一
   - 默认分类不可删除

2. **标签验证**：
   - 名称：1-30字符，同一分类内唯一
   - 必须关联到存在的分类

3. **图片验证**：
   - 名称：1-100字符
   - 描述：最大500字符
   - 提示词块：内容1-200字符，颜色必须是预设主题之一

### 性能建议
1. 使用分页参数控制数据量
2. 利用`fields`参数选择性加载字段
3. 使用批量操作API处理多个资源
4. 合理使用预览功能评估操作影响

### 级联操作说明
1. 删除分类时，关联标签自动移动到默认分类
2. 删除标签时，从所有图片中移除该标签引用
3. 使用`?preview=true`参数可预览操作影响范围
4. 所有级联操作都在事务中执行，确保数据一致性

以上API设计覆盖了轻量级图片标签系统的所有核心功能，遵循RESTful风格，提供了完善的数据验证、批量操作和级联处理机制，同时保持了接口的简洁性和易用性，适合前端调用和第三方集成。