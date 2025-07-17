import { useState, useEffect } from "react";
import { dataService } from "@/lib/data-service";
import { Tag } from "@/types";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取所有标签
  const fetchTags = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tags = await dataService.getAllTags();
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
    tagData: Omit<Tag, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      setError(null);

      const result = await dataService.createTag(tagData);

      if (result.success) {
        setTags((prev) => [...prev, result.data]);
        return result.data;
      } else {
        const errorMsg = result.error || "创建标签失败";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
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

      const result = await dataService.updateTag(id, updates);

      if (result.success) {
        setTags((prev) =>
          prev.map((tag) => (tag.id === id ? result.data : tag)),
        );
      } else {
        const errorMsg = result.error || "更新标签失败";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
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

      const result = await dataService.deleteTag(id);

      if (result.success) {
        setTags((prev) => prev.filter((tag) => tag.id !== id));
      } else {
        const errorMsg = result.error || "删除标签失败";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
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

  return {
    tags,
    isLoading,
    error,
    createTag,
    updateTag,
    deleteTag,
    refetch: fetchTags,
  };
}
