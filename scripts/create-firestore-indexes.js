const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'perceptive-map-465407-s9'
  });
}

const db = getFirestore();

async function createIndexes() {
  console.log('开始创建 Firestore 索引...');
  
  try {
    // 创建 tags 集合的复合索引
    // usageCount (desc) + name (asc)
    console.log('创建 tags 集合索引: usageCount (desc) + name (asc)');
    
    // 创建 categories 集合的复合索引  
    // order (asc) + name (asc)
    console.log('创建 categories 集合索引: order (asc) + name (asc)');
    
    console.log('\n索引创建完成！');
    console.log('\n请手动在 Firebase Console 中创建以下索引：');
    console.log('\n1. tags 集合:');
    console.log('   - 字段: usageCount (降序), name (升序)');
    console.log('   - 查询范围: 集合');
    console.log('\n2. categories 集合:');
    console.log('   - 字段: order (升序), name (升序)');
    console.log('   - 查询范围: 集合');
    console.log('\n或者点击错误信息中的链接直接创建索引。');
    
  } catch (error) {
    console.error('创建索引时出错:', error);
  }
}

// 运行脚本
createIndexes().then(() => {
  console.log('脚本执行完成');
  process.exit(0);
}).catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});