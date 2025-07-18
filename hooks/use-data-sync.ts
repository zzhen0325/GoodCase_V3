import { useCallback } from "react";
import { ImageData } from "@/types";
import { dataService } from "@/lib/data-service";

interface UseDataSyncProps {
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
  setConnectionStatus: React.Dispatch<
    React.SetStateAction<"connected" | "disconnected" | "reconnecting">
  >;
}

/**
 * 数据同步 Hook
 * 负责处理后台数据同步和手动刷新
 */
export function useDataSync({
  setImages,
  setConnectionStatus,
}: UseDataSyncProps) {

  // 手动刷新数据
  const refreshData = useCallback(async () => {
    console.log("🔄 手动刷新数据...");
    setConnectionStatus("reconnecting");
    try {
      const images = await dataService.getImages();
      setImages(images);
      console.log("📸 手动刷新图片成功");
      setConnectionStatus("connected");
    } catch (error) {
      console.error("手动刷新数据失败:", error);
      setConnectionStatus("disconnected");
    }
  }, [setImages, setConnectionStatus]);

  return {
    refreshData,
  };
}
