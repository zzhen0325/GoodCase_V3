import { useState, useEffect } from 'react';
import { useDataContext } from '@/components/shared/DataContext';
import { Tag, TagGroup } from '@/types';
import { Database } from '@/lib/database';

// 正确的标签和分类数据
export function useTagOperations() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { tags, setTags, categories: tagGroups, setCategories } = useDataContext();
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  // 获取标签分组数据
  const fetchTagGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('拉取分组失败');
      const { tagGroups } = await response.json();
      setCategories(tagGroups || []);
      setGroupsError(null);
    } catch (e) {
      console.error('拉取分组失败:', e);
      setGroupsError('拉取分组失败');
    } finally {
      setGroupsLoading(false);
    }
  };

  // 使用实时订阅获取标签
  useEffect(() => {
    const database = Database.getInstance();
    
    const unsubscribe = database.subscribeToTags(
      (tags) => {
        setTags(tags);
        setTagsLoading(false);
        setTagsError(null);
      },
      (error) => {
        console.error('获取标签失败:', error);
        setTagsError('获取标签失败');
        setTagsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 初始化获取标签分组数据
  useEffect(() => {
    fetchTagGroups();
  }, []);

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
      
      const { tag } = await response.json();
      setTags(prev => [...prev, tag]);
      return { success: true, tag };
    } catch (error) {
      console.error('创建标签失败:', error);
      return { success: false, error: '创建标签失败' };
    }
  };

  const updateTag = async (id: string, data: Partial<Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新标签失败');
      }
      setTags(prev => prev.map(tag => tag.id === id ? { ...tag, ...data } : tag));
      return { success: true };
    } catch (error) {
      console.error('更新标签失败:', error);
      return { success: false, error: '更新标签失败' };
    }
  };

  const deleteTag = async (id: string) => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除标签失败');
      }
      setTags(prev => prev.filter(tag => tag.id !== id));
      return { success: true };
    } catch (error) {
      console.error('删除标签失败:', error);
      return { success: false, error: '删除标签失败' };
    }
  };

  // 根据分组获取标签
  const getTagsByGroup = (groupId?: string) => {
    if (!groupId) {
      return tags.filter(tag => !tag.categoryId || tag.categoryId === '');
    }
    return tags.filter(tag => tag.categoryId === groupId);
  };



  // 切换标签选择状态
  const toggleTagSelection = (tagId: string) => {
    setSelectedTags((prev) =>
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
    setSelectedTags(tags.map((tag) => tag.id));
  };

  // 根据分组选择标签
  const selectTagsByGroup = (groupId: string) => {
    const groupTags = getTagsByGroup(groupId);
    setSelectedTags(groupTags.map(tag => tag.id));
  };

  // 获取选中的标签对象
  const getSelectedTagObjects = () => {
    return tags.filter((tag) => selectedTags.includes(tag.id));
  };

  // 批量删除选中的标签
  const deleteSelectedTags = async () => {
    try {
      await Promise.all(selectedTags.map(tagId => deleteTag(tagId)));
      setSelectedTags([]);
      return { success: true };
    } catch (error) {
      console.error('批量删除标签失败:', error);
      return { success: false, error: '批量删除标签失败' };
    }
  };

  // 刷新数据
  const refreshAll = () => {
    // 实时订阅会自动更新标签数据，只需要刷新分组数据
    fetchTagGroups();
  };

  // 根据标签ID获取标签对象
  const getTagById = (id: string) => {
    return tags.find((tag) => tag.id === id);
  };

  // 根据分组ID获取分组对象
  const getTagGroupById = (id: string) => {
    return tagGroups.find((group) => group.id === id);
  };

  // 获取标签所属的分组
  const getTagGroup = (tag: Tag) => {
    if (!tag.categoryId) return undefined;
    return getTagGroupById(tag.categoryId);
  };

  // 创建标签分组
  const createTagGroup = async (data: { name: string }) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('创建标签分组失败');
      }
      
      const result = await response.json();
      await fetchTagGroups();
      return { success: true, tagGroup: { id: result.id, name: result.name } };
    } catch (error) {
      console.error('创建标签分组失败:', error);
      return { success: false, error: '创建标签分组失败' };
    }
  };

  // 更新标签分组
  const updateTagGroup = async (id: string, data: { name: string }) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('更新标签分组失败');
      }
      
      await fetchTagGroups();
      return { success: true };
    } catch (error) {
      console.error('更新标签分组失败', error);
      return { success: false, error: '更新标签分组失败' };
    }
  };

  // 删除标签分组
  const deleteTagGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除标签分组失败');
      }
      
      await fetchTagGroups();
      return { success: true };
    } catch (error) {
      console.error('删除标签分组失败:', error);
      return { success: false, error: '删除标签分组失败' };
    }
  };

  return {
    // 数据
    tagGroups,
    tags,
    selectedTags,

    // 加载状态
    loading: groupsLoading || tagsLoading,
    groupsLoading,
    tagsLoading,

    // 错误状态
    error: groupsError || tagsError,
    groupsError,
    tagsError,

    // 标签操作
    createTag,
    updateTag,
    deleteTag,

    // 标签分组操作
    createTagGroup,
    updateTagGroup,
    deleteTagGroup,

    // 选择操作
    toggleTagSelection,
    clearTagSelection,
    selectAllTags,
    selectTagsByGroup,
    deleteSelectedTags,

    // 数据获取
    getTagsByGroup,
    getSelectedTagObjects,
    getTagById,
    getTagGroupById,
    getTagGroup,

    // 刷新
    refreshAll,
  };
}
