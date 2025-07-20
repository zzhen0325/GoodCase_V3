// 修复默认分组颜色的脚本
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

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

async function fixDefaultGroupColor() {
  try {
    console.log('修复默认分组颜色...');
    
    // 更新默认分组的颜色为 gray
    const defaultGroupRef = doc(db, 'categories', 'default');
    await updateDoc(defaultGroupRef, {
      color: 'gray'
    });
    
    console.log('✅ 默认分组颜色已修复为: gray');
    
  } catch (error) {
    console.error('修复失败:', error);
  }
}

// 运行修复脚本
fixDefaultGroupColor();