import { useCallback } from 'react';
import { ImageData, PromptBlock } from '@/types';
import { getImageMetadata, validateImageFile } from '@/lib/image-utils';
import { copyToClipboard, generateId } from '@/lib/utils';

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
    async (id: string, updates: Partial<ImageData> | { title?: string; tagIds?: string[]; promptIds?: string[] }) => {
      try {
        const response = await fetch(`/api/images/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '更新图片失败');
        }

        // 更新本地状态 - 正确处理 prompts 和 tags 字段
        setImages((prev) =>
          prev.map((img) => {
            if (img.id === id) {
              const updatedImg = { ...img, ...updates };
              return updatedImg;
            }
            return img;
          })
        );

        // 如果当前选中的图片被更新，也要更新选中状态
        if (selectedImage?.id === id) {
          setSelectedImage((prev) => {
            if (prev) {
              const updatedImage = { ...prev, ...updates };
              return updatedImage;
            }
            return null;
          });
        }

        // 移除全量刷新，使用本地状态更新即可
        // onRefresh?.();
      } catch (error) {
        console.error('❌ 图片更新失败:', error);
        throw error;
      }
    },
    [setImages, selectedImage, setSelectedImage, onRefresh]
  );

  // 处理图片上传
  const handleImageUpload = useCallback(
    async (file: File, imageName: string, prompts: PromptBlock[] = [], tagIds: string[] = []) => {
      try {
        // 验证图片文件
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          throw new Error(validation.error || '图片文件无效');
        }
        
        // 获取图片元数据
        const metadata = await getImageMetadata(file);
        console.log('📊 图片元数据:', metadata);
        
        // 读取文件为base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64 = await base64Promise;

        // 处理提示词数据 - 提示词作为图片的一部分直接传递
        const promptBlocks = prompts.map(prompt => ({
          id: prompt.id.startsWith('temp_') ? generateId() : prompt.id,
          content: prompt.content || '',
          color: prompt.color || 'pink',
          order: prompt.order || 0
        }));

        // 添加图片到数据库
        const response = await fetch('/api/images/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: base64,
            title: imageName,
            ...metadata, // 使用实际的图片元数据
            tagIds: tagIds || [],
            promptBlocks: promptBlocks,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '上传失败');
        }

        const { data: image } = await response.json();

        // 更新本地状态
        setImages((prev) => [image, ...prev]);

        // 不需要触发全量刷新，本地状态已经更新
        // onRefresh?.();
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
      try {
        const response = await fetch(`/api/images/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '删除图片失败');
        }

        // 更新本地状态
        setImages((prev) => prev.filter((img) => img.id !== id));

        // 关闭弹窗
        setIsImageModalOpen(false);
        setSelectedImage(null);

        // 不需要触发全量刷新，本地状态已经更新
        // onRefresh?.();
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
        // 立即打开当前图片的详情弹窗
        setSelectedImage(image);
        setIsImageModalOpen(true);

        // 后台异步复制图片
        (async () => {
          try {
            // 创建复制的图片数据
            const duplicateData = {
              name: `${image.name} (副本)`,
              url: image.url,
              promptBlocks: image.promptBlocks,
              tags: image.tags,
            };

            const response = await fetch('/api/images/upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                imageUrl: image.url, // 修复：使用正确的参数名
                title: `${image.title} (副本)`,
                width: 0,
                 height: 0,
                 fileSize: 0,
                 format: 'png',
                tags: image.tags || [],
                promptBlocks: image.promptBlocks || [],
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || '复制失败');
            }

            const { data: newImage } = await response.json(); // 修复：使用正确的响应结构

            // 更新本地状态
            setImages((prev) => [newImage, ...prev]);

            // 不需要触发全量刷新，本地状态已经更新
            // onRefresh?.();
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
