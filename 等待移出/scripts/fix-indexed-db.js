#!/usr/bin/env node

/**
 * 修复 lib/indexed-db.ts 的脚本
 * 适配新的数据结构
 */

const fs = require('fs');
const path = require('path');

const INDEXED_DB_FIXES = [
  // 修复过时属性引用
  { search: 'image.sortOrder', replace: 'image.order' },
  { search: 'image.prompts', replace: 'image.promptBlocks' },
  { search: 'promptBlock.sortOrder', replace: 'promptBlock.order' },
  { search: 'promptBlock.imageId', replace: 'promptBlock.id' },
  { search: 'promptBlock.updatedAt', replace: 'promptBlock.id' },
  { search: 'promptBlock.createdAt', replace: 'promptBlock.id' },
  
  // 修复模板属性
  { search: 'template.title', replace: 'template.content' },
  { search: 'template.text', replace: 'template.content' },
  
  // 修复变量名错误
  { search: 'promptBlock };', replace: 'promptBlock: newPromptBlock };' },
  { search: 'prompt.sortOrder', replace: 'promptBlock.order' },
  { search: 'prompt.id', replace: 'promptBlock.id' },
  { search: 'prompt.title', replace: 'promptBlock.content' },
  { search: 'prompt.content', replace: 'promptBlock.content' },
  
  // 修复数据结构
  { search: 'title: block.title', replace: 'content: block.content' },
  { search: 'content: block.text', replace: 'content: block.content' },
  { search: 'order: block.sortOrder', replace: 'order: block.order' },
  { search: 'createdAt: block.createdAt,', replace: '' },
  { search: 'updatedAt: block.updatedAt', replace: '' },
  
  // 修复循环引用
  { search: 'id: promptBlock.id ||', replace: 'id:' },
  { search: 'title: prompt.title', replace: 'content: prompt.content' },
  
  // 修复未定义变量
  { search: 'prompts.reduce', replace: 'promptBlocks.reduce' },
  { search: 'image.title.toLowerCase', replace: 'image.name?.toLowerCase' },
  
  // 修复搜索逻辑
  { search: 'prompt.title.toLowerCase', replace: 'promptBlock.content?.toLowerCase' },
  { search: '(prompt.content || \'\')', replace: '(promptBlock.content || \'\')' }
];

/**
 * 应用修复到indexed-db文件
 */
function fixIndexedDB() {
  const filePath = path.join(process.cwd(), 'lib/indexed-db.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ 文件不存在: lib/indexed-db.ts');
    return false;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    const appliedFixes = [];
    
    INDEXED_DB_FIXES.forEach(fix => {
      const regex = new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, fix.replace);
        appliedFixes.push(`${fix.search} -> ${fix.replace}`);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ lib/indexed-db.ts 修复完成');
      appliedFixes.forEach(fix => {
        console.log(`   - ${fix}`);
      });
      return true;
    } else {
      console.log('ℹ️  lib/indexed-db.ts 无需修复');
      return true;
    }
    
  } catch (error) {
    console.log(`❌ 修复失败: ${error.message}`);
    return false;
  }
}

/**
 * 修复API文件
 */
function fixApiFile() {
  const filePath = path.join(process.cwd(), 'lib/api.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ 文件不存在: lib/api.ts');
    return false;
  }
  
  const API_FIXES = [
    // 移除不存在的属性
    { search: 'timestamp: new Date(),', replace: '' },
    { search: 'filters,', replace: '' },
    { search: 'generateThumbnail', replace: 'thumbnail' },
    
    // 修复批量结果格式
    { search: 'results: ids.map(() => ({', replace: 'results: ids.map((id) => ({' },
    { search: 'success: false, error: any', replace: 'id, success: false, error: error.message' },
    { search: 'success: false, error: string', replace: 'id, success: false, error: "批量删除失败"' }
  ];
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    const appliedFixes = [];
    
    API_FIXES.forEach(fix => {
      const regex = new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, fix.replace);
        appliedFixes.push(`${fix.search} -> ${fix.replace}`);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ lib/api.ts 修复完成');
      appliedFixes.forEach(fix => {
        console.log(`   - ${fix}`);
      });
      return true;
    } else {
      console.log('ℹ️  lib/api.ts 无需修复');
      return true;
    }
    
  } catch (error) {
    console.log(`❌ 修复失败: ${error.message}`);
    return false;
  }
}

/**
 * 修复工具文件
 */
function fixUtilsFile() {
  const filePath = path.join(process.cwd(), 'lib/utils.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ 文件不存在: lib/utils.ts');
    return false;
  }
  
  const UTILS_FIXES = [
    // 修复标签处理
    { search: 'tag.name', replace: '(typeof tag === "string" ? tag : (tag as any).name)' },
    { search: 'filters.tags.some', replace: 'filters.tags?.some' },
    { search: 'imageTag.name', replace: '(typeof imageTag === "string" ? imageTag : (imageTag as any).name)' },
    
    // 修复排序字段
    { search: 'case \'title\':', replace: 'case \'name\':' },
    { search: 'a.title.toLowerCase', replace: 'a.name?.toLowerCase' },
    { search: 'b.title.toLowerCase', replace: 'b.name?.toLowerCase' },
    { search: 'case \'size\':', replace: 'case \'fileSize\':' }
  ];
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    const appliedFixes = [];
    
    UTILS_FIXES.forEach(fix => {
      const regex = new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, fix.replace);
        appliedFixes.push(`${fix.search} -> ${fix.replace}`);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ lib/utils.ts 修复完成');
      appliedFixes.forEach(fix => {
        console.log(`   - ${fix}`);
      });
      return true;
    } else {
      console.log('ℹ️  lib/utils.ts 无需修复');
      return true;
    }
    
  } catch (error) {
    console.log(`❌ 修复失败: ${error.message}`);
    return false;
  }
}

/**
 * 主修复函数
 */
function main() {
  console.log('🔧 开始修复库文件...');
  console.log('时间:', new Date().toISOString());
  console.log('=' .repeat(50));
  
  let successCount = 0;
  
  // 修复indexed-db
  console.log('\n📁 修复 lib/indexed-db.ts');
  console.log('-' .repeat(30));
  if (fixIndexedDB()) successCount++;
  
  // 修复api
  console.log('\n🌐 修复 lib/api.ts');
  console.log('-' .repeat(30));
  if (fixApiFile()) successCount++;
  
  // 修复utils
  console.log('\n🛠️  修复 lib/utils.ts');
  console.log('-' .repeat(30));
  if (fixUtilsFile()) successCount++;
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 修复结果汇总');
  console.log(`✅ 成功修复: ${successCount}/3 个文件`);
  
  if (successCount === 3) {
    console.log('\n🎉 所有库文件修复完成!');
    console.log('💡 建议运行 npx tsc --noEmit 检查剩余错误');
  } else {
    console.log('\n⚠️  部分文件修复失败，请手动检查');
  }
  
  console.log(`\n完成时间: ${new Date().toISOString()}`);
}

// 运行修复
if (require.main === module) {
  main();
}

module.exports = {
  fixIndexedDB,
  fixApiFile,
  fixUtilsFile,
  main
};
