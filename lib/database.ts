import { PrismaClient } from '@prisma/client';
import { ImageData, Tag, DBResult } from '@/types';

// 创建Prisma客户端实例
const prisma = new PrismaClient();

// 数据库操作类
export class Database {
  // 获取所有图片
  static async getAllImages(): Promise<DBResult<ImageData[]>> {
    try {
      const images = await prisma.image.findMany({
        include: {
          prompts: true,
          tags: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return {
        success: true,
        data: images.map((image: any) => ({
          ...image,
          createdAt: image.createdAt.toISOString(),
          updatedAt: image.updatedAt.toISOString(),
        })),
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

      // 创建或获取标签
      const tagPromises = tags.map(async tag => {
        return await prisma.tag.upsert({
          where: { name: tag.name },
          update: { color: tag.color },
          create: { name: tag.name, color: tag.color },
        });
      });
      const existingTags = await Promise.all(tagPromises);

      // 创建图片及关联数据
      const image = await prisma.image.create({
        data: {
          ...imageInfo,
          prompts: {
            create: prompts.map(prompt => ({
              title: prompt.title,
              content: prompt.content,
              color: prompt.color,
              order: prompt.order,
            })),
          },
          tags: {
            connect: existingTags.map(tag => ({ id: tag.id })),
          },
        },
        include: {
          prompts: true,
          tags: true,
        },
      });

      return {
        success: true,
        data: {
          ...image,
          createdAt: image.createdAt.toISOString(),
          updatedAt: image.updatedAt.toISOString(),
        },
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

      // 更新标签
      if (tags) {
        const tagPromises = tags.map(async tag => {
          return await prisma.tag.upsert({
            where: { name: tag.name },
            update: { color: tag.color },
            create: { name: tag.name, color: tag.color },
          });
        });
        const existingTags = await Promise.all(tagPromises);

        // 更新图片标签关联
        await prisma.image.update({
          where: { id },
          data: {
            tags: {
              set: existingTags.map(tag => ({ id: tag.id })),
            },
          },
        });
      }

      // 更新提示词
      if (prompts) {
        // 删除旧的提示词
        await prisma.prompt.deleteMany({
          where: { imageId: id },
        });

        // 创建新的提示词
        await prisma.prompt.createMany({
          data: prompts.map(prompt => ({
            ...prompt,
            imageId: id,
          })),
        });
      }

      // 更新图片信息
      const image = await prisma.image.update({
        where: { id },
        data: imageInfo,
        include: {
          prompts: true,
          tags: true,
        },
      });

      return {
        success: true,
        data: {
          ...image,
          createdAt: image.createdAt.toISOString(),
          updatedAt: image.updatedAt.toISOString(),
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
    try {
      await prisma.image.delete({
        where: { id },
      });

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
      const tags = await prisma.tag.findMany();
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
}