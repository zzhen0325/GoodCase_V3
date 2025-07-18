import { useState, useEffect } from 'react';
import { Database } from '@/lib/database';
import { Tag } from '@/types';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 使用实时订阅获取标签
  useEffect(() => {
    const database = Database.getInstance();
    
    const unsubscribe = database.subscribeToTags(
      (tags) => {
        setTags(tags);
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error('获取标签失败:', error);
        setError('获取标签失败');
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 标签的创建、更新、删除现在通过图片API处理
  // 这些操作会自动触发实时更新
  const createTag = async (
    tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    throw new Error('请通过图片API管理标签');
  };

  const updateTag = async (
    id: string,
    updates: Partial<Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    throw new Error('请通过图片API管理标签');
  };

  const deleteTag = async (id: string) => {
    throw new Error('请通过图片API管理标签');
  };

  // 重新排序标签（暂时保留，可能在未来实现）
  const reorderTags = async (tagIds: string[]) => {
    // 暂时不实现，标签排序由使用次数决定
    console.warn('标签排序功能暂未实现');
    return Promise.resolve();
  };

  return {
    tags,
    isLoading,
    error,
    createTag,
    updateTag,
    deleteTag,
    reorderTags,
    refetch: () => Promise.resolve(), // 实时订阅无需手动刷新
  };
}
