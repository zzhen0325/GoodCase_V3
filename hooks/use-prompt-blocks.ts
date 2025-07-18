import { useState, useEffect } from "react";
import { dataService } from "@/lib/data-service";
import { PromptBlock } from "@/types";
import { copyToClipboard } from "@/lib/utils";

export function usePromptBlocks(imageId?: string) {
  const [promptBlocks, setPromptBlocks] = useState<PromptBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取提示词块
  const fetchPromptBlocks = async (targetImageId?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const blocks = await dataService.getPromptBlocks(targetImageId || imageId);
      setPromptBlocks(blocks);
    } catch (err) {
      console.error("获取提示词块失败:", err);
      setError("获取提示词块失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 创建提示词块
  const createPromptBlock = async (
    promptBlockData: Omit<PromptBlock, "id" | "createdAt" | "updatedAt" | "sortOrder">,
  ) => {
    try {
      setError(null);
      
      const newPromptBlock = await dataService.addPromptBlock(promptBlockData);
      setPromptBlocks((prev) => [...prev, newPromptBlock]);
      return newPromptBlock;
    } catch (err) {
      console.error("创建提示词块失败:", err);
      const errorMsg = err instanceof Error ? err.message : "创建提示词块失败";
      setError(errorMsg);
      throw err;
    }
  };

  // 更新提示词块
  const updatePromptBlock = async (
    id: string,
    updates: Partial<Omit<PromptBlock, "id" | "createdAt" | "updatedAt">>,
  ) => {
    try {
      setError(null);
      
      await dataService.updatePromptBlock(id, updates);
      setPromptBlocks((prev) =>
        prev.map((block) => (block.id === id ? { ...block, ...updates } : block)),
      );
    } catch (err) {
      console.error("更新提示词块失败:", err);
      const errorMsg = err instanceof Error ? err.message : "更新提示词块失败";
      setError(errorMsg);
      throw err;
    }
  };

  // 删除提示词块
  const deletePromptBlock = async (id: string) => {
    try {
      setError(null);
      
      await dataService.deletePromptBlock(id);
      setPromptBlocks((prev) => prev.filter((block) => block.id !== id));
    } catch (err) {
      console.error("删除提示词块失败:", err);
      const errorMsg = err instanceof Error ? err.message : "删除提示词块失败";
      setError(errorMsg);
      throw err;
    }
  };

  // 重新排序提示词块
  const reorderPromptBlocks = async (promptBlockIds: string[]) => {
    try {
      setError(null);
      
      await dataService.reorderPromptBlocks(promptBlockIds);
      // 重新获取提示词块以更新排序
      await fetchPromptBlocks();
    } catch (err) {
      console.error("重新排序提示词块失败:", err);
      const errorMsg = err instanceof Error ? err.message : "重新排序提示词块失败";
      setError(errorMsg);
      throw err;
    }
  };

  // 复制单个提示词块
  const copyPromptBlock = async (block: PromptBlock) => {
    try {
      await copyToClipboard(block.text);
      console.log("✅ 提示词块复制成功:", block.title);
    } catch (error) {
      console.error("❌ 复制提示词块失败:", error);
      throw error;
    }
  };

  // 复制所有提示词块文本
  const copyAllPromptBlocks = async () => {
    try {
      const allText = promptBlocks.map(block => block.text).join('\n\n');
      await copyToClipboard(allText);
      console.log("✅ 所有提示词块复制成功");
    } catch (error) {
      console.error("❌ 复制所有提示词块失败:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (imageId) {
      fetchPromptBlocks();
    }
  }, [imageId]);

  return {
    promptBlocks,
    isLoading,
    error,
    createPromptBlock,
    updatePromptBlock,
    deletePromptBlock,
    reorderPromptBlocks,
    copyPromptBlock,
    copyAllPromptBlocks,
    refetch: fetchPromptBlocks,
  };
}