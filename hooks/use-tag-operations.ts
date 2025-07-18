import { useState } from 'react';
import { Tag } from '@/types';
import { useTags } from './use-tags';

export function useTagOperations() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 标签分组功能已简化，不再需要独立管理
  const tagGroups: any[] = [];
  const groupsLoading = false;
  const groupsError = null;

  const {
    tags,
    isLoading: tagsLoading,
    error: tagsError,
    createTag: _createTag,
    updateTag: _updateTag,
    deleteTag: _deleteTag,
    refetch: refreshTags,
  } = useTags();

  // 标签操作现在通过图片数据自动管理
  const createTag = async (data: any) => {
    console.warn('标签现在从图片数据中自动提取和管理，不支持独立创建');
    return { success: false, error: '标签现在从图片数据中自动提取和管理' };
  };

  const updateTag = async (id: string, data: any) => {
    console.warn('标签现在从图片数据中自动提取和管理，不支持独立更新');
    return { success: false, error: '标签现在从图片数据中自动提取和管理' };
  };

  const deleteTag = async (id: string) => {
    console.warn('标签现在从图片数据中自动提取和管理，不支持独立删除');
    return { success: false, error: '标签现在从图片数据中自动提取和管理' };
  };

  // 标签分组功能已简化
  const getTagsByGroup = () => {
    return {};
  };

  // 过滤标签（根据搜索查询）
  const getFilteredTags = () => {
    if (!searchQuery) return tags;

    return tags.filter((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // 标签分组功能已简化
  const getFilteredTagGroups = () => {
    return [];
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

  // 标签分组功能已简化
  const selectTagsByGroup = (groupId: string) => {
    console.warn('标签分组功能已简化');
  };

  // 获取选中的标签对象
  const getSelectedTagObjects = () => {
    return tags.filter((tag) => selectedTags.includes(tag.id));
  };

  // 批量删除选中的标签
  const deleteSelectedTags = async () => {
    console.warn('标签现在从图片数据中自动提取和管理，不支持独立删除');
    setSelectedTags([]);
  };

  // 刷新数据
  const refreshAll = () => {
    // 标签数据通过实时监听自动更新
  };

  // 根据标签ID获取标签对象
  const getTagById = (id: string) => {
    return tags.find((tag) => tag.id === id);
  };

  // 标签分组功能已简化
  const getTagGroupById = (id: string) => {
    return undefined;
  };

  // 标签分组功能已简化
  const getTagGroup = (tag: Tag) => {
    return undefined;
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

    // 标签分组功能已简化

    // 标签操作
    createTag,
    updateTag,
    deleteTag,

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
