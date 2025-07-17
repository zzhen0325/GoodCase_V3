/**
 * Firebase 初始化脚本
 * 用于设置 Firestore 和 Storage 的基础配置
 */

const admin = require("firebase-admin");
const path = require("path");

// 初始化 Firebase Admin SDK
if (!admin.apps.length) {
  // 在生产环境中，应该使用服务账号密钥
  // 这里使用默认凭据进行初始化
  admin.initializeApp({
    projectId: "perceptive-map-465407-s9",
    storageBucket: "perceptive-map-465407-s9.firebasestorage.app",
  });
}

const db = admin.firestore();
const storage = admin.storage();

/**
 * 初始化 Firestore 集合和索引
 */
async function initFirestore() {
  console.log("🔥 初始化 Firestore...");

  try {
    // 创建示例标签
    const tagsRef = db.collection("tags");
    console.log("✅ 标签系统已移除，跳过标签初始化");

    // 创建复合索引（需要在 Firebase Console 中手动创建）
    console.log("📋 需要在 Firebase Console 中创建以下复合索引：");
    console.log("   集合: images");
    console.log("   字段: tags (数组), createdAt (降序)");
    console.log("   字段: url (升序), createdAt (降序)");
  } catch (error) {
    console.error("❌ Firestore 初始化失败:", error);
  }
}

/**
 * 初始化 Storage 目录结构
 */
async function initStorage() {
  console.log("📁 初始化 Storage...");

  try {
    const bucket = storage.bucket();

    // 创建 images 目录（通过上传一个占位文件）
    const placeholderFile = bucket.file("images/.placeholder");
    await placeholderFile.save(
      "# This is a placeholder file to create the images directory\n",
    );

    console.log("✅ Storage 目录结构创建成功");

    // 输出安全规则建议
    console.log("🔒 建议的 Storage 安全规则：");
    console.log(`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}`);
  } catch (error) {
    console.error("❌ Storage 初始化失败:", error);
  }
}

/**
 * 输出 Firestore 安全规则
 */
function outputFirestoreRules() {
  console.log("🔒 建议的 Firestore 安全规则：");
  console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 图片集合
    match /images/{imageId} {
      allow read: if true;
      allow create: if request.auth != null
        && validateImageData(request.resource.data);
      allow update: if request.auth != null
        && validateImageData(request.resource.data);
      allow delete: if request.auth != null;
    }
    
    // 标签集合
    match /tags/{tagId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // 验证图片数据结构
    function validateImageData(data) {
      return data.keys().hasAll(['url', 'prompts', 'tags', 'createdAt', 'updatedAt'])
        && data.url is string
        && data.prompts is list
        && data.tags is list;
    }
  }
}`);
}

/**
 * 主初始化函数
 */
async function main() {
  console.log("🚀 开始初始化 Firebase...");
  console.log("项目ID:", admin.app().options.projectId);
  console.log("Storage Bucket:", admin.app().options.storageBucket);
  console.log("");

  await initFirestore();
  await initStorage();
  outputFirestoreRules();

  console.log("");
  console.log("🎉 Firebase 初始化完成！");
  console.log("");
  console.log("📝 后续步骤：");
  console.log("1. 在 Firebase Console 中设置上述安全规则");
  console.log("2. 在 Firebase Console 中创建建议的复合索引");
  console.log("3. 如需认证功能，请启用 Firebase Authentication");
  console.log("4. 测试图片上传和数据读写功能");

  process.exit(0);
}

// 错误处理
process.on("unhandledRejection", (error) => {
  console.error("❌ 未处理的错误:", error);
  process.exit(1);
});

// 运行初始化
if (require.main === module) {
  main();
}

module.exports = {
  initFirestore,
  initStorage,
  outputFirestoreRules,
};
