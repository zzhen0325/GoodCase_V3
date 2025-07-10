# Firebase Storage 配置和使用指南

本项目已集成 Firebase Storage 功能，支持文件上传、下载、删除等操作。以下是详细的配置和使用说明。

## 📋 目录

- [环境配置](#环境配置)
- [文件结构](#文件结构)
- [基本使用](#基本使用)
- [高级功能](#高级功能)
- [API 参考](#api-参考)
- [故障排除](#故障排除)

## 🔧 环境配置

### 1. Firebase 项目设置

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Cloud Storage
4. 配置安全规则（参考 `firebase-storage-rules.txt`）

### 2. 获取配置信息

#### 客户端配置
在 Firebase Console 中：
1. 进入项目设置
2. 选择「常规」选项卡
3. 在「您的应用」部分添加 Web 应用
4. 复制配置对象

#### 服务端配置 (Admin SDK)
1. 进入项目设置
2. 选择「服务帐号」选项卡
3. 点击「生成新的私钥」
4. 下载 JSON 文件

### 3. 环境变量配置

复制 `.env.example` 为 `.env.local` 并填入实际值：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# 客户端配置
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# 服务端配置
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## 📁 文件结构

```
lib/
├── firebase.ts                    # 客户端 Firebase 配置
├── firebase-server.ts             # 服务端 Firebase 配置
├── firebase-storage-example.ts    # 完整的 Storage 使用示例
├── image-storage.ts               # 图片存储工具
├── database.ts                    # 数据库操作
└── database-admin.ts              # 管理员数据库操作
```

## 🚀 基本使用

### 文件上传

#### 简单上传（小文件）

```typescript
import { FirebaseStorageUploader } from '@/lib/firebase-storage-example';

// 上传文件
const uploadFile = async (file: File) => {
  try {
    const downloadURL = await FirebaseStorageUploader.uploadFile(
      file,
      `uploads/${file.name}`,
      {
        contentType: file.type,
        customMetadata: {
          uploadedBy: 'user123',
          uploadedAt: new Date().toISOString()
        }
      }
    );
    
    console.log('文件上传成功:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('上传失败:', error);
  }
};
```

#### 可恢复上传（大文件，带进度）

```typescript
import { FirebaseStorageUploader } from '@/lib/firebase-storage-example';

const uploadLargeFile = async (file: File) => {
  try {
    const downloadURL = await FirebaseStorageUploader.uploadFileResumable(
      file,
      `large-files/${file.name}`,
      (progress) => {
        const percent = (progress.bytesTransferred / progress.totalBytes) * 100;
        console.log(`上传进度: ${percent.toFixed(2)}%`);
        
        // 更新 UI 进度条
        updateProgressBar(percent);
      },
      {
        contentType: file.type
      }
    );
    
    console.log('大文件上传成功:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('上传失败:', error);
  }
};
```

### 文件下载

#### 获取下载 URL

```typescript
import { FirebaseStorageDownloader } from '@/lib/firebase-storage-example';

const getFileURL = async (filePath: string) => {
  try {
    const downloadURL = await FirebaseStorageDownloader.getDownloadURL(filePath);
    console.log('下载 URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('获取下载 URL 失败:', error);
  }
};
```

#### 下载文件数据

```typescript
import { FirebaseStorageDownloader } from '@/lib/firebase-storage-example';

// 下载为字节数组
const downloadAsBytes = async (filePath: string) => {
  try {
    const arrayBuffer = await FirebaseStorageDownloader.downloadAsBytes(
      filePath,
      1024 * 1024 * 10 // 最大 10MB
    );
    
    console.log('文件大小:', arrayBuffer.byteLength, 'bytes');
    return arrayBuffer;
  } catch (error) {
    console.error('下载失败:', error);
  }
};

// 下载为 Blob（仅浏览器）
const downloadAsBlob = async (filePath: string) => {
  try {
    const blob = await FirebaseStorageDownloader.downloadAsBlob(filePath);
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'downloaded-file';
    a.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下载失败:', error);
  }
};
```

### 文件管理

#### 删除文件

```typescript
import { FirebaseStorageManager } from '@/lib/firebase-storage-example';

const deleteFile = async (filePath: string) => {
  try {
    await FirebaseStorageManager.deleteFile(filePath);
    console.log('文件删除成功');
  } catch (error) {
    console.error('删除失败:', error);
  }
};
```

#### 获取文件元数据

```typescript
import { FirebaseStorageManager } from '@/lib/firebase-storage-example';

const getMetadata = async (filePath: string) => {
  try {
    const metadata = await FirebaseStorageManager.getFileMetadata(filePath);
    console.log('文件信息:', {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated
    });
    return metadata;
  } catch (error) {
    console.error('获取元数据失败:', error);
  }
};
```

## 🎨 图片处理

### 图片上传与验证

```typescript
import { ImageStorageUtils } from '@/lib/firebase-storage-example';

const uploadImage = async (file: File) => {
  try {
    // 验证图片
    ImageStorageUtils.validateImageFile(
      file,
      5, // 最大 5MB
      ['image/jpeg', 'image/png', 'image/webp'] // 允许的格式
    );
    
    // 上传图片
    const result = await ImageStorageUtils.uploadImageWithThumbnail(
      file,
      'gallery', // 基础路径
      (progress) => {
        console.log(`上传进度: ${(progress.bytesTransferred / progress.totalBytes * 100).toFixed(2)}%`);
      }
    );
    
    console.log('图片上传成功:', result.originalUrl);
    return result;
  } catch (error) {
    console.error('图片上传失败:', error);
  }
};
```

## 🔧 高级功能

### 批量操作

```typescript
import { FirebaseStorageManager } from '@/lib/firebase-storage-example';

// 列出目录下的所有文件
const listAllFiles = async (folderPath: string) => {
  try {
    const { files, folders } = await FirebaseStorageManager.listFiles(folderPath);
    
    console.log('文件列表:', files);
    console.log('文件夹列表:', folders);
    
    return { files, folders };
  } catch (error) {
    console.error('列出文件失败:', error);
  }
};

// 批量删除文件
const deleteMultipleFiles = async (filePaths: string[]) => {
  const results = await Promise.allSettled(
    filePaths.map(path => FirebaseStorageManager.deleteFile(path))
  );
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`文件 ${filePaths[index]} 删除成功`);
    } else {
      console.error(`文件 ${filePaths[index]} 删除失败:`, result.reason);
    }
  });
};
```

### 自定义元数据

```typescript
import { FirebaseStorageManager } from '@/lib/firebase-storage-example';

// 更新文件元数据
const updateMetadata = async (filePath: string) => {
  try {
    const newMetadata = await FirebaseStorageManager.updateFileMetadata(
      filePath,
      {
        cacheControl: 'public,max-age=3600',
        contentDisposition: 'attachment; filename="download.jpg"',
        customMetadata: {
          category: 'user-upload',
          tags: 'photo,vacation,2024',
          processedAt: new Date().toISOString()
        }
      }
    );
    
    console.log('元数据更新成功:', newMetadata);
  } catch (error) {
    console.error('更新元数据失败:', error);
  }
};
```

## 📚 API 参考

### FirebaseStorageUploader

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `uploadFile()` | 简单文件上传 | `file, path, metadata?` | `Promise<string>` |
| `uploadFileResumable()` | 可恢复文件上传 | `file, path, onProgress?, metadata?` | `Promise<string>` |
| `uploadString()` | 上传字符串数据 | `data, path, format?, metadata?` | `Promise<string>` |

### FirebaseStorageDownloader

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `getDownloadURL()` | 获取下载 URL | `path` | `Promise<string>` |
| `downloadAsBytes()` | 下载为字节数组 | `path, maxSize?` | `Promise<ArrayBuffer>` |
| `downloadAsBlob()` | 下载为 Blob | `path, maxSize?` | `Promise<Blob>` |

### FirebaseStorageManager

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `deleteFile()` | 删除文件 | `path` | `Promise<void>` |
| `getFileMetadata()` | 获取文件元数据 | `path` | `Promise<any>` |
| `updateFileMetadata()` | 更新文件元数据 | `path, metadata` | `Promise<any>` |
| `listFiles()` | 列出目录文件 | `path` | `Promise<{files, folders}>` |

### ImageStorageUtils

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `validateImageFile()` | 验证图片文件 | `file, maxSizeMB?, allowedTypes?` | `void` |
| `generateUniqueFilename()` | 生成唯一文件名 | `originalName, prefix?` | `string` |
| `uploadImageWithThumbnail()` | 上传图片 | `file, basePath?, onProgress?` | `Promise<{originalUrl, thumbnailUrl?}>` |

## 🛠️ 故障排除

### 常见错误

#### 1. 权限错误
```
FirebaseError: Missing or insufficient permissions
```

**解决方案：**
- 检查 Firebase Storage 安全规则
- 确保用户已认证（如果规则要求）
- 验证服务账号权限

#### 2. 文件大小限制
```
FirebaseError: File size exceeds maximum allowed size
```

**解决方案：**
- 检查文件大小限制（默认 32MB）
- 使用文件压缩
- 分块上传大文件

#### 3. 网络错误
```
FirebaseError: Network request failed
```

**解决方案：**
- 检查网络连接
- 验证 Firebase 配置
- 检查 CORS 设置

#### 4. 配置错误
```
FirebaseError: No Firebase App '[DEFAULT]' has been created
```

**解决方案：**
- 确保 Firebase 已正确初始化
- 检查环境变量配置
- 验证导入路径

### 调试技巧

1. **启用详细日志：**
```typescript
// 在开发环境中启用详细日志
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Storage 调试模式已启用');
}
```

2. **检查网络请求：**
- 打开浏览器开发者工具
- 查看 Network 选项卡
- 检查 Firebase Storage API 请求

3. **验证配置：**
```typescript
// 验证 Firebase 配置
console.log('Firebase 配置:', {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
});
```

## 📖 参考资源

- [Firebase Storage 官方文档](https://firebase.google.com/docs/storage)
- [Firebase Storage Web API 参考](https://firebase.google.com/docs/reference/js/storage)
- [Firebase Storage 安全规则](https://firebase.google.com/docs/storage/security)
- [Firebase Storage 最佳实践](https://firebase.google.com/docs/storage/best-practices)

## 🤝 贡献

如果您发现问题或有改进建议，请：

1. 创建 Issue 描述问题
2. 提交 Pull Request
3. 更新相关文档

---

**注意：** 请确保不要将 Firebase 私钥或敏感配置信息提交到版本控制系统中。使用 `.env.local` 文件存储敏感信息，并将其添加到 `.gitignore` 中。