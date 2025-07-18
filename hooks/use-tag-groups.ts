import { useState, useEffect } from 'react';
import { Database } from '@/lib/database';
import { TagGroup } from '@/types';

export function useTagGroups() {
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用实时订阅获取标签分组
  useEffect(() => {
    const database = Database.getInstance();
    
    const unsubscribe = database.subscribeToTagGroups(
      (tagGroups) => {
        setTagGroups(tagGroups);
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error('获取标签分组失败:', error);
        setError('获取标签分组失败');
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 标签分组的创建、更新、删除现在通过图片中的标签管理
  // 这些操作会自动触发实时更新
  const createTagGroup = async (
    tagGroupData: Omit<TagGroup, 'id' | 'createdAt' | 'updatedAt' | 'tagCount'>
  ) => {
    throw new Error('请通过图片标签管理分组');
  };

  const updateTagGroup = async (
    id: string,
    updates: Partial<Omit<TagGroup, 'id' | 'createdAt' | 'updatedAt' | 'tagCount'>>
  ) => {
    throw new Error('请通过图片标签管理分组');
  };

  const deleteTagGroup = async (id: string) => {
    throw new Error('请通过图片标签管理分组');
  };

  // 重新排序分组（暂时保留，可能在未来实现）
  const reorderTagGroups = async (groupIds: string[]) => {
    // 暂时不实现，分组排序由默认分组优先，其他按名称排序
    console.warn('分组排序功能暂未实现');
    return Promise.resolve();
  };

  return {
    tagGroups,
    isLoading,
    error,
    createTagGroup,
    updateTagGroup,
    deleteTagGroup,
    reorderTagGroups,
    refetch: () => Promise.resolve(), // 实时订阅无需手动刷新
  };
}