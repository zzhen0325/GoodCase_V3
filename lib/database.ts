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
      // 获取图片基本信息
      const images = await sql`
        SELECT * FROM "Image" 
        ORDER BY "createdAt" DESC
      `;

      // 为每个图片获取关联的prompts和tags
      const imagesWithRelations = await Promise.all(
        images.map(async (image: any) => {
          const [prompts, tags] = await Promise.all([
            sql`
              SELECT * FROM "Prompt" 
              WHERE "imageId" = ${image.id} 
              ORDER BY "order" ASC
            `,
            sql`
              SELECT t.* FROM "Tag" t
              JOIN "_ImageToTag" it ON t.id = it."B"
              WHERE it."A" = ${image.id}
            `
          ]);

          return {
            ...image,
            prompts: (prompts || []) as any[],
            tags: (tags || []) as any[],
            createdAt: image.createdAt.toISOString(),
            updatedAt: image.updatedAt.toISOString(),
          };
        })
      );

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
        // 尝试插入标签，如果已存在则忽略
        const tagId = tag.id || crypto.randomUUID();
        await sql`
          INSERT INTO "Tag" (id, name, color)
          VALUES (${tagId}, ${tag.name}, ${tag.color})
          ON CONFLICT (name) DO UPDATE SET color = ${tag.color}
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
          INSERT INTO "_ImageToTag" ("A", "B")
          VALUES (${imageId}, ${tagId})
          ON CONFLICT DO NOTHING
        `;
      }

      // 创建提示词
      for (const prompt of prompts) {
        const promptId = crypto.randomUUID();
        await sql`
          INSERT INTO "Prompt" (id, title, content, color, "order", "imageId")
          VALUES (${promptId}, ${prompt.title}, ${prompt.content}, ${prompt.color}, ${prompt.order}, ${imageId})
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
          JOIN "_ImageToTag" it ON t.id = it."B"
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
        const updateFields = [];
        const values = [];
        
        if (imageInfo.title !== undefined) {
          updateFields.push('title = $' + (values.length + 1));
          values.push(imageInfo.title);
        }
        if (imageInfo.url !== undefined) {
          updateFields.push('url = $' + (values.length + 1));
          values.push(imageInfo.url);
        }
        
        updateFields.push('"updatedAt" = $' + (values.length + 1));
        values.push(now);
        values.push(id);
        
        if (updateFields.length > 1) { // 除了updatedAt还有其他字段
          await sql`
            UPDATE "Image" 
            SET ${sql.unsafe(updateFields.join(', '))}
            WHERE id = ${id}
          `;
        }
      }

      // 更新标签
      if (tags) {
        // 删除旧的标签关联
        await sql`
          DELETE FROM "_ImageToTag" WHERE "A" = ${id}
        `;
        
        // 处理新标签
        const tagIds = [];
        for (const tag of tags) {
          const tagId = tag.id || crypto.randomUUID();
          await sql`
            INSERT INTO "Tag" (id, name, color)
            VALUES (${tagId}, ${tag.name}, ${tag.color})
            ON CONFLICT (name) DO UPDATE SET color = ${tag.color}
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
            INSERT INTO "_ImageToTag" ("A", "B")
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
            INSERT INTO "Prompt" (id, title, content, color, "order", "imageId")
            VALUES (${promptId}, ${prompt.title}, ${prompt.content}, ${prompt.color}, ${prompt.order}, ${id})
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
          JOIN "_ImageToTag" it ON t.id = it."B"
          WHERE it."A" = ${id}
        `
      ]);

      return {
        success: true,
        data: {
          ...updatedImage,
          prompts: (updatedPrompts || []) as any[],
          tags: (updatedTags || []) as any[],
          createdAt: updatedImage.createdAt,
          updatedAt: updatedImage.updatedAt,
        },
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
        DELETE FROM "_ImageToTag" WHERE "A" = ${id}
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
        SELECT * FROM "Tag" ORDER BY name ASC
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