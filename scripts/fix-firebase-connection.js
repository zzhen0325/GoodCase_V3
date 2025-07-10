/**
 * Firebase 连接修复脚本
 * 提供多种解决方案来处理连接超时问题
 */

const fs = require('fs');
const path = require('path');

/**
 * 创建离线优先的 Firebase 配置
 */
function createOfflineFirstConfig() {
  const configContent = `import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, initializeFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCIQbFi0ogL2uAyRmAqeKn7iNGpun3AFfY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "perceptive-map-465407-s9.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://perceptive-map-465407-s9-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "perceptive-map-465407-s9",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "perceptive-map-465407-s9.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "383688111435",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:383688111435:web:948c86bc46b430222224ce",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-90M1DVZKQT"
};

// 初始化Firebase应用
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 初始化 Firestore 时设置优化选项
let db;
try {
  db = initializeFirestore(app, {
    // 启用离线持久化
    localCache: {
      kind: 'persistent',
      tabManager: 'optimistic',
      cacheSizeBytes: 50 * 1024 * 1024, // 50MB 缓存
    },
    // 强制使用长轮询，解决连接超时问题
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  });
} catch (error) {
  // 如果已经初始化过，使用现有实例
  db = getFirestore(app);
}

// 网络状态管理
let isOnline = navigator?.onLine ?? true;
let networkRetryCount = 0;
const MAX_RETRY_COUNT = 3;

// 监听网络状态变化
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('🌐 网络已连接，启用 Firestore');
    isOnline = true;
    networkRetryCount = 0;
    try {
      await enableNetwork(db);
    } catch (error) {
      console.warn('启用网络失败:', error);
    }
  });

  window.addEventListener('offline', async () => {
    console.log('📴 网络已断开，禁用 Firestore');
    isOnline = false;
    try {
      await disableNetwork(db);
    } catch (error) {
      console.warn('禁用网络失败:', error);
    }
  });
}

// 连接重试机制
export async function retryConnection() {
  if (networkRetryCount >= MAX_RETRY_COUNT) {
    console.warn('已达到最大重试次数，停止重试');
    return false;
  }

  networkRetryCount++;
  console.log(\`🔄 尝试重新连接 Firebase (\${networkRetryCount}/\${MAX_RETRY_COUNT})\`);

  try {
    await disableNetwork(db);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
    await enableNetwork(db);
    console.log('✅ Firebase 重新连接成功');
    networkRetryCount = 0;
    return true;
  } catch (error) {
    console.error('❌ Firebase 重新连接失败:', error);
    return false;
  }
}

// 检查连接状态
export function getConnectionStatus() {
  return {
    isOnline,
    retryCount: networkRetryCount,
    canRetry: networkRetryCount < MAX_RETRY_COUNT
  };
}

// 初始化其他服务
export const storage = getStorage(app);
export const auth = getAuth(app);
export { db };

// 开发环境下连接模拟器（推荐用于解决连接问题）
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // 检查是否启用模拟器
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';
  
  if (useEmulator) {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      connectAuthEmulator(auth, 'http://localhost:9099');
      console.log('🔧 已连接到 Firebase 模拟器');
    } catch (error) {
      console.log('模拟器连接失败，使用生产环境');
    }
  }
}

export default app;
`;

  return configContent;
}

/**
 * 创建环境变量配置
 */
function createEnvConfig() {
  const envContent = `# Firebase配置（客户端）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCIQbFi0ogL2uAyRmAqeKn7iNGpun3AFfY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=perceptive-map-465407-s9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://perceptive-map-465407-s9-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=perceptive-map-465407-s9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=perceptive-map-465407-s9.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=383688111435
NEXT_PUBLIC_FIREBASE_APP_ID=1:383688111435:web:948c86bc46b430222224ce
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-90M1DVZKQT

# Firebase Admin配置（服务端）
FIREBASE_PROJECT_ID=perceptive-map-465407-s9
FIREBASE_SERVICE_ACCOUNT_EMAIL=zzhen0325@perceptive-map-465407-s9.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"

# 开发环境配置
NODE_ENV=development

# 模拟器配置（解决连接问题的推荐方案）
# 设置为 true 启用本地模拟器
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false

# 模拟器主机配置（可选）
# FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
# FIRESTORE_EMULATOR_HOST=localhost:8080
# FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
`;

  return envContent;
}

/**
 * 创建连接状态组件
 */
function createConnectionStatusComponent() {
  const componentContent = `'use client';

import { useState, useEffect } from 'react';
import { retryConnection, getConnectionStatus } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function ConnectionStatus() {
  const [status, setStatus] = useState(getConnectionStatus());
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getConnectionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    await retryConnection();
    setIsRetrying(false);
    setStatus(getConnectionStatus());
  };

  if (status.isOnline && status.retryCount === 0) {
    return null; // 连接正常时不显示
  }

  return (
    <Alert className="fixed top-4 right-4 w-auto max-w-md z-50">
      <div className="flex items-center gap-2">
        {status.isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <AlertDescription className="flex-1">
          {status.isOnline ? (
            \`连接不稳定 (重试: \${status.retryCount}/3)\`
          ) : (
            'Firebase 连接已断开'
          )}
        </AlertDescription>
        {status.canRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              '重试'
            )}
          </Button>
        )}
      </div>
    </Alert>
  );
}
`;

  return componentContent;
}

/**
 * 主修复函数
 */
function applyFixes() {
  console.log('🔧 开始应用 Firebase 连接修复...');
  
  try {
    // 1. 更新 Firebase 配置
    const firebaseConfigPath = path.join(process.cwd(), 'lib', 'firebase.ts');
    const optimizedConfig = createOfflineFirstConfig();
    fs.writeFileSync(firebaseConfigPath, optimizedConfig, 'utf8');
    console.log('✅ 已更新 Firebase 配置（离线优先）');
    
    // 2. 更新环境变量
    const envPath = path.join(process.cwd(), '.env.local');
    const envConfig = createEnvConfig();
    fs.writeFileSync(envPath, envConfig, 'utf8');
    console.log('✅ 已更新环境变量配置');
    
    // 3. 创建连接状态组件
    const componentDir = path.join(process.cwd(), 'components');
    if (!fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true });
    }
    const componentPath = path.join(componentDir, 'connection-status.tsx');
    const componentContent = createConnectionStatusComponent();
    fs.writeFileSync(componentPath, componentContent, 'utf8');
    console.log('✅ 已创建连接状态组件');
    
    console.log('');
    console.log('🎉 修复完成！');
    console.log('');
    console.log('📋 应用的修复:');
    console.log('1. ✅ 启用离线持久化缓存');
    console.log('2. ✅ 强制使用长轮询连接');
    console.log('3. ✅ 添加网络状态监听');
    console.log('4. ✅ 实现连接重试机制');
    console.log('5. ✅ 创建连接状态组件');
    console.log('');
    console.log('🚀 下一步操作:');
    console.log('1. 重启开发服务器: npm run dev');
    console.log('2. 在主布局中添加 <ConnectionStatus /> 组件');
    console.log('3. 如果问题持续，启用模拟器: npm run firebase:emulators');
    console.log('4. 设置 NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true 使用模拟器');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 运行修复
if (require.main === module) {
  applyFixes();
}

module.exports = {
  createOfflineFirstConfig,
  createEnvConfig,
  createConnectionStatusComponent,
  applyFixes
};