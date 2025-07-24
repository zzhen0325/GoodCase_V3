#!/usr/bin/env node

/**
 * 使用客户端SDK清空数据库脚本
 * 完全清空当前Firestore数据库中的所有集合和数据，为重构做准备
 */

// 使用ES模块语法需要在package.json中设置"type": "module"，这里使用require
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, writeBatch, doc } = require('firebase/firestore');

// Firebase配置
const firebaseConfig = {
  apiKey: 'AIzaSyCIQbFi0ogL2uAyRmAqeKn7iNGpun3AFfY',
  authDomain: 'perceptive-map-465407-s9.firebaseapp.com',
  databaseURL: 'https://perceptive-map-465407-s9-default-rtdb.firebaseio.com',
  projectId: 'perceptive-map-465407-s9',
  storageBucket: 'perceptive-map-465407-s9.firebasestorage.app',
  messagingSenderId: '383688111435',
  appId: '1:383688111435:web:948c86bc46b430222224ce',
  measurementId: 'G-90M1DVZKQT',
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * 删除集合中的所有文档
 */
async function deleteCollection(collectionName) {
  console.log(`🗑️  正在清空集合: ${collectionName}`);
  
  try {
    const snapshot = await getDocs(collection(db, collectionName));
    
    if (snapshot.empty) {
      console.log(`   ✅ 集合 ${collectionName} 已经为空`);
      return;
    }
    
    console.log(`   📊 找到 ${snapshot.size} 个文档`);
    
    // 批量删除文档（Firestore批量操作限制为500个操作）
    const batchSize = 500;
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = docs.slice(i, i + batchSize);
      
      batchDocs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      
      await batch.commit();
      console.log(`   ✅ 删除了 ${batchDocs.length} 个文档 (${i + batchDocs.length}/${docs.length})`);
    }
    
    console.log(`   ✅ 成功删除集合 ${collectionName} 中的所有 ${docs.length} 个文档`);
    
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
  console.log('项目ID:', firebaseConfig.projectId);
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
