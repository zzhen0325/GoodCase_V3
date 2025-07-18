// 使用fetch API测试默认分组功能
const BASE_URL = 'http://localhost:3001';

async function testDefaultGroup() {
  try {
    console.log('开始测试默认分组功能...');
    
    // 1. 获取所有标签分组，这会触发默认分组的创建
    console.log('1. 获取所有标签分组（会自动创建默认分组）...');
    const groupsResponse = await fetch(`${BASE_URL}/api/tag-groups`);
    const groupsData = await groupsResponse.json();
    
    if (!groupsResponse.ok) {
      throw new Error(`获取标签分组失败: ${groupsData.error}`);
    }
    
    console.log('标签分组列表:');
    groupsData.tagGroups.forEach(group => {
      console.log(`  - ${group.name} (ID: ${group.id}, 颜色: ${group.color})`);
    });
    
    // 查找默认分组
    const defaultGroup = groupsData.tagGroups.find(group => group.id === 'default');
    if (defaultGroup) {
      console.log('\n✅ 默认分组已存在:', defaultGroup.name);
    } else {
      console.log('\n❌ 未找到默认分组');
      return;
    }
    
    // 2. 创建一个测试标签，不指定分组ID
    console.log('\n2. 创建测试标签（不指定分组）...');
    const tagResponse = await fetch(`${BASE_URL}/api/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: '测试标签_' + Date.now(),
        color: '#ff6b6b'
        // 注意：没有指定 groupId
      })
    });
    
    const tagData = await tagResponse.json();
    
    if (!tagResponse.ok) {
      throw new Error(`创建标签失败: ${tagData.error}`);
    }
    
    console.log('创建的标签:', tagData.tag);
    console.log('标签分组ID:', tagData.tag.groupId);
    
    // 3. 验证标签是否被分配到默认分组
    if (tagData.tag.groupId === 'default') {
      console.log('\n✅ 测试成功：标签已自动分配到默认分组');
    } else {
      console.log('\n❌ 测试失败：标签未分配到默认分组');
      console.log('期望分组ID: default');
      console.log('实际分组ID:', tagData.tag.groupId);
    }
    
    // 4. 获取所有标签，查看默认分组下的标签
    console.log('\n4. 获取所有标签...');
    const allTagsResponse = await fetch(`${BASE_URL}/api/tags`);
    const allTagsData = await allTagsResponse.json();
    
    if (!allTagsResponse.ok) {
      throw new Error(`获取标签失败: ${allTagsData.error}`);
    }
    
    const defaultGroupTags = allTagsData.tags.filter(tag => tag.groupId === 'default');
    console.log(`默认分组包含 ${defaultGroupTags.length} 个标签:`);
    defaultGroupTags.forEach(tag => {
      console.log(`  - ${tag.name} (颜色: ${tag.color})`);
    });
    
    console.log('\n测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testDefaultGroup();