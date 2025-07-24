/**
 * 数据库状态检查脚本
 * 检查 Firestore 数据库是否需要初始化
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, collection, getDocs, doc, getDoc } = require('firebase/firestore');

// Firebase 客户端配置
const firebaseConfig = {
  apiKey: "AIzaSyCIQbFi0ogL2uAyRmAqeKn7iNGpun3AFfY",
  authDomain: "perceptive-map-465407-s9.firebaseapp.com",
  databaseURL: "https://perceptive-map-465407-s9-default-rtdb.firebaseio.com",
  projectId: "perceptive-map-465407-s9",
  storageBucket: "perceptive-map-465407-s9.firebasestorage.app",
  messagingSenderId: "383688111435",
  appId: "1:383688111435:web:948c86bc46b430222224ce",
  measurementId: "G-90M1DVZKQT"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 检查集合是否存在且有数据
async function checkCollection(collectionName) {
  try {
    console.log(`\n📋 检查集合: ${collectionName}`);
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`   ❌ 集合 ${collectionName} 为空或不存在`);
      return { exists: false, count: 0, documents: [] };
    } else {
      const documents = [];
      snapshot.forEach(doc => {
        documents.push({
          id: doc.id,
          data: doc.data()
        });
      });
      console.log(`   ✅ 集合 ${collectionName} 存在，包含 ${documents.length} 个文档`);
      return { exists: true, count: documents.length, documents };
    }
  } catch (error) {
    console.log(`   ❌ 检查集合 ${collectionName} 时出错:`, error.message);
    return { exists: false, count: 0, error: error.message };
  }
}

// 主检查函数
async function checkDatabaseStatus() {
  console.log('🔍 开始检查数据库状态...');
  console.log('项目ID:', firebaseConfig.projectId);
  console.log('时间:', new Date().toISOString());
  
  const collections = ['categories', 'tags', 'prompts', 'images'];
  const results = {};
  
  for (const collectionName of collections) {
    results[collectionName] = await checkCollection(collectionName);
  }
  
  console.log('\n📊 数据库状态汇总:');
  console.log('=' .repeat(50));
  
  let needsInitialization = true;
  let totalDocuments = 0;
  
  for (const [name, result] of Object.entries(results)) {
    console.log(`${name.padEnd(12)}: ${result.exists ? '✅' : '❌'} (${result.count} 文档)`);
    if (result.exists && result.count > 0) {
      needsInitialization = false;
    }
    totalDocuments += result.count;
  }
  
  console.log('=' .repeat(50));
  console.log(`总文档数: ${totalDocuments}`);
  
  if (needsInitialization) {
    console.log('\n🚨 数据库需要初始化!');
    console.log('\n建议的初始化步骤:');
    console.log('1. 设置 Firebase 环境变量 (复制 .env.example 到 .env)');
    console.log('2. 运行: node scripts/init-firebase.js');
    console.log('3. 创建 Firestore 索引: node scripts/create-firestore-indexes.js');
    console.log('4. 测试 API: npm run test:api');
  } else {
    console.log('\n✅ 数据库已初始化，包含数据');
    console.log('\n数据库详情:');
    for (const [name, result] of Object.entries(results)) {
      if (result.exists && result.count > 0) {
        console.log(`\n${name} 集合示例数据:`);
        result.documents.slice(0, 2).forEach((doc, index) => {
          console.log(`  ${index + 1}. ID: ${doc.id}`);
          console.log(`     数据:`, JSON.stringify(doc.data, null, 6).substring(0, 100) + '...');
        });
      }
    }
  }
  
  return {
    needsInitialization,
    totalDocuments,
    collections: results
  };
}

// 运行检查
checkDatabaseStatus()
  .then((result) => {
    console.log('\n🎯 检查完成');
    process.exit(result.needsInitialization ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ 检查过程中出错:', error);
    process.exit(1);
  });