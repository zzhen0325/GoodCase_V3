#!/usr/bin/env node

/**
 * 修复过时类型引用脚本
 * 自动替换代码中的过时类型为新类型
 */

const fs = require('fs');
const path = require('path');

// 类型映射：旧类型 -> 新类型
const TYPE_MAPPINGS = {
  'TagGroup': 'TagCategory',
  'Category': 'TagCategory', 
  'Prompt': 'PromptBlock',
  'ImageDocument': 'FirestoreImage',
  'TagDocument': 'FirestoreTag',
  'CategoryDocument': 'FirestoreTagCategory',
  'PromptDocument': 'FirestorePrompt',
  'ImageTagDocument': 'ImageTag',
  'TagGroupDocument': 'FirestoreTagCategory',
};

// API端点映射：旧端点 -> 新端点
const API_MAPPINGS = {
  '/api/categories': '/api/tag-categories',
  '/api/prompts': '/api/images', // 提示词现在是图片的一部分
};

// 变量名映射：旧变量名 -> 新变量名
const VARIABLE_MAPPINGS = {
  'tagGroups': 'tagCategories',
  'tagGroup': 'tagCategory',
  'categories': 'tagCategories',
  'category': 'tagCategory',
  'prompts': 'promptBlocks',
  'prompt': 'promptBlock',
};

/**
 * 修复文件中的类型引用
 */
function fixTypesInFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { success: false, error: '文件不存在' };
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let hasChanges = false;
    const changes = [];
    
    // 1. 修复import语句中的类型
    Object.entries(TYPE_MAPPINGS).forEach(([oldType, newType]) => {
      const importPattern = new RegExp(`(import.*?{[^}]*?)\\b${oldType}\\b([^}]*?})`, 'g');
      const newContent = content.replace(importPattern, (match, before, after) => {
        if (!match.includes(newType)) {
          changes.push(`Import: ${oldType} -> ${newType}`);
          hasChanges = true;
          return before + newType + after;
        }
        return match;
      });
      content = newContent;
    });
    
    // 2. 修复类型注解
    Object.entries(TYPE_MAPPINGS).forEach(([oldType, newType]) => {
      const typeAnnotationPattern = new RegExp(`:\\s*${oldType}\\b`, 'g');
      if (typeAnnotationPattern.test(content)) {
        content = content.replace(typeAnnotationPattern, `: ${newType}`);
        changes.push(`Type annotation: ${oldType} -> ${newType}`);
        hasChanges = true;
      }
    });
    
    // 3. 修复泛型类型
    Object.entries(TYPE_MAPPINGS).forEach(([oldType, newType]) => {
      const genericPattern = new RegExp(`<${oldType}>`, 'g');
      if (genericPattern.test(content)) {
        content = content.replace(genericPattern, `<${newType}>`);
        changes.push(`Generic: <${oldType}> -> <${newType}>`);
        hasChanges = true;
      }
    });
    
    // 4. 修复as类型断言
    Object.entries(TYPE_MAPPINGS).forEach(([oldType, newType]) => {
      const asPattern = new RegExp(`as\\s+${oldType}\\b`, 'g');
      if (asPattern.test(content)) {
        content = content.replace(asPattern, `as ${newType}`);
        changes.push(`Type assertion: as ${oldType} -> as ${newType}`);
        hasChanges = true;
      }
    });
    
    // 5. 修复API端点
    Object.entries(API_MAPPINGS).forEach(([oldApi, newApi]) => {
      const apiPattern = new RegExp(`['"\`]${oldApi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g');
      if (apiPattern.test(content)) {
        content = content.replace(apiPattern, `'${newApi}'`);
        changes.push(`API endpoint: ${oldApi} -> ${newApi}`);
        hasChanges = true;
      }
    });
    
    // 6. 修复常见的变量名（谨慎处理，只处理明显的情况）
    Object.entries(VARIABLE_MAPPINGS).forEach(([oldVar, newVar]) => {
      // 只替换对象属性和解构赋值中的变量名
      const destructuringPattern = new RegExp(`(\\{[^}]*?)\\b${oldVar}\\b([^}]*?\\})`, 'g');
      if (destructuringPattern.test(content)) {
        content = content.replace(destructuringPattern, (match, before, after) => {
          changes.push(`Variable: ${oldVar} -> ${newVar} (destructuring)`);
          hasChanges = true;
          return before + newVar + after;
        });
      }
    });
    
    // 如果有修改，写回文件
    if (hasChanges) {
      fs.writeFileSync(fullPath, content, 'utf8');
      return { success: true, changes };
    }
    
    return { success: true, changes: [] };
    
  } catch (error) {
    return { success: false, error: error.message };
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
      
      if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
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
 * 主修复函数
 */
function fixLegacyTypes() {
  console.log('🔧 开始修复过时类型引用...');
  console.log('时间:', new Date().toISOString());
  console.log('=' .repeat(50));
  
  // 扫描需要修复的文件
  const filesToFix = [
    ...scanDirectory('app/api'),
    ...scanDirectory('components'),
    ...scanDirectory('hooks'),
    ...scanDirectory('lib'),
  ];
  
  console.log(`📄 找到 ${filesToFix.length} 个文件需要检查`);
  console.log('');
  
  let fixedCount = 0;
  let totalChanges = 0;
  
  filesToFix.forEach(file => {
    const result = fixTypesInFile(file);
    
    if (result.success) {
      if (result.changes.length > 0) {
        console.log(`✅ ${file}`);
        result.changes.forEach(change => {
          console.log(`   - ${change}`);
        });
        fixedCount++;
        totalChanges += result.changes.length;
        console.log('');
      }
    } else {
      console.log(`❌ ${file}: ${result.error}`);
    }
  });
  
  console.log('=' .repeat(50));
  console.log('📊 修复结果汇总');
  console.log(`✅ 修复文件数: ${fixedCount}`);
  console.log(`🔧 总修改数: ${totalChanges}`);
  console.log(`📄 检查文件数: ${filesToFix.length}`);
  
  if (fixedCount > 0) {
    console.log('');
    console.log('🎉 类型修复完成！');
    console.log('💡 建议运行以下命令验证修复结果:');
    console.log('   npm run type-check');
    console.log('   npm run dev');
  } else {
    console.log('');
    console.log('✨ 未发现需要修复的类型问题');
  }
  
  console.log(`完成时间: ${new Date().toISOString()}`);
}

// 运行修复
if (require.main === module) {
  fixLegacyTypes();
}

module.exports = {
  fixLegacyTypes,
  fixTypesInFile,
  TYPE_MAPPINGS,
  API_MAPPINGS,
  VARIABLE_MAPPINGS
};
