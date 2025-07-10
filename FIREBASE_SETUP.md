# Firebase Firestore 配置指南

本项目已从 PostgreSQL/Prisma 迁移到 Cloud Firestore。请按照以下步骤配置 Firebase：

## 1. 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击「创建项目」
3. 输入项目名称并完成创建流程
4. **重要：在项目中启用 Firestore Database（原生模式）**

### ⚠️ 重要提示：必须使用 Firestore 原生模式

在创建 Firestore 数据库时，请确保选择 **「原生模式」(Native mode)** 而不是「Datastore 模式」：

1. 进入 Firebase Console → Firestore Database
2. 点击「创建数据库」
3. **选择「以原生模式启动」**
4. 选择数据库位置（建议选择离用户最近的地区）
5. 设置安全规则（开发阶段可选择「以测试模式启动」）

如果项目已配置为 Datastore 模式，会出现以下错误：
```
The Cloud Firestore API is not available for Firestore in Datastore Mode
```

## 2. 创建服务账户

1. 在 Firebase Console 中，进入「项目设置」
2. 选择「服务账户」标签
3. 点击「生成新的私钥」
4. 下载 JSON 文件（包含私钥）

## 3. 配置环境变量

在 `.env` 文件中设置以下变量：

```env
# Firebase配置
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**注意：**
- `FIREBASE_PROJECT_ID`：Firebase 项目 ID
- `FIREBASE_CLIENT_EMAIL`：服务账户邮箱地址
- `FIREBASE_PRIVATE_KEY`：服务账户私钥（需要保留换行符 `\n`）

## 4. Firestore 数据结构

### Collections:

#### `images`
```json
{
  "id": "document_id",
  "title": "图片标题",
  "url": "图片URL",
  "prompts": [
    {
      "id": "prompt_id",
      "title": "提示词标题",
      "content": "提示词内容",
      "color": "颜色",
      "order": 0
    }
  ],
  "tags": [
    {
      "id": "tag_id",
      "name": "标签名称",
      "color": "标签颜色"
    }
  ],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `tags`
```json
{
  "id": "document_id",
  "name": "标签名称",
  "color": "标签颜色",
  "usageCount": 0,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 5. 安全规则

在 Firestore 中设置以下安全规则：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允许读写所有文档（开发环境）
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**生产环境请根据需要调整安全规则！**

## 6. 启动应用

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

现在你的应用已经完全配置好 Firebase，可以正常使用了！

## 故障排除

### 常见错误及解决方案

#### 1. "The Cloud Firestore API is not available for Firestore in Datastore Mode"

**原因：** Firebase 项目配置为 Datastore 模式而不是 Firestore 原生模式。

**解决方案：**
1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择你的项目
3. 进入 "Firestore Database"
4. 如果看到 "Datastore" 标签，说明项目配置错误
5. 需要创建新的 Firestore 数据库并选择 "原生模式"



#### 3. 错误代码 7 (PERMISSION_DENIED)

**原因：** 权限不足或安全规则限制。

**解决方案：**
1. 检查服务账户权限
2. 更新 Firestore 安全规则（开发阶段）：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

#### 4. 认证错误

**检查以下配置：**
- `.env` 文件中的 `FIREBASE_PROJECT_ID` 是否正确
- `FIREBASE_CLIENT_EMAIL` 是否匹配服务账户邮箱
- `FIREBASE_PRIVATE_KEY` 是否完整（包含 BEGIN 和 END 标记）

#### 5. 权限错误

**解决方案：**
1. 确保服务账户具有 "Firebase Admin SDK Administrator Service Agent" 角色
2. 检查 Firestore 安全规则是否允许读写操作

### 验证配置

#### 1. 测试 Firebase 连接

访问测试端点检查连接状态：

```
http://localhost:3001/api/test-firebase
```

#### 2. 启动应用

```bash
npm run dev
```

如果配置正确，应用应该能够正常连接到 Firestore。

应用启动后，如果看到以下错误，说明需要按照上述步骤修复配置：
- API 返回 500 错误
- 控制台显示 Firestore 连接错误
- 图片和标签加载失败