# Firebase Base64 服务账户配置指南

本项目支持两种Firebase服务账户配置方式，推荐在CI/CD环境中使用Base64编码方式以提高安全性。

## 配置方式

### 方式1: Base64编码（推荐用于CI/CD）

1. **获取服务账户JSON文件**
   - 在Firebase控制台中下载服务账户密钥文件
   - 将JSON文件转换为Base64编码

2. **转换为Base64**
   ```bash
   # macOS/Linux
   base64 -i your-service-account.json
   
   # 或使用Node.js
   node -e "console.log(Buffer.from(require('fs').readFileSync('your-service-account.json')).toString('base64'))"
   ```

3. **设置环境变量**
   ```bash
   export FIREBASE_SERVICE_ACCOUNT_BASE64="your_base64_encoded_json_here"
   ```

### 方式2: 分离环境变量（开发环境）

设置以下环境变量：
```bash
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_CLIENT_EMAIL="your-client-email"
export FIREBASE_PRIVATE_KEY="your-private-key"
```

## CI/CD 配置

### Google Cloud Build

1. **将Base64密钥存储到Secret Manager**
   ```bash
   gcloud secrets create firebase-service-account --data-file=<(echo -n "your_base64_string")
   ```

2. **在cloudbuild.yaml中使用**
   ```yaml
   steps:
     - name: 'gcr.io/cloud-builders/npm'
       args: ['run', 'build']
       secretEnv: ['FIREBASE_SERVICE_ACCOUNT_BASE64']
   
   availableSecrets:
     secretManager:
       - versionName: projects/${PROJECT_ID}/secrets/firebase-service-account/versions/latest
         env: 'FIREBASE_SERVICE_ACCOUNT_BASE64'
   ```

### GitHub Actions

```yaml
steps:
  - name: Deploy
    env:
      FIREBASE_SERVICE_ACCOUNT_BASE64: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_BASE64 }}
    run: npm run deploy
```

## 部署脚本

项目提供了自动化部署脚本：

```bash
# 开发环境部署
npm run deploy

# 生产环境部署
npm run deploy:production
```

部署脚本会自动：
- 验证环境变量
- 检查Firebase服务账户
- 构建项目
- 部署到Firebase Hosting

## 安全注意事项

1. **永远不要将服务账户JSON文件提交到代码仓库**
2. **使用.gitignore忽略所有*.json文件（除了配置文件）**
3. **在CI/CD环境中使用Secret Manager或加密的环境变量**
4. **定期轮换服务账户密钥**
5. **为服务账户分配最小必要权限**

## 故障排除

### 常见错误

1. **Base64解码失败**
   - 检查Base64字符串是否完整
   - 确保没有换行符或额外空格

2. **权限不足**
   - 确保服务账户有必要的Firebase权限
   - 检查项目ID是否正确

3. **环境变量未设置**
   - 使用部署脚本验证环境变量
   - 检查CI/CD环境中的密钥配置

### 调试命令

```bash
# 验证环境配置
node -e "console.log('Base64 key length:', process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length || 'Not set')"

# 测试Base64解码
node -e "try { JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()); console.log('✅ Valid JSON'); } catch(e) { console.log('❌ Invalid JSON:', e.message); }"
```