#!/usr/bin/env node

/**
 * 清理过时代码脚本
 * 移除重构后不再需要的旧API路由、类型定义和文件
 */

const fs = require('fs');
const path = require('path');

// 需要删除的过时API路由
const LEGACY_API_ROUTES = [
  'app/api/categories',           // 被 tag-categories 替代
  'app/api/prompts',              // 提示词现在是图片的一部分
  'app/api/images/[id]',          // 旧的图片单个操作API
  'app/api/images/search',        // 搜索功能集成到主API
  'app/api/images/admin',         // 管理员功能简化
  'app/api/upload',               // 上传功能重构
];

// 需要删除的过时文件
const LEGACY_FILES = [
  'lib/database-admin.ts',        // 旧的管理员数据库操作
  'lib/admin-image-storage.ts',   // 旧的管理员存储服务
  'lib/client-image-storage.ts',  // 客户端存储操作（安全风险）
  'lib/listeners.ts',             // 旧的数据监听器
  'Docs/TechDebt.md',            // 技术债务文档（已解决）
];

// 需要检查的类型定义文件中的过时类型
const LEGACY_TYPES = [
  'ImageDocument',
  'TagDocument', 
  'CategoryDocument',
  'PromptDocument',
  'ImageTagDocument',
  'ImageTag',
  'TagGroup',
  'TagGroupDocument',
  'Prompt',
  'FirestorePrompt',
  'Category',
  'FirestoreCategory',
];

/**
 * 删除文件或目录
 */
