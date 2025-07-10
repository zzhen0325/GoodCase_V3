// 测试 Firebase Storage 连接
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');

// 测试不同的 storage bucket 配置
const configs = [
  {
    name: 'appspot.com',
    config: {
      apiKey: "AIzaSyCIQbFi0ogL2uAyRmAqeKn7iNGpun3AFfY",
      authDomain: "perceptive-map-465407-s9.firebaseapp.com",
      projectId: "perceptive-map-465407-s9",
      storageBucket: "perceptive-map-465407-s9.appspot.com",
      messagingSenderId: "383688111435",
      appId: "1:383688111435:web:948c86bc46b430222224ce"
    }
  },
  {
    name: 'firebasestorage.app',
    config: {
      apiKey: "AIzaSyCIQbFi0ogL2uAyRmAqeKn7iNGpun3AFfY",
      authDomain: "perceptive-map-465407-s9.firebaseapp.com",
      projectId: "perceptive-map-465407-s9",
      storageBucket: "perceptive-map-465407-s9.firebasestorage.app",
      messagingSenderId: "383688111435",
      appId: "1:383688111435:web:948c86bc46b430222224ce"
    }
  }
];

async function testStorageConfig(configData) {
  try {
    console.log(`\n测试配置: ${configData.name}`);
    console.log(`Storage Bucket: ${configData.config.storageBucket}`);
    
    const app = initializeApp(configData.config, configData.name);
    const storage = getStorage(app);
    
    // 创建一个测试文件
    const testData = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const testFile = new File([testData], 'test.txt', { type: 'text/plain' });
    
    const storageRef = ref(storage, `test/${Date.now()}.txt`);
    
    console.log('尝试上传测试文件...');
    const snapshot = await uploadBytes(storageRef, testFile);
    console.log('✅ 上传成功!');
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('✅ 获取下载URL成功:', downloadURL);
    
    return { success: true, url: downloadURL };
  } catch (error) {
    console.log('❌ 测试失败:', error.message);
    console.log('错误代码:', error.code);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('开始测试 Firebase Storage 配置...');
  
  for (const config of configs) {
    await testStorageConfig(config);
  }
  
  console.log('\n测试完成!');
}

runTests().catch(console.error);