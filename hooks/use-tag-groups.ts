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
      
      const tagGroups = await dataService.getTagGroups();
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
    tagGroupData: Omit<TagGroup, "id" | "createdAt" | "updatedAt" | "sortOrder">,
  ) => {
    try {
      setError(null);
      
      const newTagGroup = await dataService.addTagGroup(tagGroupData);
      setTagGroups((prev) => [...prev, newTagGroup]);
      return newTagGroup;
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
      
      await dataService.updateTagGroup(id, updates);
      setTagGroups((prev) =>
        prev.map((tagGroup) => (tagGroup.id === id ? { ...tagGroup, ...updates } : tagGroup)),
      );
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
      
      await dataService.deleteTagGroup(id);
      setTagGroups((prev) => prev.filter((tagGroup) => tagGroup.id !== id));
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

  // 重新排序标签分组
  const reorderTagGroups = async (tagGroupIds: string[]) => {
    try {
      setError(null);
      
      await dataService.reorderTagGroups(tagGroupIds);
      // 重新获取标签分组以更新排序
      await fetchTagGroups();
    } catch (err) {
      console.error("重新排序标签分组失败:", err);
      const errorMsg = err instanceof Error ? err.message : "重新排序标签分组失败";
      setError(errorMsg);
      throw err;
    }
  };

  return {
    tagGroups,
    isLoading,
    error,
    createTagGroup,
    updateTagGroup,
    deleteTagGroup,
    reorderTagGroups,
    refetch: fetchTagGroups,
  };
}
