#!/usr/bin/env node

/**
 * 清空数据库脚本
 * 完全清空当前Firestore数据库中的所有集合和数据，为重构做准备
 */

const admin = require('firebase-admin');
const path = require('path');

// 初始化 Firebase Admin
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

let app;
try {
  if (admin.apps.length === 0) {
    // 尝试使用服务账户密钥文件
    try {
      const serviceAccount = require(serviceAccountPath);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log('✅ 使用服务账户密钥初始化 Firebase Admin');
    } catch (serviceAccountError) {
      // 如果没有服务账户文件，使用默认凭据
      app = admin.initializeApp({
        projectId: 'perceptive-map-465407-s9',
      });
      console.log('✅ 使用默认凭据初始化 Firebase Admin');
    }
  } else {
    app = admin.app();
  }
} catch (error) {
  console.error('❌ Firebase Admin 初始化失败:', error);
  process.exit(1);
}

const db = admin.firestore();

/**
 * 删除集合中的所有文档
 */
async function deleteCollection(collectionName) {
  console.log(`🗑️  正在清空集合: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`   ✅ 集合 ${collectionName} 已经为空`);
      return;
    }
    
    console.log(`   📊 找到 ${snapshot.size} 个文档`);
    
    // 批量删除文档
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`   ✅ 成功删除 ${snapshot.size} 个文档`);
    
  } catch (error) {
    console.error(`   ❌ 删除集合 ${collectionName} 失败:`, error);
    throw error;
  }
}

/**
 * 主清空函数
 */
async function clearDatabase() {
  console.log('🚀 开始清空数据库...');
  console.log('项目ID:', app.options.projectId);
  console.log('时间:', new Date().toISOString());
  console.log('=' .repeat(50));
  
  // 需要清空的集合列表（包括旧的和新的）
  const collections = [
    // 旧的集合
    'images',
    'tags', 
    'categories',
    'prompts',
    'image-tags',
    'tag-groups', // 旧的分类集合名
    
    // 新的集合（如果存在）
    'tagCategories',
  ];
  
  try {
    // 逐个清空集合
    for (const collectionName of collections) {
      await deleteCollection(collectionName);
    }
    
    console.log('=' .repeat(50));
    console.log('✅ 数据库清空完成！');
    console.log('📊 清空统计:');
    console.log(`   - 处理的集合数: ${collections.length}`);
    console.log(`   - 完成时间: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('❌ 数据库清空失败:', error);
    process.exit(1);
  }
}

/**
 * 确认清空操作
 */
async function confirmClear() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log('⚠️  警告: 此操作将完全清空数据库中的所有数据！');
    console.log('📋 将要清空的集合:');
    console.log('   - images (图片)');
    console.log('   - tags (标签)');
    console.log('   - categories (分类)');
    console.log('   - prompts (提示词)');
    console.log('   - image-tags (图片标签关联)');
    console.log('   - tag-groups (旧分类)');
    console.log('   - tagCategories (新分类)');
    console.log('');
    
    rl.question('确认要继续吗？(输入 "YES" 确认): ', (answer) => {
      rl.close();
      resolve(answer === 'YES');
    });
  });
}

// 主执行流程
async function main() {
  try {
    // 检查命令行参数
    const forceMode = process.argv.includes('--force');
    
    if (!forceMode) {
      const confirmed = await confirmClear();
      if (!confirmed) {
        console.log('❌ 操作已取消');
        process.exit(0);
      }
    }
    
    await clearDatabase();
    
  } catch (error) {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  clearDatabase,
  deleteCollection
};
