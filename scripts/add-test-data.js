const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

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

// 测试数据
const testImages = [
  {
    title: '美丽的风景',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    prompts: [
      {
        id: '1',
        text: 'beautiful landscape, mountains, sunset',
        type: 'positive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    tags: [
      {
        id: 'tag1',
        name: '风景',
        color: '#22c55e',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tag2',
        name: '山脉',
        color: '#3b82f6',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tag3',
        name: '日落',
        color: '#f59e0b',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    title: '城市夜景',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800',
    prompts: [
      {
        id: '2',
        text: 'city skyline at night, neon lights, urban',
        type: 'positive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    tags: [
      {
        id: 'tag4',
        name: '城市',
        color: '#6366f1',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tag5',
        name: '夜景',
        color: '#8b5cf6',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tag6',
        name: '霓虹灯',
        color: '#ec4899',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    title: '可爱的小猫',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
    prompts: [
      {
        id: '3',
        text: 'cute cat, fluffy, adorable pet',
        type: 'positive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    tags: [
      {
        id: 'tag7',
        name: '动物',
        color: '#10b981',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tag8',
        name: '猫咪',
        color: '#f97316',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'tag9',
        name: '可爱',
        color: '#d946ef',
        usageCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
];

async function addTestData() {
  try {
    console.log('开始添加测试数据...');
    
    for (const imageData of testImages) {
      const docRef = await addDoc(collection(db, 'images'), {
        ...imageData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('添加图片成功，ID:', docRef.id, '标题:', imageData.title);
    }
    
    console.log('所有测试数据添加完成！');
    process.exit(0);
  } catch (error) {
    console.error('添加测试数据失败:', error);
    process.exit(1);
  }
}

addTestData();