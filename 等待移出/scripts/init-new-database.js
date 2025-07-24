#!/usr/bin/env node

/**
 * 新数据库初始化脚本
 * 根据优化后的数据库设计文档初始化数据库结构
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc } = require('firebase/firestore');

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

// 预制主题颜色系统
const PRESET_THEMES = {
  pink: {
    primary: "#F4BFEA",
    secondary: "#F4BFEA", 
    accent: "#F4BFEA",
    bg: "#FFE5FA",
    text: "#7F4073"
  },
  cyan: {
    primary: "#80E3F5",
    secondary: "#80E3F5",
    accent: "#80E3F5", 
    bg: "#D7F9FF",
    text: "#54848D"
  },
  yellow: {
    primary: "#FFE1B3",
    secondary: "#FFE1B3",
    accent: "#FFE1B3",
    bg: "#FFF7D7", 
    text: "#CF8D4B"
  },
  green: {
    primary: "#A6E19E",
    secondary: "#A6E19E",
    accent: "#A6E19E",
    bg: "#D1FFCB",
    text: "#60BA54"
  },
  purple: {
    primary: "#D8C0FF",
    secondary: "#D8C0FF", 
    accent: "#D8C0FF",
    bg: "#EADDFF",
    text: "#A180D7"
  }
};

/**
 * 创建默认分类
 */
