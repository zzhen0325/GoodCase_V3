// 添加测试图片数据的脚本
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, Timestamp } = require('firebase/firestore');

// 创建时间戳的辅助函数
function createTimestamp() {
  return Timestamp.now();
}

// Firebase 配置（请确保环境变量已设置）
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

// 测试图片数据
const testImages = [
  {
    url: 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Nature+Photo',
    title: '美丽的自然风景',
    prompts: [
      {
        id: 'prompt1',
        title: '自然风景摄影',
        content: 'beautiful nature landscape photography, high quality, detailed',
        color: '#10b981',
        order: 0
      }
    ],
    tags: [
      {
        id: 'tagnature',
        name: '自然',
        color: '#10b981',
        groupId: 'default',
        order: 0,
        usageCount: 1
      },
      {
        id: 'taglandscape',
        name: '风景',
        color: '#3b82f6',
        groupId: 'default',
        order: 1,
        usageCount: 1
      },
      {
        id: 'tagoutdoor',
        name: '户外',
        color: '#8b5cf6',
        groupId: 'default',
        order: 2,
        usageCount: 1
      }
    ],
    width: 400,
    height: 300,
    fileSize: 150000,
    format: 'jpeg'
  },
  {
    url: 'https://via.placeholder.com/400x300/4ecdc4/ffffff?text=City+View',
    title: '城市夜景',
    prompts: [
      {
        id: 'prompt2',
        title: '城市夜景摄影',
        content: 'city night view, urban landscape, lights, modern architecture',
        color: '#f59e0b',
        order: 0
      }
    ],
    tags: [
      {
        id: 'tagcity',
        name: '城市',
        color: '#ef4444',
        groupId: 'default',
        order: 0,
        usageCount: 1
      },
      {
        id: 'tagnight',
        name: '夜景',
        color: '#6366f1',
        groupId: 'default',
        order: 1,
        usageCount: 1
      },
      {
        id: 'tagarchitecture',
        name: '建筑',
        color: '#84cc16',
        groupId: 'default',
        order: 2,
        usageCount: 1
      }
    ],
    width: 400,
    height: 300,
    fileSize: 200000,
    format: 'jpeg'
  },
  {
    url: 'https://via.placeholder.com/400x300/45b7d1/ffffff?text=Ocean+Wave',
    title: '海浪拍岸',
    prompts: [
      {
        id: 'prompt3',
        title: '海洋摄影',
        content: 'ocean waves, seascape, blue water, natural beauty',
        color: '#06b6d4',
        order: 0
      }
    ],
    tags: [
      {
        id: 'tagocean',
        name: '海洋',
        color: '#06b6d4',
        groupId: 'default',
        order: 0,
        usageCount: 1
      },
      {
        id: 'tagnature2',
        name: '自然',
        color: '#10b981',
        groupId: 'default',
        order: 1,
        usageCount: 2
      },
      {
        id: 'tagblue',
        name: '蓝色',
        color: '#3b82f6',
        groupId: 'default',
        order: 2,
        usageCount: 1
      }
    ],
    width: 400,
    height: 300,
    fileSize: 180000,
    format: 'jpeg'
  },
  {
    url: 'https://via.placeholder.com/400x300/f9ca24/ffffff?text=Sunset',
    title: '日落黄昏',
    prompts: [
      {
        id: 'prompt4',
        title: '日落摄影',
        content: 'sunset photography, golden hour, warm colors, peaceful scene',
        color: '#f59e0b',
        order: 0
      }
    ],
    tags: [
      {
        id: 'tagsunset',
        name: '日落',
        color: '#f59e0b',
        groupId: 'default',
        order: 0,
        usageCount: 1
      },
      {
        id: 'tagnature3',
        name: '自然',
        color: '#10b981',
        groupId: 'default',
        order: 1,
        usageCount: 3
      },
      {
        id: 'tagdusk',
        name: '黄昏',
        color: '#f97316',
        groupId: 'default',
        order: 2,
        usageCount: 1
      }
    ],
    width: 400,
    height: 300,
    fileSize: 160000,
    format: 'jpeg'
  },
  {
    url: 'https://via.placeholder.com/400x300/6c5ce7/ffffff?text=Mountain',
    title: '雪山景色',
    prompts: [
      {
        id: 'prompt5',
        title: '雪山摄影',
        content: 'snow mountain landscape, winter scene, majestic peaks, white snow',
        color: '#8b5cf6',
        order: 0
      }
    ],
    tags: [
      {
        id: 'tagmountain',
        name: '山脉',
        color: '#8b5cf6',
        groupId: 'default',
        order: 0,
        usageCount: 1
      },
      {
        id: 'tagsnow',
        name: '雪景',
        color: '#e5e7eb',
        groupId: 'default',
        order: 1,
        usageCount: 1
      },
      {
        id: 'tagnature4',
        name: '自然',
        color: '#10b981',
        groupId: 'default',
        order: 2,
        usageCount: 4
      }
    ],
    width: 400,
    height: 300,
    fileSize: 220000,
    format: 'jpeg'
  }
];

async function addTestImages() {
  try {
    console.log('开始添加测试图片数据...');
    
    for (const imageData of testImages) {
      const docRef = await addDoc(collection(db, 'images'), {
        ...imageData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ 添加图片成功: ${imageData.title} (ID: ${docRef.id})`);
    }
    
    console.log('🎉 所有测试图片添加完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 添加测试图片失败:', error);
    process.exit(1);
  }
}

// 运行脚本
addTestImages();