function deleteFileOrDir(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  文件不存在: ${filePath}`);
    return false;
  }
  
  try {
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`   ✅ 删除目录: ${filePath}`);
    } else {
      fs.unlinkSync(fullPath);
      console.log(`   ✅ 删除文件: ${filePath}`);
    }
    
    return true;
  } catch (error) {
    console.log(`   ❌ 删除失败: ${filePath} - ${error.message}`);
    return false;
  }
}

/**
 * 检查文件中是否包含过时类型
 */
function checkLegacyTypes(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const foundTypes = [];
    
    LEGACY_TYPES.forEach(type => {
      // 检查类型定义、导入、使用等
      const patterns = [
        new RegExp(`interface\\s+${type}\\s*{`, 'g'),
        new RegExp(`type\\s+${type}\\s*=`, 'g'),
        new RegExp(`import.*${type}`, 'g'),
        new RegExp(`:\\s*${type}\\b`, 'g'),
        new RegExp(`<${type}>`, 'g'),
        new RegExp(`as\\s+${type}\\b`, 'g'),
      ];
      
      patterns.forEach(pattern => {
        if (pattern.test(content)) {
          foundTypes.push(type);
        }
      });
    });
    
    return [...new Set(foundTypes)]; // 去重
  } catch (error) {
    console.log(`   ❌ 检查文件失败: ${filePath} - ${error.message}`);
    return [];
  }
}

/**
 * 扫描目录中的TypeScript文件
 */
function scanDirectory(dirPath, extensions = ['.ts', '.tsx']) {
  const files = [];
  const fullPath = path.join(process.cwd(), dirPath);
  
  if (!fs.existsSync(fullPath)) {
    return files;
  }
  
  function scanRecursive(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory() && !item.startsWith('.')) {
        scanRecursive(itemPath);
      } else if (stats.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          const relativePath = path.relative(process.cwd(), itemPath);
          files.push(relativePath);
        }
      }
    });
  }
  
  scanRecursive(fullPath);
  return files;
}

/**
 * 主清理函数
 */
function cleanup() {
  console.log('🧹 开始清理过时代码...');
  console.log('时间:', new Date().toISOString());
  console.log('=' .repeat(50));
  
  let deletedCount = 0;
  let totalCount = 0;
  
  // 1. 删除过时的API路由
  console.log('\n📁 清理过时的API路由');
  console.log('-' .repeat(30));
  
  LEGACY_API_ROUTES.forEach(route => {
    totalCount++;
    if (deleteFileOrDir(route)) {
      deletedCount++;
    }
  });
  
  // 2. 删除过时的文件
  console.log('\n📄 清理过时的文件');
  console.log('-' .repeat(30));
  
  LEGACY_FILES.forEach(file => {
    totalCount++;
    if (deleteFileOrDir(file)) {
      deletedCount++;
    }
  });
  
  // 3. 检查过时类型的使用
  console.log('\n🔍 检查过时类型的使用');
  console.log('-' .repeat(30));
  
  const typescriptFiles = [
    ...scanDirectory('app'),
    ...scanDirectory('components'),
    ...scanDirectory('lib'),
    ...scanDirectory('hooks'),
    ...scanDirectory('types'),
  ];
  
  const filesWithLegacyTypes = [];
  
  typescriptFiles.forEach(file => {
    const legacyTypes = checkLegacyTypes(file);
    if (legacyTypes.length > 0) {
      filesWithLegacyTypes.push({
        file,
        types: legacyTypes
      });
    }
  });
  
  if (filesWithLegacyTypes.length > 0) {
    console.log('   ⚠️  发现使用过时类型的文件:');
    filesWithLegacyTypes.forEach(({ file, types }) => {
      console.log(`   📄 ${file}`);
      console.log(`      过时类型: ${types.join(', ')}`);
    });
  } else {
    console.log('   ✅ 未发现过时类型的使用');
  }
  
  // 4. 检查是否有空目录需要清理
  console.log('\n📂 检查空目录');
  console.log('-' .repeat(30));
  
  const emptyDirs = [];
  
  function checkEmptyDirs(dirPath) {
    const fullPath = path.join(process.cwd(), dirPath);
    
    if (!fs.existsSync(fullPath)) {
      return;
    }
    
    try {
      const items = fs.readdirSync(fullPath);
      
      if (items.length === 0) {
        emptyDirs.push(dirPath);
      } else {
        items.forEach(item => {
          const itemPath = path.join(dirPath, item);
          const itemFullPath = path.join(process.cwd(), itemPath);
          const stats = fs.statSync(itemFullPath);
          
          if (stats.isDirectory() && !item.startsWith('.')) {
            checkEmptyDirs(itemPath);
          }
        });
      }
    } catch (error) {
      // 忽略权限错误等
    }
  }
  
  ['app/api', 'lib', 'components'].forEach(dir => {
    checkEmptyDirs(dir);
  });
  
  if (emptyDirs.length > 0) {
    console.log('   📂 发现空目录:');
    emptyDirs.forEach(dir => {
      console.log(`   📁 ${dir}`);
      deleteFileOrDir(dir);
      deletedCount++;
      totalCount++;
    });
  } else {
    console.log('   ✅ 未发现空目录');
  }
  
  // 5. 汇总结果
  console.log('\n' + '=' .repeat(50));
  console.log('📊 清理结果汇总');
  console.log(`✅ 成功删除: ${deletedCount}/${totalCount}`);
  console.log(`⚠️  需要手动处理的文件: ${filesWithLegacyTypes.length}`);
  
  if (filesWithLegacyTypes.length > 0) {
    console.log('\n📋 手动处理建议:');
    filesWithLegacyTypes.forEach(({ file, types }) => {
      console.log(`1. 检查 ${file}`);
      console.log(`   - 移除或替换过时类型: ${types.join(', ')}`);
      console.log(`   - 更新为新的类型定义`);
    });
  }
  
  console.log(`\n🎉 清理完成! 完成时间: ${new Date().toISOString()}`);
}

/**
 * 确认清理操作
 */
function confirmCleanup() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    console.log('⚠️  警告: 此操作将删除过时的代码文件！');
    console.log('📋 将要删除的内容:');
    console.log('   - 过时的API路由');
    console.log('   - 过时的数据库操作文件');
    console.log('   - 过时的存储服务文件');
    console.log('   - 技术债务文档');
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
      const confirmed = await confirmCleanup();
      if (!confirmed) {
        console.log('❌ 操作已取消');
        process.exit(0);
      }
    }
    
    cleanup();
    
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
  cleanup,
  deleteFileOrDir,
  checkLegacyTypes
};
