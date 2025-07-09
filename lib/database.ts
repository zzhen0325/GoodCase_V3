import { database } from './firebase';
import { ref, set, get, push, remove, update, query, orderByChild, orderByKey } from 'firebase/database';
import { ImageData, Tag, DBResult, ExportData, ImportOptions, ImportResult } from '@/types';
import { deleteImageFromStorage } from './image-storage';

// Firebase 数据库操作类
export class Database {
  // 获取所有图片
  static async getAllImages(): Promise<DBResult<ImageData[]>> {
    try {
      const imagesRef = ref(database, 'images');
      const snapshot = await get(imagesRef);
      
      if (!snapshot.exists()) {
        return {
          success: true,
          data: [],
        };
      }

      const imagesData = snapshot.val();
      const images: ImageData[] = [];

      // 转换 Firebase 数据格式
      for (const [imageId, imageData] of Object.entries(imagesData as Record<string, any>)) {
        const image: ImageData = {
          id: imageId,
          url: imageData.url || '',
          title: imageData.title || '',
          prompts: [],
          tags: [],
          createdAt: imageData.createdAt || new Date().toISOString(),
          updatedAt: imageData.updatedAt || new Date().toISOString(),
        };

        // 获取关联的提示词
        if (imageData.prompts) {
          image.prompts = Object.entries(imageData.prompts as Record<string, any>)
            .map(([promptId, promptData]: [string, any]) => ({
              id: promptId,
              title: promptData.title || '',
              content: promptData.content || '',
              color: promptData.color || 'slate',
              order: promptData.order || 0,
              createdAt: promptData.createdAt,
              updatedAt: promptData.updatedAt,
            }))
            .sort((a, b) => a.order - b.order);
        }

        // 获取关联的标签
        if (imageData.tags) {
          const tagIds = Object.keys(imageData.tags);
          const tagsRef = ref(database, 'tags');
          const tagsSnapshot = await get(tagsRef);
          
          if (tagsSnapshot.exists()) {
            const allTags = tagsSnapshot.val();
            image.tags = tagIds
              .map(tagId => {
                const tagData = allTags[tagId];
                return tagData ? {
                  id: tagId,
                  name: tagData.name || '',
                  color: tagData.color || 'slate',
                  usageCount: tagData.usageCount || 0,
                  createdAt: tagData.createdAt,
                  updatedAt: tagData.updatedAt,
                } : null;
              })
              .filter(Boolean) as Tag[];
          }
        }

        images.push(image);
      }

      // 按创建时间倒序排列
      images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        success: true,
        data: images,
      };
    } catch (error) {
      console.error('获取图片失败:', error);
      return {
        success: false,
        error: '获取图片失败',
      };
    }
  }

  // 添加新图片
  static async addImage(imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBResult<ImageData>> {
    try {
      const { prompts, tags, ...imageInfo } = imageData;
      const imageId = crypto.randomUUID();
      const now = new Date().toISOString();

      // 准备图片数据
      const imageRecord = {
        title: imageInfo.title,
        url: imageInfo.url,
        createdAt: now,
        updatedAt: now,
      };

      // 处理提示词
      const promptsRecord: Record<string, any> = {};
      prompts.forEach((prompt, index) => {
        const promptId = crypto.randomUUID();
        promptsRecord[promptId] = {
          title: prompt.title,
          content: prompt.content,
          color: prompt.color,
          order: prompt.order || index,
          createdAt: now,
          updatedAt: now,
        };
      });

      // 处理标签
      const imageTagsRecord: Record<string, boolean> = {};
      const tagUpdates: Record<string, any> = {};
      
      for (const tag of tags) {
        let tagId = tag.id;
        
        // 如果没有 ID，检查是否已存在同名标签
        if (!tagId) {
          const tagsRef = ref(database, 'tags');
          const tagsSnapshot = await get(tagsRef);
          
          if (tagsSnapshot.exists()) {
            const allTags = tagsSnapshot.val();
            const existingTag = Object.entries(allTags).find(
              ([_, tagData]: [string, any]) => tagData.name === tag.name
            );
            
            if (existingTag) {
              tagId = existingTag[0];
            }
          }
        }
        
        // 如果仍然没有 ID，创建新标签
        if (!tagId) {
          tagId = crypto.randomUUID();
          tagUpdates[`tags/${tagId}`] = {
            name: tag.name,
            color: tag.color,
            usageCount: 1,
            createdAt: now,
            updatedAt: now,
          };
        } else {
          // 更新现有标签的使用次数
          const tagRef = ref(database, `tags/${tagId}`);
          const tagSnapshot = await get(tagRef);
          
          if (tagSnapshot.exists()) {
            const tagData = tagSnapshot.val();
            tagUpdates[`tags/${tagId}/usageCount`] = (tagData.usageCount || 0) + 1;
            tagUpdates[`tags/${tagId}/updatedAt`] = now;
            tagUpdates[`tags/${tagId}/color`] = tag.color; // 更新颜色
          }
        }
        
        imageTagsRecord[tagId] = true;
      }

      // 批量更新数据
      const updates: Record<string, any> = {
        [`images/${imageId}`]: imageRecord,
        [`images/${imageId}/prompts`]: promptsRecord,
        [`images/${imageId}/tags`]: imageTagsRecord,
        ...tagUpdates,
      };

      await update(ref(database), updates);

      // 返回创建的图片数据
      const createdImage: ImageData = {
        id: imageId,
        url: imageInfo.url,
        title: imageInfo.title,
        prompts: prompts.map((prompt, index) => ({
          ...prompt,
          id: Object.keys(promptsRecord)[index],
          order: prompt.order || index,
          createdAt: now,
          updatedAt: now,
        })),
        tags: tags.map(tag => ({
          ...tag,
          id: tag.id || crypto.randomUUID(),
          createdAt: tag.createdAt || now,
          updatedAt: now,
        })),
        createdAt: now,
        updatedAt: now,
      };

      return {
        success: true,
        data: createdImage,
      };
    } catch (error) {
      console.error('添加图片失败:', error);
      return {
        success: false,
        error: '添加图片失败',
      };
    }
  }

  // 更新图片
  static async updateImage(id: string, imageData: Partial<ImageData>): Promise<DBResult<ImageData>> {
    try {
      const { prompts, tags, ...imageInfo } = imageData;
      const now = new Date().toISOString();
      const updates: Record<string, any> = {};

      // 更新图片基本信息
      if (Object.keys(imageInfo).length > 0) {
        Object.entries(imageInfo).forEach(([key, value]) => {
          if (key !== 'id' && key !== 'createdAt') {
            updates[`images/${id}/${key}`] = value;
          }
        });
        updates[`images/${id}/updatedAt`] = now;
      }

      // 更新提示词
      if (prompts) {
        // 删除旧的提示词
        updates[`images/${id}/prompts`] = null;
        
        // 添加新的提示词
        const promptsRecord: Record<string, any> = {};
        prompts.forEach((prompt, index) => {
          const promptId = prompt.id || crypto.randomUUID();
          promptsRecord[promptId] = {
            title: prompt.title,
            content: prompt.content,
            color: prompt.color,
            order: prompt.order || index,
            createdAt: prompt.createdAt || now,
            updatedAt: now,
          };
        });
        updates[`images/${id}/prompts`] = promptsRecord;
      }

      // 更新标签
      if (tags) {
        // 删除旧的标签关联
        updates[`images/${id}/tags`] = null;
        
        // 处理新标签
        const imageTagsRecord: Record<string, boolean> = {};
        
        for (const tag of tags) {
          let tagId = tag.id;
          
          // 如果没有 ID，检查是否已存在同名标签
          if (!tagId) {
            const tagsRef = ref(database, 'tags');
            const tagsSnapshot = await get(tagsRef);
            
            if (tagsSnapshot.exists()) {
              const allTags = tagsSnapshot.val();
              const existingTag = Object.entries(allTags).find(
                ([_, tagData]: [string, any]) => tagData.name === tag.name
              );
              
              if (existingTag) {
                tagId = existingTag[0];
              }
            }
          }
          
          // 如果仍然没有 ID，创建新标签
          if (!tagId) {
            tagId = crypto.randomUUID();
            updates[`tags/${tagId}`] = {
              name: tag.name,
              color: tag.color,
              usageCount: 1,
              createdAt: now,
              updatedAt: now,
            };
          } else {
            // 更新现有标签
            const tagRef = ref(database, `tags/${tagId}`);
            const tagSnapshot = await get(tagRef);
            
            if (tagSnapshot.exists()) {
              const tagData = tagSnapshot.val();
              updates[`tags/${tagId}/usageCount`] = (tagData.usageCount || 0) + 1;
              updates[`tags/${tagId}/updatedAt`] = now;
              updates[`tags/${tagId}/color`] = tag.color;
            }
          }
          
          imageTagsRecord[tagId] = true;
        }
        
        updates[`images/${id}/tags`] = imageTagsRecord;
      }

      // 执行批量更新
      await update(ref(database), updates);

      // 获取更新后的图片数据
      const imageRef = ref(database, `images/${id}`);
      const imageSnapshot = await get(imageRef);
      
      if (!imageSnapshot.exists()) {
        return {
          success: false,
          error: '图片不存在',
        };
      }

      const updatedImageData = imageSnapshot.val();
      const updatedImage: ImageData = {
        id,
        url: updatedImageData.url,
        title: updatedImageData.title,
        prompts: [],
        tags: [],
        createdAt: updatedImageData.createdAt,
        updatedAt: updatedImageData.updatedAt,
      };

      // 获取提示词
      if (updatedImageData.prompts) {
        updatedImage.prompts = Object.entries(updatedImageData.prompts as Record<string, any>)
          .map(([promptId, promptData]: [string, any]) => ({
            id: promptId,
            title: promptData.title,
            content: promptData.content,
            color: promptData.color,
            order: promptData.order,
            createdAt: promptData.createdAt,
            updatedAt: promptData.updatedAt,
          }))
          .sort((a, b) => a.order - b.order);
      }

      // 获取标签
      if (updatedImageData.tags) {
        const tagIds = Object.keys(updatedImageData.tags);
        const tagsRef = ref(database, 'tags');
        const tagsSnapshot = await get(tagsRef);
        
        if (tagsSnapshot.exists()) {
          const allTags = tagsSnapshot.val();
          updatedImage.tags = tagIds
            .map(tagId => {
              const tagData = allTags[tagId];
              return tagData ? {
                id: tagId,
                name: tagData.name,
                color: tagData.color,
                usageCount: tagData.usageCount,
                createdAt: tagData.createdAt,
                updatedAt: tagData.updatedAt,
              } : null;
            })
            .filter(Boolean) as Tag[];
        }
      }

      return {
        success: true,
        data: updatedImage,
      };
    } catch (error) {
      console.error('更新图片失败:', error);
      return {
        success: false,
        error: '更新图片失败',
      };
    }
  }

  // 删除图片
  static async deleteImage(id: string): Promise<DBResult<void>> {
    try {
      // 先获取图片信息，以便删除 Storage 中的文件
      const imageRef = ref(database, `images/${id}`);
      const imageSnapshot = await get(imageRef);
      
      if (imageSnapshot.exists()) {
        const imageData = imageSnapshot.val();
        
        // 如果图片 URL 是 Firebase Storage 的 URL，则删除文件
        if (imageData.url && imageData.url.includes('firebasestorage.googleapis.com')) {
          try {
            await deleteImageFromStorage(imageData.url);
          } catch (storageError) {
            console.warn('删除 Storage 文件失败:', storageError);
            // 继续删除数据库记录，即使 Storage 删除失败
          }
        }
      }
      
      // 删除数据库记录
      const updates: Record<string, any> = {
        [`images/${id}`]: null,
      };

      await update(ref(database), updates);

      return {
        success: true,
      };
    } catch (error) {
      console.error('删除图片失败:', error);
      return {
        success: false,
        error: '删除图片失败',
      };
    }
  }

  // 获取所有标签
  static async getAllTags(): Promise<DBResult<Tag[]>> {
    try {
      const tagsRef = ref(database, 'tags');
      const snapshot = await get(tagsRef);
      
      if (!snapshot.exists()) {
        return {
          success: true,
          data: [],
        };
      }

      const tagsData = snapshot.val();
      const tags: Tag[] = Object.entries(tagsData as Record<string, any>)
        .map(([tagId, tagData]: [string, any]) => ({
          id: tagId,
          name: tagData.name || '',
          color: tagData.color || 'slate',
          usageCount: tagData.usageCount || 0,
          createdAt: tagData.createdAt,
          updatedAt: tagData.updatedAt,
        }))
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0) || a.name.localeCompare(b.name));
      
      return {
        success: true,
        data: tags,
      };
    } catch (error) {
      console.error('获取标签失败:', error);
      return {
        success: false,
        error: '获取标签失败',
      };
    }
  }

  // 导出所有数据
  static async exportAllData(): Promise<DBResult<ExportData>> {
    try {
      // 获取所有图片数据
      const imagesResult = await this.getAllImages();
      if (!imagesResult.success) {
        return {
          success: false,
          error: imagesResult.error,
        };
      }

      // 获取所有标签数据
      const tagsResult = await this.getAllTags();
      if (!tagsResult.success) {
        return {
          success: false,
          error: tagsResult.error,
        };
      }

      const images = imagesResult.data || [];
      const tags = tagsResult.data || [];
      
      // 计算总的提示词数量
      const totalPrompts = images.reduce((sum, image) => sum + (image.prompts?.length || 0), 0);

      const exportData: ExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        images,
        tags,
        metadata: {
          totalImages: images.length,
          totalTags: tags.length,
          totalPrompts,
        },
      };

      return {
        success: true,
        data: exportData,
      };
    } catch (error) {
      console.error('导出数据失败:', error);
      return {
        success: false,
        error: '导出数据失败',
      };
    }
  }

  // 导入数据
  static async importData(exportData: ExportData, options: ImportOptions): Promise<DBResult<ImportResult>> {
    try {
      const result: ImportResult = {
        success: true,
        summary: {
          imagesImported: 0,
          tagsImported: 0,
          promptsImported: 0,
          duplicatesSkipped: 0,
          errors: [],
        },
      };

      // 如果是替换模式，先清空所有数据
      if (options.mode === 'replace') {
        const updates: Record<string, any> = {
          images: null,
          tags: null,
        };
        await update(ref(database), updates);
      }

      // 获取现有数据用于重复检查
      const existingTags = new Map<string, string>();
      const existingImages = new Map<string, string>();
      
      if (options.mode === 'merge') {
        const [tagsSnapshot, imagesSnapshot] = await Promise.all([
          get(ref(database, 'tags')),
          get(ref(database, 'images')),
        ]);
        
        if (tagsSnapshot.exists()) {
          const tagsData = tagsSnapshot.val();
          Object.entries(tagsData).forEach(([tagId, tagData]: [string, any]) => {
            existingTags.set(tagData.name, tagId);
          });
        }
        
        if (imagesSnapshot.exists()) {
          const imagesData = imagesSnapshot.val();
          Object.entries(imagesData).forEach(([imageId, imageData]: [string, any]) => {
            existingImages.set(imageData.title, imageId);
          });
        }
      }

      const updates: Record<string, any> = {};

      // 导入标签
      for (const tag of exportData.tags) {
        try {
          if (options.skipDuplicates && existingTags.has(tag.name)) {
            result.summary.duplicatesSkipped++;
            continue;
          }

          const tagId = options.preserveIds ? tag.id : (existingTags.get(tag.name) || crypto.randomUUID());
          const now = new Date().toISOString();

          updates[`tags/${tagId}`] = {
            name: tag.name,
            color: tag.color,
            usageCount: tag.usageCount || 0,
            createdAt: tag.createdAt || now,
            updatedAt: now,
          };

          existingTags.set(tag.name, tagId);
          result.summary.tagsImported++;
        } catch (error) {
          result.summary.errors.push(`导入标签 "${tag.name}" 失败: ${error}`);
        }
      }

      // 导入图片
      for (const image of exportData.images) {
        try {
          if (options.skipDuplicates && existingImages.has(image.title)) {
            result.summary.duplicatesSkipped++;
            continue;
          }

          const imageId = options.preserveIds ? image.id : (existingImages.get(image.title) || crypto.randomUUID());
          const now = new Date().toISOString();

          // 准备图片数据
          const imageRecord = {
            title: image.title,
            url: image.url,
            createdAt: image.createdAt || now,
            updatedAt: now,
          };

          // 处理提示词
          const promptsRecord: Record<string, any> = {};
          (image.prompts || []).forEach((prompt, index) => {
            const promptId = options.preserveIds ? prompt.id : crypto.randomUUID();
            promptsRecord[promptId] = {
              title: prompt.title,
              content: prompt.content,
              color: prompt.color,
              order: prompt.order || index,
              createdAt: prompt.createdAt || now,
              updatedAt: now,
            };
            result.summary.promptsImported++;
          });

          // 处理标签关联
          const imageTagsRecord: Record<string, boolean> = {};
          (image.tags || []).forEach(tag => {
            const tagId = existingTags.get(tag.name);
            if (tagId) {
              imageTagsRecord[tagId] = true;
            }
          });

          updates[`images/${imageId}`] = imageRecord;
          if (Object.keys(promptsRecord).length > 0) {
            updates[`images/${imageId}/prompts`] = promptsRecord;
          }
          if (Object.keys(imageTagsRecord).length > 0) {
            updates[`images/${imageId}/tags`] = imageTagsRecord;
          }

          result.summary.imagesImported++;
        } catch (error) {
          result.summary.errors.push(`导入图片 "${image.title}" 失败: ${error}`);
        }
      }

      // 执行批量更新
      if (Object.keys(updates).length > 0) {
        await update(ref(database), updates);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('导入数据失败:', error);
      return {
        success: false,
        error: '导入数据失败',
      };
    }
  }
}