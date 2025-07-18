import indexedDBManager from './indexed-db';
import { ImageData, Tag, TagGroup, PromptBlock, BatchResult, DBResult } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 数据服务层 - 统一管理所有数据操作
 * 替代原有的缓存管理器，直接使用 IndexedDB 作为数据存储
 */
export class DataService {
  private dbManager: typeof indexedDBManager;
  private static instance: DataService;

  private constructor() {
    this.dbManager = indexedDBManager;
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  // ==================== 图片操作 ====================
  
  /**
   * 添加图片
   */
  public async addImage(imageData: Omit<ImageData, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder' | 'prompts'>): Promise<ImageData> {
    const now = new Date();
    const newImage: ImageData = {
      ...imageData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      sortOrder: 0, // 将在 IndexedDBManager 中自动设置
      prompts: [] // 将在 IndexedDBManager 中自动创建默认提示词块
    };
    
    await this.dbManager.addImage(newImage);
    const result = await this.getImageById(newImage.id);
    return result!;
  }

  /**
   * 获取所有图片
   */
  public async getImages(): Promise<ImageData[]> {
    return this.dbManager.getImages();
  }

  /**
   * 根据ID获取图片
   */
  public async getImageById(id: string): Promise<ImageData | null> {
    return this.dbManager.getImageById(id);
  }

  /**
   * 更新图片
   */
  public async updateImage(imageData: ImageData): Promise<void> {
    imageData.updatedAt = new Date();
    await this.dbManager.updateImageData(imageData);
  }

  /**
   * 删除图片
   */
  public async deleteImage(id: string): Promise<void> {
    await this.dbManager.deleteImage(id);
  }

  /**
   * 搜索图片
   */
  public async searchImages(query: string, tagFilters: string[] = []): Promise<ImageData[]> {
    return this.dbManager.searchImages(query, tagFilters);
  }

  /**
   * 复制图片（带关联数据）
   */
  public async duplicateImage(id: string): Promise<ImageData | null> {
    const originalImage = await this.getImageById(id);
    if (!originalImage) return null;

    const now = new Date();
    const duplicatedImage: ImageData = {
      ...originalImage,
      id: uuidv4(),
      title: `${originalImage.title} (副本)`,
      createdAt: now,
      updatedAt: now,
      sortOrder: 0, // 将在 IndexedDBManager 中自动设置
      prompts: [] // 先设为空，稍后复制
    };

    // 添加图片（会自动创建默认提示词块）
    await this.dbManager.addImage(duplicatedImage);

    // 删除自动创建的默认提示词块
    const defaultPrompts = await this.dbManager.getPromptBlocks(duplicatedImage.id);
    for (const prompt of defaultPrompts) {
      await this.dbManager.deletePromptBlock(prompt.id);
    }

    // 复制原图片的提示词块
    for (const originalPrompt of originalImage.prompts) {
      const duplicatedPrompt: PromptBlock = {
        ...originalPrompt,
        id: uuidv4(),
        imageId: duplicatedImage.id,
        createdAt: now,
        updatedAt: now
      };
      await this.dbManager.addPromptBlock(duplicatedPrompt);
    }

    return this.getImageById(duplicatedImage.id);
  }

  // ==================== 标签操作 ====================

  /**
   * 添加标签
   */
  public async addTag(tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder' | 'usageCount'>): Promise<Tag> {
    const now = new Date();
    const newTag: Tag = {
      ...tagData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      sortOrder: 0, // 将在 IndexedDBManager 中自动设置
      usageCount: 0
    };
    
    await this.dbManager.addTag(newTag);
    return newTag;
  }

  /**
   * 获取标签列表
   */
  public async getTags(groupId?: string): Promise<Tag[]> {
    return this.dbManager.getTags(groupId);
  }

  /**
   * 更新标签
   */
  public async updateTag(tag: Tag): Promise<void> {
    tag.updatedAt = new Date();
    await this.dbManager.updateTag(tag);
  }

  /**
   * 删除标签
   */
  public async deleteTag(id: string): Promise<void> {
    await this.dbManager.deleteTag(id);
  }

  /**
   * 获取标签使用统计
   */
  public async getTagUsageCount(tagName: string): Promise<number> {
    return this.dbManager.getImageCountByTag(tagName);
  }

  // ==================== 标签分组操作 ====================

  /**
   * 添加标签分组
   */
  public async addTagGroup(groupData: Omit<TagGroup, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder' | 'tagCount'>): Promise<TagGroup> {
    const now = new Date();
    const newGroup: TagGroup = {
      ...groupData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      sortOrder: 0, // 将在 IndexedDBManager 中自动设置
      tagCount: 0
    };
    
    await this.dbManager.addTagGroup(newGroup);
    return newGroup;
  }

  /**
   * 获取标签分组列表
   */
  public async getTagGroups(): Promise<TagGroup[]> {
    const groups = await this.dbManager.getTagGroups();
    
    // 更新每个分组的标签数量
    for (const group of groups) {
      group.tagCount = await this.dbManager.getTagCount(group.id);
    }
    
    return groups;
  }

  /**
   * 更新标签分组
   */
  public async updateTagGroup(group: TagGroup): Promise<void> {
    group.updatedAt = new Date();
    await this.dbManager.updateTagGroup(group);
  }

  /**
   * 删除标签分组
   */
  public async deleteTagGroup(id: string): Promise<void> {
    await this.dbManager.deleteTagGroup(id);
  }

  // ==================== 提示词块操作 ====================

  /**
   * 添加提示词块
   */
  public async addPromptBlock(promptData: Omit<PromptBlock, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>): Promise<PromptBlock> {
    const now = new Date();
    const newPrompt: PromptBlock = {
      ...promptData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      sortOrder: 0 // 将在 IndexedDBManager 中自动设置
    };
    
    await this.dbManager.addPromptBlock(newPrompt);
    return newPrompt;
  }

  /**
   * 获取图片的提示词块
   */
  public async getPromptBlocks(imageId: string): Promise<PromptBlock[]> {
    return this.dbManager.getPromptBlocks(imageId);
  }

  /**
   * 更新提示词块
   */
  public async updatePromptBlock(prompt: PromptBlock): Promise<void> {
    prompt.updatedAt = new Date();
    await this.dbManager.updatePromptBlock(prompt);
  }

  /**
   * 删除提示词块
   */
  public async deletePromptBlock(id: string): Promise<void> {
    await this.dbManager.deletePromptBlock(id);
  }

  /**
   * 获取所有提示词块的文本内容（用于一键复制）
   */
  public async getAllPromptTexts(imageId: string): Promise<string> {
    const prompts = await this.getPromptBlocks(imageId);
    return prompts.map(prompt => prompt.text).filter(text => text.trim()).join(', ');
  }

  // ==================== 图片缓存操作 ====================

  /**
   * 缓存图片blob数据
   */
  public async cacheImageBlob(id: string, blob: Blob): Promise<void> {
    const extension = 'jpg'; // 默认扩展名
    await this.dbManager.cacheImageBlob(id, blob, extension);
  }

  /**
   * 获取缓存的图片blob数据
   */
  public async getCachedImageBlob(id: string): Promise<Blob | null> {
    const cached = await this.dbManager.getCachedImageBlob(id);
    return cached ? cached.blob : null;
  }

  /**
   * 删除缓存的图片blob数据
   */
  public async deleteCachedImageBlob(id: string): Promise<void> {
    await this.dbManager.deleteCachedImageBlob(id);
  }

  // ==================== 排序操作 ====================

  /**
   * 更新图片排序
   */
  public async updateImageSortOrder(imageId: string, newSortOrder: number): Promise<void> {
    const image = await this.getImageById(imageId);
    if (image) {
      image.sortOrder = newSortOrder;
      await this.updateImage(image);
    }
  }

  /**
   * 更新标签排序
   */
  public async updateTagSortOrder(tagId: string, newSortOrder: number): Promise<void> {
    const tags = await this.getTags();
    const tag = tags.find(t => t.id === tagId);
    if (tag) {
      tag.sortOrder = newSortOrder;
      await this.updateTag(tag);
    }
  }

  /**
   * 更新标签分组排序
   */
  public async updateTagGroupSortOrder(groupId: string, newSortOrder: number): Promise<void> {
    const groups = await this.getTagGroups();
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.sortOrder = newSortOrder;
      await this.updateTagGroup(group);
    }
  }

  /**
   * 更新提示词块排序
   */
  public async updatePromptBlockSortOrder(promptId: string, newSortOrder: number): Promise<void> {
    const allImages = await this.getImages();
    for (const image of allImages) {
      const prompt = image.prompts.find(p => p.id === promptId);
      if (prompt) {
        prompt.sortOrder = newSortOrder;
        await this.updatePromptBlock(prompt);
        break;
      }
    }
  }
}

// 导出单例实例
export const dataService = DataService.getInstance();
