import { db, COLLECTIONS } from './firebase';
import { ImageData, Tag, DBResult } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

// 数据库操作类
export class Database {
  // 获取所有图片
  static async getAllImages(): Promise<DBResult<ImageData[]>> {
    try {
      const imagesSnapshot = await db.collection(COLLECTIONS.IMAGES)
        .orderBy('createdAt', 'desc')
        .get();

      const images: ImageData[] = [];
      
      for (const doc of imagesSnapshot.docs) {
        const data = doc.data();
        images.push({
          id: doc.id,
          url: data.url,
          title: data.title,
          prompts: data.prompts || [],
          tags: data.tags || [],
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        });
      }

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

  // 数据规范化处理
  private static normalizeImageData(imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'>) {
    return {
      title: imageData.title?.trim() || '',
      url: imageData.url?.trim() || '',
      prompts: Array.isArray(imageData.prompts) ? imageData.prompts.filter(p => p && p.content?.trim()) : [],
      tags: Array.isArray(imageData.tags) ? imageData.tags.filter(t => t && t.name?.trim()) : [],
    };
  }

  // 添加新图片
  static async addImage(imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBResult<ImageData>> {
    try {
      // 数据验证
      if (!imageData.title?.trim() && !imageData.url?.trim()) {
        return {
          success: false,
          error: '图片标题和URL不能同时为空'
        };
      }

      const now = FieldValue.serverTimestamp();
      const docRef = db.collection(COLLECTIONS.IMAGES).doc();
      
      // 规范化数据
      const normalizedData = this.normalizeImageData(imageData);
      
      const newImage = {
        ...normalizedData,
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(newImage);

      // 处理标签更新使用次数
      if (normalizedData.tags && normalizedData.tags.length > 0) {
        const batch = db.batch();
        
        for (const tag of normalizedData.tags) {
          // 确保标签名称有效
          if (!tag.name?.trim()) continue;
          
          const tagQuery = await db.collection(COLLECTIONS.TAGS)
            .where('name', '==', tag.name.trim())
            .limit(1)
            .get();
          
          if (!tagQuery.empty) {
            // 标签存在，增加使用次数
            const tagDoc = tagQuery.docs[0];
            batch.update(tagDoc.ref, {
              usageCount: FieldValue.increment(1),
              updatedAt: now,
            });
          } else {
            // 标签不存在，创建新标签
            const newTagRef = db.collection(COLLECTIONS.TAGS).doc();
            batch.set(newTagRef, {
              name: tag.name,
              color: tag.color,
              usageCount: 1,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
        
        await batch.commit();
      }

      // 获取创建的文档数据
      const createdDoc = await docRef.get();
      const createdData = createdDoc.data();

      return {
        success: true,
        data: {
          id: docRef.id,
          url: createdData!.url,
          title: createdData!.title,
          prompts: createdData!.prompts || [],
          tags: createdData!.tags || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
    try {
      const docRef = db.collection(COLLECTIONS.IMAGES).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return {
          success: false,
          error: '图片不存在',
        };
      }

      const updateData: any = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      // 更新基本信息
      if (imageData.title !== undefined) {
        updateData.title = imageData.title;
      }
      if (imageData.url !== undefined) {
        updateData.url = imageData.url;
      }
      if (imageData.prompts !== undefined) {
        updateData.prompts = imageData.prompts;
      }
      if (imageData.tags !== undefined) {
        updateData.tags = imageData.tags;
        
        // 处理标签使用次数更新
        const batch = db.batch();
        
        for (const tag of imageData.tags) {
          const tagQuery = await db.collection(COLLECTIONS.TAGS)
            .where('name', '==', tag.name)
            .limit(1)
            .get();
          
          if (!tagQuery.empty) {
            // 标签存在，增加使用次数
            const tagDoc = tagQuery.docs[0];
            batch.update(tagDoc.ref, {
              usageCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp(),
            });
          } else {
            // 标签不存在，创建新标签
            const newTagRef = db.collection(COLLECTIONS.TAGS).doc();
            batch.set(newTagRef, {
              name: tag.name,
              color: tag.color,
              usageCount: 1,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
          }
        }
        
        await batch.commit();
      }

      await docRef.update(updateData);

      // 获取更新后的数据
      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data()!;

      return {
        success: true,
        data: {
          id: updatedDoc.id,
          url: updatedData.url,
          title: updatedData.title,
          prompts: updatedData.prompts || [],
          tags: updatedData.tags || [],
          createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || updatedData.createdAt,
          updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || updatedData.updatedAt,
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
    try {
      const docRef = db.collection(COLLECTIONS.IMAGES).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return {
          success: false,
          error: '图片不存在',
        };
      }

      // 在Firestore中，删除文档会自动删除所有嵌套数据
      await docRef.delete();

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
      const tagsSnapshot = await db.collection(COLLECTIONS.TAGS)
        .orderBy('usageCount', 'desc')
        .orderBy('name', 'asc')
        .get();

      const tags: Tag[] = [];
      
      for (const doc of tagsSnapshot.docs) {
        const data = doc.data();
        tags.push({
          id: doc.id,
          name: data.name,
          color: data.color,
          usageCount: data.usageCount || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        });
      }
      
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