import { useCallback } from "react";
import { ImageData, Prompt } from "@/types";
import { apiClient } from "@/lib/api";
import IndexedDBManager from "@/lib/indexed-db";
import { copyToClipboard } from "@/lib/utils";

interface UseImageOperationsProps {
  connectionStatus: "connected" | "disconnected" | "reconnecting";
  selectedImage: ImageData | null;
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
  setSelectedImage: React.Dispatch<React.SetStateAction<ImageData | null>>;
  setIsImageModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * 图片操作 Hook
 * 负责处理图片的增删改查操作
 */
export function useImageOperations({
  connectionStatus,
  selectedImage,
  setImages,
  setSelectedImage,
  setIsImageModalOpen,
}: UseImageOperationsProps) {
  // 处理图片更新
  const handleImageUpdate = useCallback(
    async (id: string, updates: Partial<ImageData>) => {
      console.log("🔄 更新图片:", id, updates);
      const result = await apiClient.updateImage(id, updates);

      if (result.success) {
        console.log("✅ 图片更新成功，实时监听器将自动更新UI");
        // 实时监听器会自动更新images状态，无需手动更新

        // 更新选中的图片（如果正在查看）
        if (selectedImage?.id === id && result.data) {
          setSelectedImage(result.data);
        }
      } else {
        console.error("❌ 图片更新失败:", result.error);
        throw new Error(result.error || "更新失败");
      }
    },
    [selectedImage, setSelectedImage],
  );

  // 处理图片上传
  const handleImageUpload = useCallback(
    async (file: File, imageName: string, prompts: Prompt[]) => {
      console.log("📤 开始上传图片:", {
        fileName: file.name,
        imageName,
        promptsCount: prompts.length,
      });

      // 生成临时ID
      const tempId = `temp_${Date.now()}`;

      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);

      // 立即在UI中显示加载状态的图片
      const loadingImageData: ImageData = {
        id: tempId,
        url: previewUrl,
        title: imageName,
        prompt: prompts.map(p => p.text).join('\n'),
        description: "",
        tags: [],
        size: {
          width: 0,
          height: 0,
          fileSize: 0,
        },
        metadata: {
          format: "image",
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 立即更新UI，在列表顶部显示加载状态的图片
      setImages((prevImages) => [loadingImageData, ...prevImages]);

      try {
        if (connectionStatus === "connected") {
          // 在线上传
          const imageData = {
            url: previewUrl,
            title: imageName,
            description: "",
            tags: [],
            prompt: prompts.map(p => p.text).join('\n'),
            size: {
              width: 0,
              height: 0,
              fileSize: file.size,
            },
            metadata: {
              format: file.type,
            },
          };
          const result = await apiClient.addImage(imageData);

          if (result.success && result.data) {
            console.log("✅ 图片上传成功，实时监听器将自动更新UI");

            // 移除临时图片，实时监听器会自动添加真实图片
            setImages((prevImages) =>
              prevImages.filter((img) => img.id !== tempId),
            );

            // 清理预览URL
            URL.revokeObjectURL(previewUrl);

            // 如果有提示词，批量更新
            if (prompts.length > 0) {
              const updateResult = await apiClient.updateImage(result.data.id, {
                prompt: prompts.map(p => p.text).join('\n'),
              });
              if (!updateResult.success) {
                console.warn("⚠️ 提示词块更新失败:", updateResult.error);
              }
            }

            console.log("✅ 图片上传成功:", result.data);
          } else {
            throw new Error(result.error || "上传失败");
          }
        } else {
          // 如果离线，存储到IndexedDB
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async () => {
            const base64 = reader.result as string;

            const localImageData: ImageData = {
              id: tempId,
              url: base64,
              title: imageName,
              description: "",
              tags: [],
              prompt: prompts.map(p => p.text).join('\n'),
              size: {
                width: 0,
                height: 0,
                fileSize: file.size,
              },
              metadata: {
                format: file.type,
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // 更新临时图片为本地图片
            setImages((prevImages) =>
              prevImages.map((img) =>
                img.id === tempId ? localImageData : img,
              ),
            );

            // 清理预览URL
            URL.revokeObjectURL(previewUrl);

            // 存入IndexedDB以备后台同步
            const dbImageData = {
              id: tempId,
              image_name: file.name,
              image_data: base64,
              tags: [],
              upload_time: new Date(),
              description: imageName,
              is_valid: false,
              prompt_blocks: prompts,
            };

            try {
              await IndexedDBManager.addImage(dbImageData);
              console.log("✅ 图片已暂存到 IndexedDB");
            } catch (error) {
              console.error("❌ 暂存图片到 IndexedDB 失败:", error);
              setImages((prev) => prev.filter((img) => img.id !== tempId));
              throw error;
            }
          };
        }
      } catch (error) {
        console.error("❌ 上传失败:", error);

        // 移除临时图片
        setImages((prevImages) =>
          prevImages.filter((img) => img.id !== tempId),
        );

        // 清理预览URL
        URL.revokeObjectURL(previewUrl);

        throw error;
      }
    },
    [connectionStatus, setImages],
  );

  // 处理图片删除
  const handleImageDelete = useCallback(
    async (id: string) => {
      console.log("🗑️ 删除图片:", id);
      const result = await apiClient.deleteImage(id);

      if (result.success) {
        console.log("✅ 图片删除成功，实时监听器将自动更新UI");
        // 实时监听器会自动更新images状态，无需手动更新
        // 关闭弹窗
        setIsImageModalOpen(false);
        setSelectedImage(null);
      } else {
        console.error("❌ 图片删除失败:", result.error);
        throw new Error(result.error || "删除失败");
      }
    },
    [setIsImageModalOpen, setSelectedImage],
  );

  // 辅助函数：从URL获取文件扩展名
  const getFileExtensionFromUrl = useCallback((url: string): string => {
    try {
      const pathname = new URL(url).pathname;
      const extension = pathname.split(".").pop();
      return extension || "jpg";
    } catch {
      return "jpg";
    }
  }, []);

  // 处理图片复制
  const handleImageDuplicate = useCallback(
    async (image: ImageData) => {
      try {
        console.log("🔄 开始复制图片:", image.title);

        // 立即打开当前图片的详情弹窗并进入编辑模式
        setSelectedImage(image);
        setIsImageModalOpen(true);

        // 后台异步复制图片
        (async () => {
          try {
            // 从图片URL下载文件
            const response = await fetch(image.url);
            if (!response.ok) {
              throw new Error(`下载图片失败: ${response.status}`);
            }

            const blob = await response.blob();

            // 获取文件扩展名
            const extension = getFileExtensionFromUrl(image.url);

            // 创建新的文件对象
            const newFileName = `${image.title}_copy.${extension}`;
            const file = new File([blob], newFileName, { type: blob.type });

            // 创建新的标题
            const newTitle = `${image.title} (副本)`;

            // 使用现有的上传逻辑，包含所有提示词数据
            const prompts = image.prompt ? [{
              id: `prompt-${Date.now()}`,
              text: image.prompt,
              category: undefined,
              tags: [],
              usageCount: 0,
              isTemplate: false,
              color: undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            }] : [];
            await handleImageUpload(file, newTitle, prompts);

            console.log("✅ 图片复制成功");
          } catch (error) {
            console.error("❌ 后台复制图片失败:", error);
          }
        })();
      } catch (error) {
        console.error("❌ 复制图片失败:", error);
        throw error;
      }
    },
    [
      handleImageUpload,
      getFileExtensionFromUrl,
      setSelectedImage,
      setIsImageModalOpen,
    ],
  );

  // 处理提示词复制
  const handleCopyPrompt = useCallback(async (content: string) => {
    try {
      await copyToClipboard(content);
      // 这里可以添加成功提示
    } catch (error) {
      console.error("复制失败:", error);
    }
  }, []);

  return {
    handleImageUpdate,
    handleImageUpload,
    handleImageDelete,
    handleImageDuplicate,
    handleCopyPrompt,
    getFileExtensionFromUrl,
  };
}
