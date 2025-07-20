// 修复标签分组颜色属性的脚本
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

// 预定义的颜色主题
const colorThemes = ['pink', 'cyan', 'yellow', 'green', 'purple'];

async function fixTagGroupsColors() {
  try {
    console.log('开始修复标签分组颜色属性...');
    
    // 获取所有标签分组
    const querySnapshot = await getDocs(collection(db, 'categories'));
    const tagGroups = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`找到 ${tagGroups.length} 个标签分组`);
    
    let updatedCount = 0;
    
    for (let i = 0; i < tagGroups.length; i++) {
      const group = tagGroups[i];
      
      // 检查是否已有颜色属性
      if (!group.color) {
        // 为默认分组分配灰色，其他分组随机分配颜色
        let color;
        if (group.id === 'default' || group.name === 'Default') {
          color = 'gray';
        } else {
          // 循环使用颜色主题，确保分布均匀
          color = colorThemes[i % colorThemes.length];
        }
        
        // 更新文档
        const docRef = doc(db, 'categories', group.id);
        await updateDoc(docRef, {
          color: color
        });
        
        console.log(`✅ 更新分组 "${group.name}" (ID: ${group.id}) 颜色为: ${color}`);
        updatedCount++;
      } else {
        console.log(`⏭️  分组 "${group.name}" (ID: ${group.id}) 已有颜色: ${group.color}`);
      }
    }
    
    console.log(`\n修复完成！共更新了 ${updatedCount} 个标签分组的颜色属性。`);
    
    // 验证修复结果
    console.log('\n验证修复结果...');
    const verifySnapshot = await getDocs(collection(db, 'categories'));
    const updatedGroups = verifySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      color: doc.data().color
    }));
    
    console.log('\n当前所有标签分组的颜色:');
    updatedGroups.forEach(group => {
      console.log(`  - ${group.name} (ID: ${group.id}): ${group.color}`);
    });
    
  } catch (error) {
    console.error('修复失败:', error);
  }
}

// 运行修复脚本
fixTagGroupsColors();