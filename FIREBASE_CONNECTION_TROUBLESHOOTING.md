# Firebase 连接问题解决指南

本文档提供了完整的 Firebase 连接超时问题解决方案和最佳实践。

## 🚨 问题描述

**错误信息：**
```
Firestore (11.10.0): GrpcConnection RPC 'Write' stream error. 
Code: 14 Message: 14 UNAVAILABLE: No connection established. 
Last error: connect ETIMEDOUT 142.251.33.74:443
```

**问题原因：**
- 网络连接不稳定
- 防火墙或代理阻止连接
- DNS 解析问题
- Firebase 服务在某些地区的可达性问题

## 🔧 已应用的修复方案

### 1. 离线优先配置

✅ **启用离线持久化缓存**
```typescript
db = initializeFirestore(app, {
  localCache: {
    kind: 'persistent',
    tabManager: 'optimistic',
    cacheSizeBytes: 50 * 1024 * 1024, // 50MB 缓存
  },
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
});
```

### 2. 网络状态管理

✅ **自动网络状态监听**
- 监听在线/离线状态
- 自动启用/禁用 Firestore 网络
- 连接重试机制（最多3次）

### 3. 长轮询连接

✅ **强制使用长轮询**
- 解决 WebSocket 连接问题
- 提高连接稳定性
- 适用于网络受限环境

## 🛠️ 可用工具和命令

### 诊断工具
```bash
# 运行连接诊断
npm run firebase:diagnostics

# 应用连接修复
npm run firebase:fix

# 初始化 Firebase
npm run firebase:init
```

### 模拟器选项（推荐用于开发）
```bash
# 启动 Firebase 模拟器
npm run firebase:emulators

# 在 .env.local 中启用模拟器
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
```

## 🌐 网络环境解决方案

### 方案 1：DNS 优化
```bash
# Windows 设置 DNS
netsh interface ip set dns "Wi-Fi" static 8.8.8.8
netsh interface ip add dns "Wi-Fi" 1.1.1.1 index=2

# 刷新 DNS 缓存
ipconfig /flushdns
```

### 方案 2：代理配置
如果使用代理，确保以下域名可访问：
- `*.googleapis.com`
- `*.firebaseio.com`
- `*.firebasestorage.app`

### 方案 3：防火墙设置
允许以下端口的出站连接：
- `443` (HTTPS)
- `80` (HTTP)

## 🔄 连接重试策略

### 自动重试
```typescript
// 使用内置的重试机制
import { retryConnection, getConnectionStatus } from '@/lib/firebase';

// 手动重试连接
const success = await retryConnection();

// 检查连接状态
const status = getConnectionStatus();
```

### 连接状态组件
```tsx
// 在布局中添加连接状态显示
import { ConnectionStatus } from '@/components/connection-status';

export default function Layout({ children }) {
  return (
    <>
      <ConnectionStatus />
      {children}
    </>
  );
}
```

## 🏠 本地开发最佳实践

### 1. 使用 Firebase 模拟器

**优势：**
- 完全离线工作
- 无网络连接问题
- 快速开发和测试

**设置步骤：**
```bash
# 1. 启动模拟器
npm run firebase:emulators

# 2. 在 .env.local 中启用
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true

# 3. 重启开发服务器
npm run dev
```

### 2. 环境变量配置

**生产环境：**
```env
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
NODE_ENV=production
```

**开发环境：**
```env
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
NODE_ENV=development
```

## 🚀 性能优化建议

### 1. 缓存策略
- ✅ 启用 50MB 离线缓存
- ✅ 使用持久化存储
- ✅ 优化查询模式

### 2. 连接优化
- ✅ 长轮询连接
- ✅ 自动重试机制
- ✅ 网络状态监听

### 3. 错误处理
```typescript
// 在组件中处理连接错误
try {
  const data = await getDocs(collection(db, 'images'));
} catch (error) {
  if (error.code === 'unavailable') {
    // 显示离线提示
    console.log('当前离线，使用缓存数据');
  }
}
```

## 🔍 故障排除步骤

### 步骤 1：基础检查
```bash
# 检查网络连接
ping 8.8.8.8

# 检查 DNS 解析
nslookup firestore.googleapis.com

# 运行诊断
npm run firebase:diagnostics
```

### 步骤 2：应用修复
```bash
# 应用所有修复
npm run firebase:fix

# 重启服务器
npm run dev
```

### 步骤 3：使用模拟器
```bash
# 如果问题持续，使用模拟器
npm run firebase:emulators

# 在新终端启动开发服务器
npm run dev
```

### 步骤 4：检查配置
```bash
# 验证环境变量
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID

# 检查 Firebase 项目状态
firebase projects:list
```

## 📊 监控和日志

### 连接状态监控
```typescript
// 监控连接状态
const status = getConnectionStatus();
console.log('连接状态:', {
  isOnline: status.isOnline,
  retryCount: status.retryCount,
  canRetry: status.canRetry
});
```

### 错误日志
```typescript
// 记录连接错误
db.onSnapshot(
  collection(db, 'images'),
  (snapshot) => {
    // 成功回调
  },
  (error) => {
    console.error('Firestore 错误:', error.code, error.message);
    // 根据错误类型采取相应措施
  }
);
```

## 🎯 快速解决方案总结

### 立即可用的解决方案
1. ✅ **已应用离线优先配置**
2. ✅ **已启用长轮询连接**
3. ✅ **已添加自动重试机制**
4. ✅ **已创建连接状态组件**

### 如果问题持续
1. 🔧 **使用 Firebase 模拟器**（推荐）
2. 🌐 **更换网络环境或使用 VPN**
3. ⚙️ **配置代理或防火墙规则**
4. 📞 **联系网络管理员**

### 生产环境部署
1. 确保服务器网络稳定
2. 配置适当的超时设置
3. 实施健康检查机制
4. 监控连接状态和错误率

---

**注意：** 当前配置已经包含了大部分连接问题的解决方案。如果在特定网络环境下仍有问题，建议使用 Firebase 模拟器进行本地开发。