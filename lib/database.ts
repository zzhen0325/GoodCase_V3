import { neon } from '@neondatabase/serverless';
import { ImageData, Tag, DBResult } from '@/types';

// 创建 Neon 数据库连接
const sql = typeof window === 'undefined' && process.env.DATABASE_URL 
  ? neon(process.env.DATABASE_URL) 
  : null;

// 数据库操作类
export class Database {
  // 获取所有图片
  static async getAllImages(): Promise<DBResult<ImageData[]>> {
    if (!sql) {
      return {
        success: false,
        error: 'Database not available',
      };
    }
    
    try {
      // 使用优化的查询获取所有数据
      const [images, prompts, imageTags] = await Promise.all([
        // 获取所有图片
        sql`SELECT * FROM "Image" ORDER BY "createdAt" DESC`,
        
        // 获取所有提示词
        sql`SELECT * FROM "Prompt" ORDER BY "imageId", "order" ASC`,
        
        // 获取图片标签关联
        sql`
          SELECT it."A" as "imageId", t.* 
          FROM "_ImageTags" it
          JOIN "Tag" t ON t.id = it."B"
          ORDER BY it."A", t."name"
        `
      ]);

      // 构建数据映射
      const promptsMap = new Map<string, any[]>();
      const tagsMap = new Map<string, any[]>();
      
      // 按imageId分组prompts
      prompts.forEach((prompt: any) => {
        if (!promptsMap.has(prompt.imageId)) {
          promptsMap.set(prompt.imageId, []);
        }
        promptsMap.get(prompt.imageId)!.push(prompt);
      });
      
      // 按imageId分组tags
      imageTags.forEach((item: any) => {
        const { imageId, ...tag } = item;
        if (!tagsMap.has(imageId)) {
          tagsMap.set(imageId, []);
        }
        tagsMap.get(imageId)!.push(tag);
      });

      // 组装最终数据
      const imagesWithRelations = images.map((image: any) => ({
        ...image,
        prompts: promptsMap.get(image.id) || [],
        tags: tagsMap.get(image.id) || [],
        createdAt: image.createdAt.toISOString(),
        updatedAt: image.updatedAt.toISOString(),
      }));

      return {
        success: true,
        data: imagesWithRelations,
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
    if (!sql) {
      return {
        success: false,
        error: 'Database not available',
      };
    }
    
    try {
      const { prompts, tags, ...imageInfo } = imageData;
      const imageId = crypto.randomUUID();
      const now = new Date().toISOString();

      // 创建图片记录
      await sql`
        INSERT INTO "Image" (id, title, url, "createdAt", "updatedAt")
        VALUES (${imageId}, ${imageInfo.title}, ${imageInfo.url}, ${now}, ${now})
      `;

      // 处理标签
      const tagIds = [];
      for (const tag of tags) {
        // 尝试插入标签，如果已存在则更新颜色和使用次数
        const tagId = tag.id || crypto.randomUUID();
        await sql`
          INSERT INTO "Tag" (id, name, color, "usageCount", "createdAt", "updatedAt")
          VALUES (${tagId}, ${tag.name}, ${tag.color}, 1, ${now}, ${now})
          ON CONFLICT (name) DO UPDATE SET 
            color = ${tag.color},
            "usageCount" = "Tag"."usageCount" + 1,
            "updatedAt" = ${now}
        `;
        
        // 获取标签ID
        const existingTag = await sql`
          SELECT id FROM "Tag" WHERE name = ${tag.name}
        `;
        
        if (existingTag[0]) {
          tagIds.push(existingTag[0].id);
        }
      }

      // 创建图片-标签关联
      for (const tagId of tagIds) {
        await sql`
          INSERT INTO "_ImageTags" ("A", "B")
          VALUES (${imageId}, ${tagId})
          ON CONFLICT DO NOTHING
        `;
      }

      // 创建提示词
      for (const prompt of prompts) {
        const promptId = crypto.randomUUID();
        await sql`
          INSERT INTO "Prompt" (id, title, content, color, "order", "imageId", "createdAt", "updatedAt")
          VALUES (${promptId}, ${prompt.title}, ${prompt.content}, ${prompt.color}, ${prompt.order}, ${imageId}, ${now}, ${now})
        `;
      }

      // 获取完整的图片数据
      const [createdImage] = await sql`
        SELECT * FROM "Image" WHERE id = ${imageId}
      `;

      const [createdPrompts, createdTags] = await Promise.all([
        sql`
          SELECT * FROM "Prompt" 
          WHERE "imageId" = ${imageId} 
          ORDER BY "order" ASC
        `,
        sql`
          SELECT t.* FROM "Tag" t
          JOIN "_ImageTags" it ON t.id = it."B"
          WHERE it."A" = ${imageId}
        `
      ]);

      return {
        success: true,
        data: {
          id: createdImage.id,
          url: createdImage.url,
          title: createdImage.title,
          prompts: (createdPrompts || []) as any[],
          tags: (createdTags || []) as any[],
          createdAt: createdImage.createdAt,
          updatedAt: createdImage.updatedAt,
        } as ImageData,
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
    if (!sql) {
      return {
        success: false,
        error: 'Database not available',
      };
    }
    
    try {
      const { prompts, tags, ...imageInfo } = imageData;
      const now = new Date().toISOString();

      // 更新图片基本信息
      if (Object.keys(imageInfo).length > 0) {
        // 根据需要更新的字段组合不同的SQL语句
        if (imageInfo.title !== undefined && imageInfo.url !== undefined) {
          await sql`
            UPDATE "Image" 
            SET title = ${imageInfo.title}, url = ${imageInfo.url}, "updatedAt" = ${now}
            WHERE id = ${id}
          `;
        } else if (imageInfo.title !== undefined) {
          await sql`
            UPDATE "Image" 
            SET title = ${imageInfo.title}, "updatedAt" = ${now}
            WHERE id = ${id}
          `;
        } else if (imageInfo.url !== undefined) {
          await sql`
            UPDATE "Image" 
            SET url = ${imageInfo.url}, "updatedAt" = ${now}
            WHERE id = ${id}
          `;
        }
      }

      // 更新标签
      if (tags) {
        // 删除旧的标签关联
        await sql`
          DELETE FROM "_ImageTags" WHERE "A" = ${id}
        `;
        
        // 处理新标签
        const tagIds = [];
        for (const tag of tags) {
          const tagId = tag.id || crypto.randomUUID();
          await sql`
            INSERT INTO "Tag" (id, name, color, "usageCount", "createdAt", "updatedAt")
            VALUES (${tagId}, ${tag.name}, ${tag.color}, 1, ${now}, ${now})
            ON CONFLICT (name) DO UPDATE SET 
              color = ${tag.color},
              "usageCount" = "Tag"."usageCount" + 1,
              "updatedAt" = ${now}
          `;
          
          const existingTag = await sql`
            SELECT id FROM "Tag" WHERE name = ${tag.name}
          `;
          
          if (existingTag[0]) {
            tagIds.push(existingTag[0].id);
          }
        }

        // 创建新的标签关联
        for (const tagId of tagIds) {
          await sql`
            INSERT INTO "_ImageTags" ("A", "B")
            VALUES (${id}, ${tagId})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      // 更新提示词
      if (prompts) {
        // 删除旧的提示词
        await sql`
          DELETE FROM "Prompt" WHERE "imageId" = ${id}
        `;

        // 创建新的提示词
        for (const prompt of prompts) {
          const promptId = crypto.randomUUID();
          await sql`
            INSERT INTO "Prompt" (id, title, content, color, "order", "imageId", "createdAt", "updatedAt")
            VALUES (${promptId}, ${prompt.title}, ${prompt.content}, ${prompt.color}, ${prompt.order}, ${id}, ${now}, ${now})
          `;
        }
      }

      // 获取更新后的完整图片数据
      const [updatedImage] = await sql`
        SELECT * FROM "Image" WHERE id = ${id}
      `;

      const [updatedPrompts, updatedTags] = await Promise.all([
        sql`
          SELECT * FROM "Prompt" 
          WHERE "imageId" = ${id} 
          ORDER BY "order" ASC
        `,
        sql`
          SELECT t.* FROM "Tag" t
          JOIN "_ImageTags" it ON t.id = it."B"
          WHERE it."A" = ${id}
        `
      ]);

      return {
        success: true,
        data: {
          id: updatedImage.id,
          url: updatedImage.url,
          title: updatedImage.title,
          prompts: (updatedPrompts || []) as any[],
          tags: (updatedTags || []) as any[],
          createdAt: updatedImage.createdAt,
          updatedAt: updatedImage.updatedAt,
        } as ImageData,
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
    if (!sql) {
      return {
        success: false,
        error: 'Database not available',
      };
    }
    
    try {
      // 删除相关的提示词
      await sql`
        DELETE FROM "Prompt" WHERE "imageId" = ${id}
      `;
      
      // 删除图片-标签关联
      await sql`
        DELETE FROM "_ImageTags" WHERE "A" = ${id}
      `;
      
      // 删除图片
      await sql`
        DELETE FROM "Image" WHERE id = ${id}
      `;

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
    if (!sql) {
      return {
        success: false,
        error: 'Database not available',
      };
    }
    
    try {
      const tags = await sql`
        SELECT * FROM "Tag" 
        ORDER BY "usageCount" DESC, "name" ASC
      `;
      
      return {
         success: true,
         data: tags as any[],
       };
    } catch (error) {
      console.error('获取标签失败:', error);
      return {
        success: false,
        error: '获取标签失败',
      };
    }
  }
}