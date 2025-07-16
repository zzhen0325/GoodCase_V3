import { useCallback } from 'react';
import { Tag, SearchFilters } from '@/types';
import { ApiClient } from '@/lib/api';

interface UseTagOperationsProps {
  searchFilters: SearchFilters;
  handleSearchChange: (filters: SearchFilters) => void;
}

/**
 * 标签操作 Hook
 * 负责处理标签的增删改查操作
 */
export function useTagOperations({ searchFilters, handleSearchChange }: UseTagOperationsProps) {

  // 处理标签点击
  const handleTagClick = (tag: Tag) => {
    handleSearchChange({
      ...searchFilters,
      tags: searchFilters.tags.includes(tag.id)
        ? searchFilters.tags.filter(t => t !== tag.id)
        : [...searchFilters.tags, tag.id]
    });
  };

  // 处理标签创建
  const handleTagCreate = useCallback(async (tagData: Omit<Tag, 'id'>) => {
    console.log('🏷️ 创建标签:', tagData.name);
    const result = await ApiClient.addTag(tagData);
    
    if (result.success && result.data) {
      console.log('✅ 标签创建成功，实时监听器将自动更新UI');
      // 实时监听器会自动更新tags状态，无需手动更新
      return result.data;
    } else {
      console.error('❌ 标签创建失败:', result.error);
      throw new Error(result.error || '创建失败');
    }
  }, []);

  // 处理创建标签的包装函数
  const handleCreateTag = useCallback(async (tagData: Omit<Tag, 'id'>) => {
    return await handleTagCreate(tagData);
  }, [handleTagCreate]);

  // 处理标签删除
  const handleTagDelete = useCallback(async (tagId: string) => {
    const confirmed = confirm('确定要删除这个标签吗？删除后将从所有图片中移除。');
    if (!confirmed) return;

    try {
      const result = await ApiClient.deleteTag(tagId);
      if (result.success) {
        console.log('✅ 标签删除成功，实时监听器将自动更新UI');
        // 实时监听器会自动更新tags状态，无需手动更新
      } else {
        console.error('❌ 标签删除失败:', result.error);
        alert('删除标签失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('❌ 删除标签时出错:', error);
      alert('删除标签失败: ' + (error as Error).message);
    }
  }, []);

  // 处理标签更新
  const handleTagUpdate = useCallback(async (tagId: string, updates: Partial<Tag>) => {
    try {
      const result = await ApiClient.updateTag(tagId, updates);
      if (result.success) {
        console.log('✅ 标签更新成功，实时监听器将自动更新UI');
        // 实时监听器会自动更新tags状态，无需手动更新
        return result.data;
      } else {
        console.error('❌ 标签更新失败:', result.error);
        throw new Error(result.error || '更新失败');
      }
    } catch (error) {
      console.error('❌ 更新标签时出错:', error);
      throw error;
    }
  }, []);

  // 处理分组名称修改
  const handleGroupNameChange = useCallback((colorName: string, newName: string) => {
    // 这里可以添加持久化逻辑，目前只是本地状态管理
    console.log('🏷️ 修改分组名称:', colorName, '->', newName);
  }, []);

  return {
    handleTagClick,
    handleTagCreate,
    handleCreateTag,
    handleTagDelete,
    handleTagUpdate,
    handleGroupNameChange,
  };
}