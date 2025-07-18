import { useCallback } from 'react';
import { ImageData, Prompt, PromptBlock } from '@/types';
import { database } from '@/lib/database';
import { copyToClipboard } from '@/lib/utils';

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
      console.log('🔄 更新图片:', id, updates);
      try {
        const result = await database.updateImage(id, updates);
        if (!result.success) {
          throw new Error(result.error);
        }

        console.log('✅ 图片更新成功');

        // 更新本地状态
        setImages((prev) =>
          prev.map((img) => (img.id === id ? { ...img, ...updates } : img))
        );

        // 如果当前选中的图片被更新，也要更新选中状态
        if (selectedImage?.id === id) {
          setSelectedImage((prev) => (prev ? { ...prev, ...updates } : null));
        }

        // 触发刷新
        onRefresh?.();
      } catch (error) {
        console.error('❌ 图片更新失败:', error);
        throw error;
      }
    },
    [setImages, selectedImage, setSelectedImage, onRefresh]
  );

  // 处理图片上传
  const handleImageUpload = useCallback(
    async (file: File, imageName: string, prompts: PromptBlock[] = []) => {
      console.log('📤 开始上传图片:', file.name);

      try {
        // 读取文件为base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;

        // 将PromptBlock转换为Prompt格式
        const convertedPrompts: Prompt[] = prompts.map((block, index) => ({
          id: block.id,
          title: block.title || `提示词 ${index + 1}`,
          content: block.content || block.text || '',
          color: block.color || '#3b82f6',
          order: block.order || block.sortOrder || index,
          createdAt: typeof block.createdAt === 'string' ? block.createdAt : new Date().toISOString(),
          updatedAt: typeof block.updatedAt === 'string' ? block.updatedAt : new Date().toISOString(),
        }));

        // 创建图片数据
        const imageData = {
          title: imageName,
          url: base64,
          prompts: convertedPrompts,
          tags: [],
        };

        // 添加图片到数据库
        const result = await database.addImage(imageData);
        if (!result.success || !result.data) {
          throw new Error(result.error || '上传失败');
        }

        console.log('✅ 图片上传成功:', result.data);

        // 更新本地状态
        setImages((prev) => [result.data!, ...prev]);

        // 触发刷新
        onRefresh?.();
      } catch (error) {
        console.error('❌ 上传失败:', error);
        throw error;
      }
    },
    [setImages, onRefresh]
  );

  // 处理图片删除
  const handleImageDelete = useCallback(
    async (id: string) => {
      console.log('🗑️ 删除图片:', id);
      try {
        const result = await database.deleteImage(id);
        if (!result.success) {
          throw new Error(result.error);
        }

        console.log('✅ 图片删除成功');

        // 更新本地状态
        setImages((prev) => prev.filter((img) => img.id !== id));

        // 关闭弹窗
        setIsImageModalOpen(false);
        setSelectedImage(null);

        // 触发刷新
        onRefresh?.();
      } catch (error) {
        console.error('❌ 图片删除失败:', error);
        throw error;
      }
    },
    [setImages, setIsImageModalOpen, setSelectedImage, onRefresh]
  );

  // 处理图片复制
  const handleImageDuplicate = useCallback(
    async (image: ImageData) => {
      try {
        console.log('🔄 开始复制图片:', image.title);

        // 立即打开当前图片的详情弹窗
        setSelectedImage(image);
        setIsImageModalOpen(true);

        // 后台异步复制图片
        (async () => {
          try {
            // 创建复制的图片数据
            const duplicateData = {
              title: `${image.title} (副本)`,
              url: image.url,
              prompts: image.prompts,
              tags: image.tags,
            };

            const result = await database.addImage(duplicateData);
            if (!result.success) {
              throw new Error(result.error);
            }

            console.log('✅ 图片复制成功:', result.data);

            // 更新本地状态
            setImages((prev) => [result.data!, ...prev]);

            // 触发刷新
            onRefresh?.();
          } catch (error) {
            console.error('❌ 后台复制图片失败:', error);
          }
        })();
      } catch (error) {
        console.error('❌ 复制图片失败:', error);
        throw error;
      }
    },
    [setSelectedImage, setIsImageModalOpen, setImages, onRefresh]
  );

  // 处理提示词复制
  const handleCopyPrompt = useCallback(async (content: string) => {
    try {
      await copyToClipboard(content);
      // 这里可以添加成功提示
    } catch (error) {
      console.error('复制失败:', error);
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
