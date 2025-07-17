/**
 * Firebase 连接诊断和修复脚本
 * 用于诊断和解决 Firebase 连接问题
 */

const admin = require("firebase-admin");
const https = require("https");
const dns = require("dns");
const { promisify } = require("util");

const dnsLookup = promisify(dns.lookup);

/**
 * 检查网络连接
 */
async function checkNetworkConnectivity() {
  console.log("🌐 检查网络连接...");

  try {
    // 检查 DNS 解析
    const googleDNS = await dnsLookup("8.8.8.8");
    console.log("✅ DNS 解析正常:", googleDNS.address);

    // 检查 Firebase 域名解析
    const firebaseDNS = await dnsLookup("firestore.googleapis.com");
    console.log("✅ Firebase 域名解析正常:", firebaseDNS.address);

    return true;
  } catch (error) {
    console.error("❌ 网络连接问题:", error.message);
    return false;
  }
}

/**
 * 检查 Firebase 服务可达性
 */
function checkFirebaseReachability() {
  return new Promise((resolve) => {
    console.log("🔥 检查 Firebase 服务可达性...");

    const options = {
      hostname: "firestore.googleapis.com",
      port: 443,
      path: "/",
      method: "GET",
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      console.log("✅ Firebase 服务可达，状态码:", res.statusCode);
      resolve(true);
    });

    req.on("error", (error) => {
      console.error("❌ Firebase 服务不可达:", error.message);
      resolve(false);
    });

    req.on("timeout", () => {
      console.error("❌ Firebase 服务连接超时");
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * 检查 Firebase 配置
 */
function checkFirebaseConfig() {
  console.log("⚙️ 检查 Firebase 配置...");

  const requiredEnvVars = [
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_API_KEY",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    console.error("❌ 缺少必要的环境变量:", missingVars.join(", "));
    return false;
  }

  console.log("✅ Firebase 配置检查通过");
  console.log("   项目ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  return true;
}

/**
 * 测试 Firestore 连接
 */
async function testFirestoreConnection() {
  console.log("🔍 测试 Firestore 连接...");

  try {
    // 使用默认凭据初始化（适用于本地开发）
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId:
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
          "perceptive-map-465407-s9",
      });
    }

    const db = admin.firestore();

    // 设置连接超时
    const settings = {
      ignoreUndefinedProperties: true,
      // 增加超时时间
      timeout: 30000,
    };
    db.settings(settings);

    // 尝试读取一个简单的文档
    const testRef = db.collection("_test").doc("connection");
    await testRef.get();

    console.log("✅ Firestore 连接成功");
    return true;
  } catch (error) {
    console.error("❌ Firestore 连接失败:", error.message);

    // 提供具体的错误解决方案
    if (error.message.includes("ETIMEDOUT")) {
      console.log("💡 解决方案：");
      console.log("   1. 检查网络连接");
      console.log("   2. 检查防火墙设置");
      console.log("   3. 尝试使用 VPN 或更换网络");
      console.log("   4. 检查 DNS 设置（推荐使用 8.8.8.8）");
    } else if (error.message.includes("PERMISSION_DENIED")) {
      console.log("💡 解决方案：");
      console.log("   1. 检查 Firebase 项目权限");
      console.log("   2. 确认服务账号密钥配置正确");
      console.log("   3. 检查 Firestore 安全规则");
    }

    return false;
  }
}

/**
 * 创建优化的 Firebase 配置
 */
function createOptimizedConfig() {
  console.log("🔧 创建优化的 Firebase 配置...");

  const optimizedConfig = `
// 优化的 Firebase 配置
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 初始化Firebase应用
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 初始化 Firestore 时设置优化选项
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // 强制使用长轮询（解决连接问题）
    ignoreUndefinedProperties: true,
  });
} catch (error) {
  // 如果已经初始化过，使用现有实例
  db = getFirestore(app);
}

export { db };
export const storage = getStorage(app);
export const auth = getAuth(app);

// 开发环境配置
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // 可选：连接到本地模拟器
  // 注意：取消注释前确保模拟器正在运行
  /*
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    console.log('模拟器连接失败，使用生产环境');
  }
  */
}

export default app;
`;

  console.log("📝 建议的优化配置已生成");
  return optimizedConfig;
}

/**
 * 主诊断函数
 */
async function runDiagnostics() {
  console.log("🚀 开始 Firebase 连接诊断...");
  console.log("时间:", new Date().toISOString());
  console.log("");

  const results = {
    network: false,
    reachability: false,
    config: false,
    firestore: false,
  };

  // 1. 检查网络连接
  results.network = await checkNetworkConnectivity();
  console.log("");

  // 2. 检查 Firebase 服务可达性
  results.reachability = await checkFirebaseReachability();
  console.log("");

  // 3. 检查配置
  results.config = checkFirebaseConfig();
  console.log("");

  // 4. 测试 Firestore 连接
  if (results.network && results.config) {
    results.firestore = await testFirestoreConnection();
  } else {
    console.log("⏭️ 跳过 Firestore 连接测试（前置条件未满足）");
  }

  console.log("");
  console.log("📊 诊断结果汇总:");
  console.log("   网络连接:", results.network ? "✅" : "❌");
  console.log("   Firebase 可达性:", results.reachability ? "✅" : "❌");
  console.log("   配置检查:", results.config ? "✅" : "❌");
  console.log("   Firestore 连接:", results.firestore ? "✅" : "❌");

  // 提供解决方案
  console.log("");
  console.log("🔧 建议的解决方案:");

  if (!results.network) {
    console.log("1. 检查网络连接和 DNS 设置");
    console.log("   - 尝试更换 DNS 为 8.8.8.8 或 1.1.1.1");
    console.log("   - 检查防火墙和代理设置");
  }

  if (!results.reachability) {
    console.log("2. Firebase 服务连接问题");
    console.log("   - 尝试使用 VPN 或更换网络环境");
    console.log("   - 检查是否有网络限制");
  }

  if (!results.config) {
    console.log("3. 配置环境变量");
    console.log("   - 确保 .env.local 文件存在且配置正确");
  }

  if (!results.firestore) {
    console.log("4. 使用优化的 Firebase 配置");
    console.log("   - 启用长轮询模式");
    console.log("   - 增加连接超时时间");

    // 生成优化配置
    createOptimizedConfig();
  }

  console.log("");
  console.log("🎯 快速修复建议:");
  console.log("1. 重启开发服务器: npm run dev");
  console.log("2. 清除浏览器缓存和 localStorage");
  console.log("3. 尝试使用 Firebase 模拟器: npm run firebase:emulators");

  process.exit(results.firestore ? 0 : 1);
}

// 错误处理
process.on("unhandledRejection", (error) => {
  console.error("❌ 未处理的错误:", error);
  process.exit(1);
});

// 运行诊断
if (require.main === module) {
  runDiagnostics();
}

module.exports = {
  checkNetworkConnectivity,
  checkFirebaseReachability,
  checkFirebaseConfig,
  testFirestoreConnection,
  runDiagnostics,
};
