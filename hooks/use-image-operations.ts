import { useCallback } from "react";
import { ImageData, PromptBlock } from "@/types";
import { dataService } from "@/lib/data-service";
import { copyToClipboard } from "@/lib/utils";

interface UseImageOperationsProps {
  selectedImage: ImageData | null;
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>;
  setSelectedImage: React.Dispatch<React.SetStateAction<ImageData | null>>;
  setIsImageModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onRefresh?: () => void;
}

/**
 * 图片操作 Hook
 * 负责处理图片的增删改查操作
 */
export function useImageOperations({
  selectedImage,
  setImages,
  setSelectedImage,
  setIsImageModalOpen,
  onRefresh,
}: UseImageOperationsProps) {
  // 处理图片更新
  const handleImageUpdate = useCallback(
    async (id: string, updates: Partial<ImageData>) => {
      console.log("🔄 更新图片:", id, updates);
      try {
        await dataService.updateImage(id, updates);
        console.log("✅ 图片更新成功");
        
        // 更新本地状态
        setImages(prev => prev.map(img => 
          img.id === id ? { ...img, ...updates } : img
        ));
        
        // 如果当前选中的图片被更新，也要更新选中状态
        if (selectedImage?.id === id) {
          setSelectedImage(prev => prev ? { ...prev, ...updates } : null);
        }
        
        // 触发刷新
        onRefresh?.();
      } catch (error) {
        console.error("❌ 图片更新失败:", error);
        throw error;
      }
    },
    [setImages, selectedImage, setSelectedImage, onRefresh],
  );

  // 处理图片上传
  const handleImageUpload = useCallback(
    async (file: File, imageName: string, promptBlocks: PromptBlock[] = []) => {
      console.log("📤 开始上传图片:", file.name);

      try {
        // 读取文件为base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;

        // 创建图片数据
        const imageData = {
          image_name: file.name,
          image_data: base64,
          tags: [],
          upload_time: new Date(),
          description: imageName,
          is_valid: true,
        };

        // 添加图片到数据库（会自动创建默认提示词块）
        const newImage = await dataService.addImage(imageData);
        console.log("✅ 图片上传成功:", newImage);

        // 如果有自定义提示词块，更新它们
        if (promptBlocks.length > 0) {
          for (const block of promptBlocks) {
            await dataService.updatePromptBlock(block.id, {
              title: block.title,
              text: block.text,
              color: block.color,
            });
          }
        }

        // 更新本地状态
        setImages(prev => [newImage, ...prev]);
        
        // 触发刷新
        onRefresh?.();

        return newImage;
      } catch (error) {
        console.error("❌ 上传失败:", error);
        throw error;
      }
    },
    [setImages, onRefresh],
  );

  // 处理图片删除
  const handleImageDelete = useCallback(
    async (id: string) => {
      console.log("🗑️ 删除图片:", id);
      try {
        await dataService.deleteImage(id);
        console.log("✅ 图片删除成功");
        
        // 更新本地状态
        setImages(prev => prev.filter(img => img.id !== id));
        
        // 关闭弹窗
        setIsImageModalOpen(false);
        setSelectedImage(null);
        
        // 触发刷新
        onRefresh?.();
      } catch (error) {
        console.error("❌ 图片删除失败:", error);
        throw error;
      }
    },
    [setImages, setIsImageModalOpen, setSelectedImage, onRefresh],
  );



  // 处理图片复制
  const handleImageDuplicate = useCallback(
    async (image: ImageData) => {
      try {
        console.log("🔄 开始复制图片:", image.title);

        // 立即打开当前图片的详情弹窗
        setSelectedImage(image);
        setIsImageModalOpen(true);

        // 后台异步复制图片
        (async () => {
          try {
            // 使用数据服务层的复制功能
            const duplicatedImage = await dataService.duplicateImage(image.id);
            console.log("✅ 图片复制成功:", duplicatedImage);
            
            // 更新本地状态
            setImages(prev => [duplicatedImage, ...prev]);
            
            // 触发刷新
            onRefresh?.();
          } catch (error) {
            console.error("❌ 后台复制图片失败:", error);
          }
        })();
      } catch (error) {
        console.error("❌ 复制图片失败:", error);
        throw error;
      }
    },
    [setSelectedImage, setIsImageModalOpen, setImages, onRefresh],
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
  };
}
