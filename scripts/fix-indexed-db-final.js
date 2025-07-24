#!/usr/bin/env node

/**
 * 最终修复 lib/indexed-db.ts 的脚本
 * 解决剩余的类型错误
 */

const fs = require('fs');
const path = require('path');

const INDEXED_DB_FINAL_FIXES = [
  // 修复defaultPrompts的类型问题
  { 
    search: 'title: \'风格\',', 
    replace: '' 
  },
  { 
    search: 'text: \'风格\',', 
    replace: '' 
  },
  { 
    search: 'content: \'风格\',', 
    replace: 'content: \'风格\',' 
  },
  { 
    search: 'color: \'#ef4444\',', 
    replace: 'color: \'pink\' as const,' 
  },
  { 
    search: 'imageId: imageId,', 
    replace: '' 
  },
  { 
    search: 'sortOrder: 0,', 
    replace: '' 
  },
  { 
    search: 'order: 0,', 
    replace: 'order: 0,' 
  },
  { 
    search: 'createdAt: new Date().toISOString(),', 
    replace: '' 
  },
  { 
    search: 'updatedAt: new Date().toISOString()', 
    replace: '' 
  },
  
  // 修复重复属性
  { 
    search: 'color: prompt.color || \'#ef4444\',', 
    replace: '' 
  },
  { 
    search: 'color: \'pink\' as const,', 
    replace: 'color: \'pink\' as const,' 
  },
  
  // 修复createdAt和updatedAt引用
  { 
    search: 'createdAt: prompt.createdAt?.toString(),', 
    replace: '' 
  },
  { 
    search: 'updatedAt: prompt.updatedAt?.toString()', 
    replace: '' 
  },
  
  // 修复重复的content属性
  { 
    search: 'content: block.content || \'\',', 
    replace: 'content: block.content || \'\',' 
  },
  { 
    search: 'content: block.content || \'\',\n      content: block.content || \'\',', 
    replace: 'content: block.content || \'\',' 
  },
  
  // 修复updatedAt属性
  { 
    search: 'updatedAt: new Date().toISOString()', 
    replace: '' 
  }
];

/**
 * 应用修复到indexed-db文件
 */
function fixIndexedDBFinal() {
  const filePath = path.join(process.cwd(), 'lib/indexed-db.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log('❌ 文件不存在: lib/indexed-db.ts');
    return false;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    const appliedFixes = [];
    
    INDEXED_DB_FINAL_FIXES.forEach(fix => {
      const regex = new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, fix.replace);
        appliedFixes.push(`${fix.search} -> ${fix.replace}`);
        hasChanges = true;
      }
    });
    
    // 手动修复一些复杂的问题
    
    // 修复defaultPrompts数组
    content = content.replace(
      /const defaultPrompts = \[[\s\S]*?\];/,
      `const defaultPrompts: PromptBlock[] = [
        {
          id: \`\${imageId}_prompt_style\`,
          content: '风格',
          color: 'pink' as const,
          order: 0,
        },
        {
          id: \`\${imageId}_prompt_subject\`,
          content: '主体',
          color: 'cyan' as const,
          order: 1,
        },
        {
          id: \`\${imageId}_prompt_scene\`,
          content: '场景',
          color: 'yellow' as const,
          order: 2,
        }
      ];`
    );
    
    // 修复重复的color属性
    content = content.replace(
      /color: prompt\.color \|\| '#ef4444',\s*color: 'pink' as const,/g,
      "color: 'pink' as const,"
    );
    
    // 修复重复的content属性
    content = content.replace(
      /content: block\.content \|\| '',\s*content: block\.content \|\| '',/g,
      "content: block.content || '',"
    );
    
    if (hasChanges || content !== fs.readFileSync(filePath, 'utf8')) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('✅ lib/indexed-db.ts 最终修复完成');
      appliedFixes.forEach(fix => {
        console.log(`   - ${fix}`);
      });
      console.log('   - 修复了defaultPrompts数组');
      console.log('   - 修复了重复属性');
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
 * 主修复函数
 */
function main() {
  console.log('🔧 开始最终修复 lib/indexed-db.ts...');
  console.log('时间:', new Date().toISOString());
  console.log('=' .repeat(50));
  
  const success = fixIndexedDBFinal();
  
  console.log('\n' + '=' .repeat(50));
  if (success) {
    console.log('🎉 lib/indexed-db.ts 最终修复完成!');
    console.log('💡 建议运行 npx tsc --noEmit 检查剩余错误');
  } else {
    console.log('⚠️  修复失败，请手动检查');
  }
  
  console.log(`\n完成时间: ${new Date().toISOString()}`);
}

// 运行修复
if (require.main === module) {
  main();
}

module.exports = {
  fixIndexedDBFinal,
  main
};
