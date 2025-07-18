import { useCallback } from "react";
import { ImageData } from "@/types";
import { dataService } from "@/lib/data-service";

interface UseBatchOperationsProps {
  selectedImageIds: Set<string>;
  filteredImages: ImageData[];
  setSelectedImageIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

/**
 * 批量操作 Hook
 * 负责处理批量删除、导出等操作
 */
export function useBatchOperations({
  selectedImageIds,
  filteredImages,
  setSelectedImageIds,
}: UseBatchOperationsProps) {
  // 获取文件扩展名的辅助函数
  const getFileExtensionFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const lastDot = pathname.lastIndexOf('.');
      if (lastDot === -1) return 'png';
      return pathname.substring(lastDot + 1).toLowerCase() || 'png';
    } catch {
      return 'png';
    }
  };

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    if (selectedImageIds.size === 0) return;

    const confirmed = confirm(
      `确定要删除选中的 ${selectedImageIds.size} 张图片吗？`,
    );
    if (!confirmed) return;

    try {
      const deletePromises = Array.from(selectedImageIds).map((id) =>
        dataService.deleteImage(id),
      );
      await Promise.all(deletePromises);
      setSelectedImageIds(new Set());
      console.log("✅ 批量删除成功");
    } catch (error) {
      console.error("❌ 批量删除失败:", error);
      alert("批量删除失败: " + (error as Error).message);
    }
  }, [selectedImageIds, setSelectedImageIds]);

  // 批量导出
  const handleBatchExport = useCallback(async () => {
    if (selectedImageIds.size === 0) return;

    try {
      const selectedImages = filteredImages.filter((img) =>
        selectedImageIds.has(img.id),
      );

      // 导出图片
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        if (!image.url) continue;

        try {
          const imgElements = document.querySelectorAll("img");
          let cachedImg: HTMLImageElement | null = null;

          for (let j = 0; j < imgElements.length; j++) {
            const imgEl = imgElements[j];
            if (imgEl.src === image.url) {
              cachedImg = imgEl;
              break;
            }
          }

          let blob: Blob;

          if (cachedImg && cachedImg.complete) {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = cachedImg.naturalWidth;
            canvas.height = cachedImg.naturalHeight;
            ctx?.drawImage(cachedImg, 0, 0);
            blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((blob) => {
                resolve(blob!);
              }, "image/png");
            });
          } else {
            const response = await fetch(image.url);
            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);
            blob = await response.blob();
          }

          const extension = getFileExtensionFromUrl(image.url);
          const filename = `${image.title || `image-${image.id}`}.${extension}`;

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          if (i < selectedImages.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`❌ 下载图片 ${image.title || image.id} 失败:`, error);
        }
      }

      // 导出JSON数据
      const exportData = {
        images: selectedImages,
        tags: [],
        exportTime: new Date().toISOString(),
        totalCount: selectedImages.length,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `selected-images-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`已开始下载 ${selectedImages.length} 张图片并导出JSON数据`);
    } catch (error) {
      console.error("❌ 批量导出失败:", error);
      alert("批量导出失败: " + (error as Error).message);
    }
  }, [selectedImageIds, filteredImages, getFileExtensionFromUrl]);

  return {
    handleBatchDelete,
    handleBatchExport,
  };
}
