import { useState, useEffect } from 'react';
import { database } from '@/lib/database';
import { Tag } from '@/types';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 实时监听标签变化
  useEffect(() => {
    const unsubscribe = database.subscribeToTags(
      (newTags) => {
        setTags(newTags);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('获取标签失败:', err);
        setError('获取标签失败');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // 创建标签（标签现在从图片数据中自动提取，不需要单独创建）
  const createTag = async (
    tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'order'>
  ) => {
    // 标签现在是从图片数据中提取的，不需要单独创建
    // 这个方法保留是为了兼容性，但实际上标签会在更新图片时自动创建
    console.warn('标签现在从图片数据中自动提取，不需要单独创建');
    return Promise.resolve({} as Tag);
  };

  // 更新标签（标签现在从图片数据中自动提取，需要通过更新图片来更新标签）
  const updateTag = async (
    id: string,
    updates: Partial<Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
    // 标签现在是从图片数据中提取的，需要通过更新相关图片来更新标签
    console.warn('标签现在从图片数据中自动提取，需要通过更新图片来更新标签');
    return Promise.resolve();
  };

  // 删除标签（标签现在从图片数据中自动提取，需要通过更新图片来删除标签）
  const deleteTag = async (id: string) => {
    // 标签现在是从图片数据中提取的，需要通过更新相关图片来删除标签
    console.warn('标签现在从图片数据中自动提取，需要通过更新图片来删除标签');
    return Promise.resolve();
  };

  // 重新排序标签（标签现在从图片数据中自动提取，排序由使用次数决定）
  const reorderTags = async (tagIds: string[]) => {
    // 标签现在是从图片数据中提取的，排序由使用次数自动决定
    console.warn('标签现在从图片数据中自动提取，排序由使用次数决定');
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
    refetch: () => Promise.resolve(), // 不需要手动刷新，实时监听会自动更新
  };
}
