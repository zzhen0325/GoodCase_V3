import { useState, useEffect } from "react";
import { dataService } from "@/lib/data-service";
import { TagGroup } from "@/types";

export function useTagGroups() {
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取所有标签分组
  const fetchTagGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tagGroups = await dataService.getAllTagGroups();
      setTagGroups(tagGroups);
    } catch (err) {
      console.error("获取标签分组失败:", err);
      setError("获取标签分组失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 创建标签分组
  const createTagGroup = async (
    tagGroupData: Omit<TagGroup, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      setError(null);

      const result = await dataService.createTagGroup(tagGroupData);

      if (result.success && result.data) {
        setTagGroups((prev) => [...prev, result.data!]);
        return result.data;
      } else {
        const errorMsg = result.error || "创建标签分组失败";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("创建标签分组失败:", err);
      const errorMsg = err instanceof Error ? err.message : "创建标签分组失败";
      setError(errorMsg);
      throw err;
    }
  };

  // 更新标签分组
  const updateTagGroup = async (
    id: string,
    updates: Partial<Omit<TagGroup, "id" | "createdAt" | "updatedAt">>,
  ) => {
    try {
      setError(null);

      const result = await dataService.updateTagGroup(id, updates);

      if (result.success && result.data) {
        setTagGroups((prev) =>
          prev.map((tagGroup) => (tagGroup.id === id ? result.data! : tagGroup)),
        );
      } else {
        const errorMsg = result.error || "更新标签分组失败";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("更新标签分组失败:", err);
      const errorMsg = err instanceof Error ? err.message : "更新标签分组失败";
      setError(errorMsg);
      throw err;
    }
  };

  // 删除标签分组
  const deleteTagGroup = async (id: string) => {
    try {
      setError(null);

      const result = await dataService.deleteTagGroup(id);

      if (result.success) {
        setTagGroups((prev) => prev.filter((tagGroup) => tagGroup.id !== id));
      } else {
        const errorMsg = result.error || "删除标签分组失败";
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error("删除标签分组失败:", err);
      const errorMsg = err instanceof Error ? err.message : "删除标签分组失败";
      setError(errorMsg);
      throw err;
    }
  };

  useEffect(() => {
    fetchTagGroups();
  }, []);

  return {
    tagGroups,
    isLoading,
    error,
    createTagGroup,
    updateTagGroup,
    deleteTagGroup,
    refetch: fetchTagGroups,
  };
}