async function createDefaultCategory() {
  console.log('📁 创建默认分类...');
  
  try {
    const defaultCategoryData = {
      id: 'default',
      name: '未分类',
      description: '系统默认标签分类',
      color: 'purple',
      isDefault: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // 使用固定ID创建默认分类
    await setDoc(doc(db, 'tagCategories', 'default'), defaultCategoryData);
    
    console.log('   ✅ 默认分类创建成功');
    return 'default';
    
  } catch (error) {
    console.error('   ❌ 创建默认分类失败:', error);
    throw error;
  }
}

/**
 * 创建示例分类
 */
async function createSampleCategories() {
  console.log('📁 创建示例分类...');
  
  const sampleCategories = [
    {
      name: '场景',
      description: '图片中的场景类型',
      color: 'pink'
    },
    {
      name: '风格',
      description: '图片的艺术风格',
      color: 'cyan'
    },
    {
      name: '颜色',
      description: '图片的主要颜色',
      color: 'yellow'
    },
    {
      name: '情感',
      description: '图片传达的情感',
      color: 'green'
    }
  ];
  
  const createdCategories = [];
  
  try {
    for (const categoryData of sampleCategories) {
      const docRef = await addDoc(collection(db, 'tagCategories'), {
        ...categoryData,
        isDefault: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 更新文档以包含ID
      await setDoc(doc(db, 'tagCategories', docRef.id), {
        ...categoryData,
        id: docRef.id,
        isDefault: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      createdCategories.push({
        id: docRef.id,
        ...categoryData
      });
      
      console.log(`   ✅ 创建分类: ${categoryData.name} (${docRef.id})`);
    }
    
    return createdCategories;
    
  } catch (error) {
    console.error('   ❌ 创建示例分类失败:', error);
    throw error;
  }
}

/**
 * 创建示例标签
 */
async function createSampleTags(categories) {
  console.log('🏷️  创建示例标签...');
  
  const sampleTags = [
    // 场景标签
    { name: '花海', categoryName: '场景' },
    { name: '山水', categoryName: '场景' },
    { name: '城市', categoryName: '场景' },
    { name: '森林', categoryName: '场景' },
    
    // 风格标签
    { name: '写实', categoryName: '风格' },
    { name: '抽象', categoryName: '风格' },
    { name: '卡通', categoryName: '风格' },
    { name: '水彩', categoryName: '风格' },
    
    // 颜色标签
    { name: '暖色调', categoryName: '颜色' },
    { name: '冷色调', categoryName: '颜色' },
    { name: '黑白', categoryName: '颜色' },
    { name: '彩色', categoryName: '颜色' },
    
    // 情感标签
    { name: '温馨', categoryName: '情感' },
    { name: '宁静', categoryName: '情感' },
    { name: '活力', categoryName: '情感' },
    { name: '神秘', categoryName: '情感' }
  ];
  
  // 创建分类名称到ID的映射
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });
  
  const createdTags = [];
  
  try {
    for (const tagData of sampleTags) {
      const categoryId = categoryMap[tagData.categoryName] || 'default';
      
      const docRef = await addDoc(collection(db, 'tags'), {
        name: tagData.name,
        categoryId: categoryId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 更新文档以包含ID
      await setDoc(doc(db, 'tags', docRef.id), {
        id: docRef.id,
        name: tagData.name,
        categoryId: categoryId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      createdTags.push({
        id: docRef.id,
        name: tagData.name,
        categoryId: categoryId
      });
      
      console.log(`   ✅ 创建标签: ${tagData.name} -> ${tagData.categoryName} (${docRef.id})`);
    }
    
    return createdTags;
    
  } catch (error) {
    console.error('   ❌ 创建示例标签失败:', error);
    throw error;
  }
}

/**
 * 显示索引创建指南
 */
function showIndexGuide() {
  console.log('📋 需要在 Firebase Console 中手动创建以下索引:');
  console.log('');
  console.log('1. tags 集合索引:');
  console.log('   - 字段: categoryId (升序), name (升序)');
  console.log('   - 查询范围: 集合');
  console.log('   - 用途: 按分类筛选标签并按名称排序');
  console.log('');
  console.log('2. images 集合索引:');
  console.log('   - 字段: status (升序), createdAt (降序)');
  console.log('   - 查询范围: 集合');
  console.log('   - 用途: 按状态筛选图片并按创建时间排序');
  console.log('');
  console.log('3. images 集合索引:');
  console.log('   - 字段: tags (数组包含), status (升序), createdAt (降序)');
  console.log('   - 查询范围: 集合');
  console.log('   - 用途: 按标签筛选图片并按创建时间排序');
  console.log('');
  console.log('4. tagCategories 集合索引:');
  console.log('   - 字段: isDefault (升序)');
  console.log('   - 查询范围: 集合');
  console.log('   - 用途: 查找默认分类');
  console.log('');
  console.log('5. tagCategories 集合索引:');
  console.log('   - 字段: name (升序)');
  console.log('   - 查询范围: 集合');
  console.log('   - 用途: 按名称查找分类（唯一性检查）');
  console.log('');
  console.log('🔗 创建索引链接:');
  console.log('   https://console.firebase.google.com/project/perceptive-map-465407-s9/firestore/indexes');
}

/**
 * 主初始化函数
 */
async function initializeDatabase() {
  console.log('🚀 开始初始化新数据库结构...');
  console.log('项目ID:', firebaseConfig.projectId);
  console.log('时间:', new Date().toISOString());
  console.log('=' .repeat(50));
  
  try {
    // 1. 创建默认分类
    const defaultCategoryId = await createDefaultCategory();
    
    // 2. 创建示例分类
    const categories = await createSampleCategories();
    
    // 3. 创建示例标签
    const tags = await createSampleTags(categories);
    
    console.log('=' .repeat(50));
    console.log('✅ 数据库初始化完成！');
    console.log('📊 初始化统计:');
    console.log(`   - 创建的分类数: ${categories.length + 1} (包含默认分类)`);
    console.log(`   - 创建的标签数: ${tags.length}`);
    console.log(`   - 完成时间: ${new Date().toISOString()}`);
    console.log('');
    
    // 4. 显示索引创建指南
    showIndexGuide();
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

// 主执行流程
async function main() {
  try {
    await initializeDatabase();
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
  initializeDatabase,
  createDefaultCategory,
  createSampleCategories,
  createSampleTags
};
