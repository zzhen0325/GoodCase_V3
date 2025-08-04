import { useState, useEffect } from 'react';
import { useDataContext } from '../components/shared/DataContext';
import { Tag, TagCategory } from '@/types';

// 正确的标签和分类数据
export function useTagOperations() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { tags, setTags, tagCategories, setCategories, loading, error, refreshData } = useDataContext();
  
  // 使用DataContext的状态，不再重复获取数据
  const tagsLoading = loading;
  const tagsError = error;
  const categoriesLoading = loading;
  const categoriesError = error;

  // 刷新数据的方法
  const fetchTags = refreshData;
  const fetchTagCategories = refreshData;

  // getTagGroups 不再独立请求，数据由 DataContext 初始化

  // 标签操作方法
  const createTag = async (data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建标签失败');
      }
      
      const result = await response.json();
      const tag = result.data || result.tag;
      setTags((prev: Tag[]) => [...prev, tag]);
      return { success: true, tag };
    } catch (error) {
      console.error('创建标签失败:', error);
      return { success: false, error: '创建标签失败' };
    }
  };

  const updateTag = async (id: string, data: Partial<Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新标签失败');
      }
      setTags((prev: Tag[]) => prev.map((tag: Tag) => tag.id === id ? { ...tag, ...data } : tag));
      return { success: true };
    } catch (error) {
      console.error('更新标签失败:', error);
      return { success: false, error: '更新标签失败' };
    }
  };

  const deleteTag = async (id: string) => {
    try {
      if (!id) {
        console.error('删除标签失败: 无效的标签ID');
        return { success: false, error: '无效的标签ID' };
      }
      
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除标签失败');
      }
      
      // 成功删除后更新本地状态
      setTags((prev: Tag[]) => prev.filter((tag: Tag) => tag.id !== id));
      return { success: true };
    } catch (error) {
      console.error('删除标签失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '删除标签失败' };
    }
  };

  // 根据分组获取标签
  const getTagsByGroup = (groupId?: string) => {
    if (!groupId) {
      return tags.filter((tag: Tag) => tag && (!tag.categoryId || tag.categoryId === ''));
    }
    return tags.filter((tag: Tag) => tag && tag.categoryId === groupId);
  };



  // 切换标签选择状态
  const toggleTagSelection = (tagId: string) => {
    setSelectedTags((prev: string[]) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  // 清空标签选择
  const clearTagSelection = () => {
    setSelectedTags([]);
  };

  // 选择所有标签
  const selectAllTags = () => {
    setSelectedTags(tags.map((tag: Tag) => tag.id));
  };

  // 根据分组选择标签
  const selectTagsByGroup = (groupId: string) => {
    const groupTags = getTagsByGroup(groupId);
    setSelectedTags(groupTags.map((tag: Tag) => tag.id));
  };

  // 获取选中的标签对象
  const getSelectedTagObjects = () => {
    return tags.filter((tag: Tag) => selectedTags.includes(tag.id));
  };

  // 批量删除选中的标签
  const deleteSelectedTags = async () => {
    try {
      if (selectedTags.length === 0) {
        return { success: false, error: '未选择任何标签' };
      }
      
      // 使用Promise.allSettled而不是Promise.all，这样即使部分删除失败，也能继续处理其他标签
      const results = await Promise.allSettled(selectedTags.map(tagId => deleteTag(tagId)));
      
      // 检查是否有失败的操作
      const failures = results.filter(result => 
        result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
      );
      
      if (failures.length > 0) {
        console.error(`批量删除标签部分失败: ${failures.length}/${selectedTags.length} 个标签删除失败`);
        // 即使有失败，也清除选择，因为部分标签可能已成功删除
        setSelectedTags([]);
        return { 
          success: false, 
          error: `${failures.length}/${selectedTags.length} 个标签删除失败` 
        };
      }
      
      // 全部成功
      setSelectedTags([]);
      return { success: true };
    } catch (error) {
      console.error('批量删除标签失败:', error);
      return { success: false, error: error instanceof Error ? error.message : '批量删除标签失败' };
    }
  };

  // 刷新数据
  const refreshAll = () => {
    // 实时订阅会自动更新标签数据，只需要刷新分组数据
    fetchTagCategories();
  };

  // 根据标签ID获取标签对象
  const getTagById = (id: string) => {
    return tags.find((tag: Tag) => tag.id === id);
  };

  // 根据分组ID获取分组对象
  const getTagGroupById = (id: string) => {
    return tagCategories.find((group: TagCategory) => group.id === id);
  };

  // 获取标签所属的分组
  const getTagGroup = (tag: Tag) => {
    if (!tag.categoryId) return undefined;
    return getTagGroupById(tag.categoryId);
  };

  // 创建标签分组
  const createTagGroup = async (data: { name: string; color?: string }) => {
    try {
      const requestData = {
        name: data.name,
        color: data.color || 'cyan', // 默认使用cyan颜色
        description: '' // 添加空描述
      };
      
      const response = await fetch('/api/tag-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error('创建标签分组失败');
      }
      
      const result = await response.json();
      await fetchTagCategories();
      return { success: true, tagCategory: { id: result.id, name: result.name } };
    } catch (error) {
      console.error('创建标签分组失败:', error);
      return { success: false, error: '创建标签分组失败' };
    }
  };

  // 更新标签分组
  const updateTagGroup = async (id: string, data: { name: string }) => {
    try {
      const response = await fetch(`/api/tag-categories/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('更新标签分组失败');
      }
      
      await fetchTagCategories();
      return { success: true };
    } catch (error) {
      console.error('更新标签分组失败', error);
      return { success: false, error: '更新标签分组失败' };
    }
  };

  // 删除标签分组
  const deleteTagGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/tag-categories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // 尝试解析错误信息
        const errorData = await response.json();
        const errorMessage = errorData.error || '删除标签分组失败';
        throw new Error(errorMessage);
      }
      
      await fetchTagCategories();
      return { success: true };
    } catch (error) {
      console.error('删除标签分组失败:', error);
      // 返回更具体的错误信息
      const errorMessage = error instanceof Error ? error.message : '删除标签分组失败';
      return { success: false, error: errorMessage };
    }
  };

  return {
    // 数据
    tagCategories,
    tags,
    selectedTags,

    // 加载状态
    loading: categoriesLoading || tagsLoading,
    categoriesLoading,
    tagsLoading,

    // 错误状态
    error: categoriesError || tagsError,
    categoriesError,
    tagsError,

    // 标签操作
    createTag,
    updateTag,
    deleteTag,

    // 标签分类操作
    createTagCategory: createTagGroup,
    updateTagCategory: updateTagGroup,
    deleteTagCategory: deleteTagGroup,

    // 选择操作
    toggleTagSelection,
    clearTagSelection,
    selectAllTags,
    selectTagsByGroup,
    deleteSelectedTags,

    // 数据获取
    getTagsByCategory: getTagsByGroup,
    getSelectedTagObjects,
    getTagById,
    getTagCategoryById: getTagGroupById,
    getTagCategory: getTagGroup,

    // 刷新
    refreshAll,
  };
}
