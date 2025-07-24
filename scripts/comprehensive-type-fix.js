#!/usr/bin/env node

/**
 * 全面的类型修复脚本
 * 批量修复所有TypeScript错误
 */

const fs = require('fs');
const path = require('path');

// 全面的修复规则
const COMPREHENSIVE_FIXES = [
  // API文件修复
  {
    file: 'app/api/images/route.ts',
    fixes: [
      { search: 'category: category,', replace: 'category: tagCategory,' },
      { search: 'const category = categoriesMap.get', replace: 'const tagCategory = categoriesMap.get' }
    ]
  },
  {
    file: 'app/api/tag-categories/route.ts',
    fixes: [
      { search: 'allCategories.push(category);', replace: 'allCategories.push(tagCategory);' },
      { search: 'data: tagCategories,', replace: 'data: allCategories,' },
      { search: 'const category = {', replace: 'const tagCategory = {' }
    ]
  },
  
  // 组件文件修复 - 变量名问题
  {
    file: 'components/app-sidebar.tsx',
    fixes: [
      { search: 'getTagsByGroup,', replace: 'getTagsByCategory,' },
      { search: 'tagGroups={tagCategories}', replace: 'tagCategories={tagCategories}' }
    ]
  },
  
  // 图片模态框组件修复
  {
    file: 'components/image-modal/image-modal.tsx',
    fixes: [
      { search: 'modalState.prompts', replace: 'modalState.promptBlocks' },
      { search: 'prompts={modalState.promptBlocks}', replace: 'promptBlocks={modalState.promptBlocks}' },
      { search: 'tagGroups={tagCategories}', replace: 'tagCategories={tagCategories}' }
    ]
  },
  
  {
    file: 'components/image-modal/ImageActions.tsx',
    fixes: [
      { search: 'tagGroups={tagCategories}', replace: 'tagCategories={tagCategories}' }
    ]
  },
  
  {
    file: 'components/image-modal/ImageInfo.tsx',
    fixes: [
      { search: 'tagGroup ?', replace: 'tagCategory ?' },
      { search: 'tagGroup.color', replace: 'tagCategory.color' },
      { search: "getColorTheme('gray')", replace: "getColorTheme('pink')" }
    ]
  },
  
  {
    file: 'components/image-modal/TagSelectorDropdown.tsx',
    fixes: [
      { search: 'createTagGroup,', replace: 'createTagCategory,' },
      { search: 'tagGroups[0]', replace: 'tagCategories[0]' },
      { search: 'tagGroups.forEach', replace: 'tagCategories.forEach' },
      { search: 'tagGroups.length', replace: 'tagCategories.length' },
      { search: 'tagGroups={tagCategories}', replace: 'tagCategories={tagCategories}' },
      { search: 'categoryId: finalCategoryId || undefined', replace: 'categoryId: finalCategoryId || tagCategories[0]?.id || ""' },
      { search: 'category.id', replace: 'tagCategory.id' }
    ]
  },
  
  {
    file: 'components/image-modal/useImageModalActions.ts',
    fixes: [
      { search: 'modalState.prompts', replace: 'modalState.promptBlocks' },
      { search: 'image.prompts', replace: 'image.promptBlocks' },
      { search: 'promptBlock.title', replace: 'promptBlock.content' },
      { search: 'prompt.content', replace: 'promptBlock.content' },
      { search: 'prompt.color', replace: 'promptBlock.color' },
      { search: 'prompt.order', replace: 'promptBlock.order' },
      { search: 'prompt.id', replace: 'promptBlock.id' },
      { search: 'title: \'新提示词\',', replace: '' }
    ]
  },
  
  {
    file: 'components/image-modal/useImageModalState.ts',
    fixes: [
      { search: 'useState<Prompt[]>', replace: 'useState<PromptBlock[]>' },
      { search: 'image.prompts', replace: 'image.promptBlocks' }
    ]
  },
  
  // 其他组件修复
  {
    file: 'components/optimized-image-grid.tsx',
    fixes: [
      { search: 'key={tag.id}', replace: 'key={typeof tag === "string" ? tag : tag.id}' },
      { search: 'tag.color', replace: '(typeof tag === "string" ? "#6B7280" : tag.color)' },
      { search: 'tag.name', replace: '(typeof tag === "string" ? tag : tag.name)' }
    ]
  },
  
  {
    file: 'components/prompt-block.tsx',
    fixes: [
      { search: 'prompt.content', replace: 'promptBlock.content' },
      { search: 'prompt.color', replace: 'promptBlock.color' },
      { search: 'theme.bg', replace: 'theme.colors.bg' },
      { search: 'theme.text', replace: 'theme.colors.text' }
    ]
  },
  
  // 标签管理组件修复
  {
    file: 'components/tags/tag-management-panel.tsx',
    fixes: [
      { search: 'getTagsByGroup,', replace: 'getTagsByCategory,' },
      { search: 'createTagGroup,', replace: 'createTagCategory,' },
      { search: 'updateTagGroup,', replace: 'updateTagCategory,' },
      { search: 'deleteTagGroup,', replace: 'deleteTagCategory,' },
      { search: 'useState<TagGroup[]>', replace: 'useState<TagCategory[]>' },
      { search: 'useState<TagGroup | null>', replace: 'useState<TagCategory | null>' },
      { search: 'data?: Tag | TagGroup;', replace: 'data?: Tag | TagCategory;' },
      { search: 'categoryId: data.categoryId || undefined', replace: 'categoryId: data.categoryId || tagCategories[0]?.id || ""' },
      { search: 'setEditingCategory(tagCategory);', replace: 'setEditingCategory(category);' },
      { search: "type === 'category'", replace: "type === 'tagCategory'" },
      { search: 'tagGroups.length', replace: 'tagCategories.length' },
      { search: 'category.id', replace: 'tagCategory.id' },
      { search: "type: 'category'", replace: "type: 'tagCategory'" },
      { search: 'tag.color', replace: '"#64748b"' }
    ]
  },
  
  // Hooks修复
  {
    file: 'hooks/use-tag-operations.ts',
    fixes: [
      { search: 'fetchTagGroups();', replace: 'fetchTagCategories();' },
      { search: 'await fetchTagGroups();', replace: 'await fetchTagCategories();' }
    ]
  },
  
  {
    file: 'hooks/use-prompt-operations.ts',
    fixes: [
      { search: 'useState<Prompt[]>', replace: 'useState<PromptBlock[]>' },
      { search: 'data: Omit<Prompt,', replace: 'data: Omit<PromptBlock,' },
      { search: 'data: Partial<Omit<Prompt,', replace: 'data: Partial<Omit<PromptBlock,' },
      { search: 'getPromptById: (id: string) => Prompt', replace: 'getPromptById: (id: string) => PromptBlock' },
      { search: 'promptBlock };', replace: 'promptBlock: newPromptBlock };' },
      { search: '...promptBlock, ...data', replace: '...promptBlock, ...data' },
      { search: 'prompt.id', replace: 'promptBlock.id' }
    ]
  }
];

