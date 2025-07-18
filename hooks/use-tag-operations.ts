import { useState, useEffect } from 'react';
import { Tag, TagGroup } from '@/types';
import { useTags } from './use-tags';
import { database } from '@/lib/database';

export function useTagOperations() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 标签分组状态管理
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  // 获取所有标签分组
  const fetchTagGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await fetch('/api/tag-groups');
      if (!response.ok) {
        throw new Error('获取标签分组失败');
      }
      const data = await response.json();
      setTagGroups(data.tagGroups || []);
      setGroupsError(null);
    } catch (err) {
      console.error('获取标签分组失败:', err);
      setGroupsError('获取标签分组失败');
    } finally {
      setGroupsLoading(false);
    }
  };

  // 初始化时获取标签分组
  useEffect(() => {
    fetchTagGroups();
  }, []);

  const {
    tags,
    isLoading: tagsLoading,
    error: tagsError,
    createTag: _createTag,
    updateTag: _updateTag,
    deleteTag: _deleteTag,
    refetch: refreshTags,
  } = useTags();

  // 标签操作方法
  const createTag = async (data: any) => {
    try {
      await _createTag(data);
      return { success: true };
    } catch (error) {
      console.error('创建标签失败:', error);
      return { success: false, error: '创建标签失败' };
    }
  };

  const updateTag = async (id: string, data: any) => {
    try {
      await _updateTag(id, data);
      return { success: true };
    } catch (error) {
      console.error('更新标签失败:', error);
      return { success: false, error: '更新标签失败' };
    }
  };

  const deleteTag = async (id: string) => {
    try {
      await _deleteTag(id);
      return { success: true };
    } catch (error) {
      console.error('删除标签失败:', error);
      return { success: false, error: '删除标签失败' };
    }
  };

  // 根据分组获取标签
  const getTagsByGroup = (groupId?: string) => {
    if (!groupId) {
      return tags.filter(tag => !tag.groupId || tag.groupId === '');
    }
    return tags.filter(tag => tag.groupId === groupId);
  };

  // 过滤标签（根据搜索查询）
  const getFilteredTags = () => {
    if (!searchQuery) return tags;

    return tags.filter((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // 过滤标签分组（根据搜索查询）
  const getFilteredTagGroups = () => {
    if (!searchQuery) return tagGroups;
    return tagGroups.filter(group => 
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
      await Promise.all(selectedTags.map(tagId => _deleteTag(tagId)));
      setSelectedTags([]);
      return { success: true };
    } catch (error) {
      console.error('批量删除标签失败:', error);
      return { success: false, error: '批量删除标签失败' };
    }
  };

  // 刷新数据
  const refreshAll = () => {
    refreshTags();
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
    if (!tag.groupId) return undefined;
    return getTagGroupById(tag.groupId);
  };

  // 创建标签分组
  const createTagGroup = async (data: { name: string; color: string }) => {
    try {
      const response = await fetch('/api/tag-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('创建标签分组失败');
      }
      
      await fetchTagGroups();
      return { success: true };
    } catch (error) {
      console.error('创建标签分组失败:', error);
      return { success: false, error: '创建标签分组失败' };
    }
  };

  // 更新标签分组
  const updateTagGroup = async (id: string, data: { name: string; color: string }) => {
    try {
      const response = await fetch(`/api/tag-groups/${id}`, {
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
      console.error('更新标签分组失败:', error);
      return { success: false, error: '更新标签分组失败' };
    }
  };

  // 删除标签分组
  const deleteTagGroup = async (id: string) => {
    try {
      const response = await fetch(`/api/tag-groups/${id}`, {
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
    searchQuery,

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

    // 搜索
    setSearchQuery,

    // 数据获取
    getTagsByGroup,
    getFilteredTags,
    getFilteredTagGroups,
    getSelectedTagObjects,
    getTagById,
    getTagGroupById,
    getTagGroup,

    // 刷新
    refreshAll,
  };
}
