import { useState } from "react";
import { TagGroup, Tag } from "@/types";
import { useTagGroups } from "./use-tag-groups";
import { useTags } from "./use-tags";

export function useTagOperations() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    tagGroups,
    loading: groupsLoading,
    error: groupsError,
    createTagGroup,
    updateTagGroup,
    deleteTagGroup,
    refresh: refreshGroups,
  } = useTagGroups();

  const {
    tags,
    loading: tagsLoading,
    error: tagsError,
    createTag,
    updateTag,
    deleteTag,
    refresh: refreshTags,
  } = useTags();

  // 根据分组组织标签
  const getTagsByGroup = () => {
    const groupedTags: Record<string, { group: TagGroup; tags: Tag[] }> = {};

    tagGroups.forEach((group) => {
      groupedTags[group.id] = {
        group,
        tags: tags.filter((tag) => tag.groupId === group.id),
      };
    });

    return groupedTags;
  };

  // 过滤标签（根据搜索查询）
  const getFilteredTags = () => {
    if (!searchQuery) return tags;

    return tags.filter((tag) =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  // 过滤标签分组（根据搜索查询）
  const getFilteredTagGroups = () => {
    if (!searchQuery) return tagGroups;

    return tagGroups.filter(
      (group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tags.some(
          (tag) =>
            tag.groupId === group.id &&
            tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  };

  // 切换标签选择状态
  const toggleTagSelection = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
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
    const groupTags = tags.filter((tag) => tag.groupId === groupId);
    const groupTagIds = groupTags.map((tag) => tag.id);

    // 如果该分组的所有标签都已选中，则取消选择
    const allSelected = groupTagIds.every((id) => selectedTags.includes(id));

    if (allSelected) {
      setSelectedTags((prev) => prev.filter((id) => !groupTagIds.includes(id)));
    } else {
      setSelectedTags((prev) => {
        const newSelection = [...prev];
        groupTagIds.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  // 获取选中的标签对象
  const getSelectedTagObjects = () => {
    return tags.filter((tag) => selectedTags.includes(tag.id));
  };

  // 批量删除选中的标签
  const deleteSelectedTags = async () => {
    try {
      await Promise.all(selectedTags.map((tagId) => deleteTag(tagId)));
      setSelectedTags([]);
      refreshTags();
      refreshGroups(); // 刷新分组以更新标签计数
    } catch (error) {
      console.error("批量删除标签失败:", error);
      throw error;
    }
  };

  // 刷新所有数据
  const refreshAll = () => {
    refreshGroups();
    refreshTags();
  };

  // 根据标签ID获取标签对象
  const getTagById = (id: string) => {
    return tags.find((tag) => tag.id === id);
  };

  // 根据分组ID获取分组对象
  const getTagGroupById = (id: string) => {
    return tagGroups.find((group) => group.id === id);
  };

  // 获取标签的分组信息
  const getTagGroup = (tag: Tag) => {
    return tagGroups.find((group) => group.id === tag.groupId);
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

    // 标签分组操作
    createTagGroup,
    updateTagGroup,
    deleteTagGroup,

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
    refreshGroups,
    refreshTags,
  };
}
