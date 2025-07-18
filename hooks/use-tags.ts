import { useState, useEffect } from "react";
import { dataService } from "@/lib/data-service";
import { Tag } from "@/types";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取所有标签
  const fetchTags = async (groupId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const tags = await dataService.getTags(groupId);
      setTags(tags);
    } catch (err) {
      console.error("获取标签失败:", err);
      setError("获取标签失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 创建标签
  const createTag = async (
    tagData: Omit<Tag, "id" | "createdAt" | "updatedAt" | "sortOrder">,
  ) => {
    try {
      setError(null);
      
      const newTag = await dataService.addTag(tagData);
      setTags((prev) => [...prev, newTag]);
      return newTag;
    } catch (err) {
      console.error("创建标签失败:", err);
      const errorMsg = err instanceof Error ? err.message : "创建标签失败";
      setError(errorMsg);
      throw err;
    }
  };

  // 更新标签
  const updateTag = async (
    id: string,
    updates: Partial<Omit<Tag, "id" | "createdAt" | "updatedAt">>,
  ) => {
    try {
      setError(null);
      
      await dataService.updateTag(id, updates);
      setTags((prev) =>
        prev.map((tag) => (tag.id === id ? { ...tag, ...updates } : tag)),
      );
    } catch (err) {
      console.error("更新标签失败:", err);
      const errorMsg = err instanceof Error ? err.message : "更新标签失败";
      setError(errorMsg);
      throw err;
    }
  };

  // 删除标签
  const deleteTag = async (id: string) => {
    try {
      setError(null);
      
      await dataService.deleteTag(id);
      setTags((prev) => prev.filter((tag) => tag.id !== id));
    } catch (err) {
      console.error("删除标签失败:", err);
      const errorMsg = err instanceof Error ? err.message : "删除标签失败";
      setError(errorMsg);
      throw err;
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // 重新排序标签
  const reorderTags = async (tagIds: string[]) => {
    try {
      setError(null);
      
      await dataService.reorderTags(tagIds);
      // 重新获取标签以更新排序
      await fetchTags();
    } catch (err) {
      console.error("重新排序标签失败:", err);
      const errorMsg = err instanceof Error ? err.message : "重新排序标签失败";
      setError(errorMsg);
      throw err;
    }
  };

  return {
    tags,
    isLoading,
    error,
    createTag,
    updateTag,
    deleteTag,
    reorderTags,
    refetch: fetchTags,
  };
}