/**
 * 应用修复到文件
 */
function applyComprehensiveFixes(filePath, fixes) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { success: false, error: '文件不存在' };
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let hasChanges = false;
    const appliedFixes = [];
    
    fixes.forEach(fix => {
      const regex = new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, fix.replace);
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
 * 删除过时的文件
 */
function removeObsoleteFiles() {
  const filesToRemove = [
    'hooks/use-home-page.ts', // 引用了不存在的listeners
    'scripts/migrate-to-independent-tables.ts', // 使用过时类型
    'lib/update-helpers.ts' // 使用过时的Firestore API
  ];
  
  let removedCount = 0;
  
  filesToRemove.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`   ✅ 删除过时文件: ${file}`);
        removedCount++;
      } catch (error) {
        console.log(`   ❌ 删除失败: ${file} - ${error.message}`);
      }
    }
  });
  
  return removedCount;
}

/**
 * 主修复函数
 */
function comprehensiveTypeFix() {
  console.log('🔧 开始全面修复TypeScript错误...');
  console.log('时间:', new Date().toISOString());
  console.log('=' .repeat(50));
  
  // 1. 删除过时文件
  console.log('\n🗑️  删除过时文件');
  console.log('-' .repeat(30));
  const removedCount = removeObsoleteFiles();
  
  // 2. 应用修复
  console.log('\n🔧 应用类型修复');
  console.log('-' .repeat(30));
  
  let fixedCount = 0;
  let totalChanges = 0;
  
  COMPREHENSIVE_FIXES.forEach(({ file, fixes }) => {
    const result = applyComprehensiveFixes(file, fixes);
    
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
  console.log(`🗑️  删除文件数: ${removedCount}`);
  console.log(`📄 检查文件数: ${COMPREHENSIVE_FIXES.length}`);
  
  console.log('\n💡 建议下一步操作:');
  console.log('1. 运行 npx tsc --noEmit 检查剩余错误');
  console.log('2. 手动修复剩余的复杂类型问题');
  console.log('3. 运行 npm run dev 测试应用');
  
  console.log(`\n🎉 修复完成! 完成时间: ${new Date().toISOString()}`);
}

// 运行修复
if (require.main === module) {
  comprehensiveTypeFix();
}

module.exports = {
  comprehensiveTypeFix,
  applyComprehensiveFixes,
  COMPREHENSIVE_FIXES
};
