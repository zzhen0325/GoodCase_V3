#!/usr/bin/env node

/**
 * 修复剩余的类型问题脚本
 * 处理复杂的类型错误和变量名问题
 */

const fs = require('fs');
const path = require('path');

// 需要修复的具体问题
const FIXES = [
  // API文件修复
  {
    file: 'app/api/images/route.ts',
    fixes: [
      {
        search: 'category: category,',
        replace: 'category: tagCategory,'
      }
    ]
  },
  {
    file: 'app/api/tag-categories/[categoryId]/route.ts',
    fixes: [
      {
        search: 'data: tagCategory',
        replace: 'data: category'
      }
    ]
  },
  {
    file: 'app/api/tag-categories/route.ts',
    fixes: [
      {
        search: 'allCategories.push(category);',
        replace: 'allCategories.push(tagCategory);'
      },
      {
        search: 'data: tagCategories,',
        replace: 'data: categories,'
      }
    ]
  },
  
  // 组件文件修复
  {
    file: 'components/app-sidebar.tsx',
    fixes: [
      {
        search: 'tagGroups={tagCategories}',
        replace: 'tagCategories={tagCategories}'
      }
    ]
  },
  {
    file: 'components/image-modal/ImageActions.tsx',
    fixes: [
      {
        search: 'tagGroups={tagCategories}',
        replace: 'tagCategories={tagCategories}'
      }
    ]
  },
  {
    file: 'components/image-modal/ImageInfo.tsx',
    fixes: [
      {
        search: "import { getColorTheme } from '@/types';",
        replace: "import { getColorTheme } from '@/types';"
      },
      {
        search: 'tagGroup ? getColorTheme(tagGroup.color || \'gray\') : getColorTheme(\'gray\')',
        replace: 'tagCategory ? getColorTheme(tagCategory.color || \'gray\') : getColorTheme(\'gray\')'
      },
      {
        search: 'tagGroups={tagCategories}',
        replace: 'tagCategories={tagCategories}'
      }
    ]
  },
  {
    file: 'components/image-modal/PromptList.tsx',
    fixes: [
      {
        search: "import { PromptBlock } from '@/components/prompt-block';",
        replace: "import { PromptBlockComponent } from '@/components/prompt-block';"
      },
      {
        search: 'prompts={modalState.promptBlocks}',
        replace: 'promptBlocks={modalState.promptBlocks}'
      }
    ]
  },
  {
    file: 'components/image-modal/TagSelectorDropdown.tsx',
    fixes: [
      {
        search: 'tagGroups[0].id',
        replace: 'tagCategories[0].id'
      },
      {
        search: 'tagGroups.forEach',
        replace: 'tagCategories.forEach'
      },
      {
        search: 'tagGroups={tagCategories}',
        replace: 'tagCategories={tagCategories}'
      }
    ]
  },
  
  // Hooks文件修复
  {
    file: 'hooks/use-tag-operations.ts',
    fixes: [
      {
        search: 'fetchTagGroups();',
        replace: 'fetchTagCategories();'
      },
      {
        search: 'await fetchTagGroups();',
        replace: 'await fetchTagCategories();'
      },
      {
        search: 'groupsLoading',
        replace: 'categoriesLoading'
      }
    ]
  },
  
  // 共享组件修复
  {
    file: 'components/shared/DataContext.tsx',
    fixes: [
      {
        search: 'TagGroup[]',
        replace: 'TagCategory[]'
      },
      {
        search: 'categories,',
        replace: 'tagCategories,'
      }
    ]
  }
];

/**
 * 应用修复到文件
 */
function applyFixes(filePath, fixes) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { success: false, error: '文件不存在' };
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let hasChanges = false;
    const appliedFixes = [];
    
    fixes.forEach(fix => {
      if (content.includes(fix.search)) {
        content = content.replace(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
        appliedFixes.push(`${fix.search} -> ${fix.replace}`);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(fullPath, content, 'utf8');
      return { success: true, changes: appliedFixes };
    }
    
    return { success: true, changes: [] };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 主修复函数
 */
function fixRemainingTypes() {
  console.log('🔧 开始修复剩余的类型问题...');
  console.log('时间:', new Date().toISOString());
  console.log('=' .repeat(50));
  
  let fixedCount = 0;
  let totalChanges = 0;
  
  FIXES.forEach(({ file, fixes }) => {
    const result = applyFixes(file, fixes);
    
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
  console.log(`📄 检查文件数: ${FIXES.length}`);
  
  if (fixedCount > 0) {
    console.log('');
    console.log('🎉 类型修复完成！');
    console.log('💡 建议运行以下命令验证修复结果:');
    console.log('   npx tsc --noEmit');
  } else {
    console.log('');
    console.log('✨ 未发现需要修复的问题');
  }
  
  console.log(`完成时间: ${new Date().toISOString()}`);
}

// 运行修复
if (require.main === module) {
  fixRemainingTypes();
}

module.exports = {
  fixRemainingTypes,
  applyFixes,
  FIXES
};
