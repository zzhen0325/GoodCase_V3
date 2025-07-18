// 简单测试脚本
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 最简单的测试数据
const simpleImage = {
  url: 'https://via.placeholder.com/400x300',
  title: '测试图片',
  width: 400,
  height: 300,
  fileSize: 150000,
  format: 'jpeg',
  prompts: [],
  tags: []
};

async function addSimpleTest() {
  try {
    console.log('开始添加简单测试数据...');
    
    const docRef = await addDoc(collection(db, 'images'), {
      ...simpleImage,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ 添加成功:', docRef.id);
    process.exit(0);
  } catch (error) {
    console.error('❌ 添加失败:', error);
    process.exit(1);
  }
}

// 运行脚本
addSimpleTest();