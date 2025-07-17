import { useCallback } from "react";
import { SearchFilters } from "@/types";

interface UseNavigationProps {
  searchFilters: SearchFilters;
  handleSearchChange: (filters: SearchFilters) => void;
  setActiveView: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * 导航操作 Hook
 * 负责处理各种导航和视图切换操作
 */
export function useNavigation({
  searchFilters,
  handleSearchChange,
  setActiveView,
}: UseNavigationProps) {
  // 处理导出（暂时没用）
  const handleExport = useCallback(async () => {
    alert("暂时没用，为了对称");
  }, []);

  // 处理收藏
  const handleFavorites = useCallback(() => {
    setActiveView("favorites");
    // 筛选收藏的图片
    handleSearchChange({
      ...searchFilters,
      query: "",
    });
  }, [searchFilters, handleSearchChange, setActiveView]);

  // 处理设置
  const handleSettings = useCallback(() => {
    setActiveView("settings");
    // 这里可以打开设置弹窗
  }, [setActiveView]);

  // 处理飞书文档
  const handleLarkDoc = useCallback(() => {
    window.open(
      "https://bytedance.larkoffice.com/wiki/HNHvwAjVzicLVuk1r5ictnNKncg",
      "_blank",
    );
  }, []);

  return {
    handleExport,
    handleFavorites,
    handleSettings,
    handleLarkDoc,
  };
}
