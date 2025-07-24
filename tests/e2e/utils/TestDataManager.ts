import { APIRequestContext } from '@playwright/test';

/**
 * 测试数据管理器
 * 负责创建、跟踪和清理测试数据
 */
export class TestDataManager {
  private testDataIds: {
    categories: string[];
    tags: string[];
    images: string[];
    prompts: string[];
  } = {
    categories: [],
    tags: [],
    images: [],
    prompts: []
  };

  constructor(private request: APIRequestContext) {}

  /**
   * 创建测试分类
   */
  async createTestCategory(data: {
    name: string;
    description: string;
    color: 'pink' | 'cyan' | 'yellow' | 'green' | 'purple';
  }) {
    // 添加随机后缀确保名称唯一性
    const uniqueName = `${data.name}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const response = await this.request.post('/api/tag-categories', {
      data: {
        ...data,
        name: uniqueName
      }
    });
    
    if (!response.ok()) {
      throw new Error(`创建测试分类失败: ${response.status()} ${await response.text()}`);
    }
    
    const result = await response.json();
    if (result.success && result.data?.id) {
      this.testDataIds.categories.push(result.data.id);
    }
    
    return result;
  }

  /**
   * 创建测试标签
   */
 async createTestTag(data: {
    name: string;
    categoryId: string;
    description?: string;
  }) {
    // 添加随机后缀确保名称唯一性
    const uniqueName = `${data.name}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const response = await this.request.post('/api/tags', {
      data: {
        ...data,
        name: uniqueName
      }
    });
    
    if (!response.ok()) {
      throw new Error(`创建测试标签失败: ${response.status()} ${await response.text()}`);
    }
    
    const result = await response.json();
    if (result.success && result.data?.id) {
      this.testDataIds.tags.push(result.data.id);
    }
    
    return result;
  }

  /**
   * 上传测试图片
   */
  async uploadTestImage(filePath: string, mimeType: string = 'image/png') {
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(filePath);
    
    const response = await this.request.post('/api/images/upload', {
      multipart: {
        imageFile: {
          name: 'test-image.png',
          mimeType,
          buffer: fileBuffer
        }
      }
    });
    
    if (!response.ok()) {
      throw new Error(`上传测试图片失败: ${response.status()} ${await response.text()}`);
    }
    
    const result = await response.json();
    if (result.success && result.data?.imageId) {
      this.testDataIds.images.push(result.data.imageId);
    }
    
    return result;
  }

  /**
   * 添加图片元数据
   */
  async addImageMetadata(imageId: string, data: {
    name: string;
    description?: string;
    tags?: Array<{
      isNew?: boolean;
      id?: string;
      name?: string;
      category?: {
        isNew?: boolean;
        id?: string;
        name?: string;
        description?: string;
        color?: string;
      };
    }>;
    promptBlocks?: Array<{
      content: string;
      color: 'pink' | 'cyan' | 'yellow' | 'green' | 'purple';
    }>;
  }) {
    const response = await this.request.post(`/api/images/${imageId}/metadata`, {
      data
    });
    
    if (!response.ok()) {
      throw new Error(`添加图片元数据失败: ${response.status()} ${await response.text()}`);
    }
    
    const result = await response.json();
    
    // 跟踪新创建的标签和分类
    if (result.success && result.data) {
      if (result.data.createdTags) {
        this.testDataIds.tags.push(...result.data.createdTags);
      }
      if (result.data.createdCategories) {
        this.testDataIds.categories.push(...result.data.createdCategories);
      }
    }
    
    return result;
  }

  /**
   * 更新图片信息
   */
  async updateImage(imageId: string, data: {
    name?: string;
    description?: string;
    tags?: string[];
  }) {
    const response = await this.request.patch(`/api/images/${imageId}`, {
      data
    });
    
    if (!response.ok()) {
      throw new Error(`更新图片失败: ${response.status()} ${await response.text()}`);
    }
    
    return await response.json();
  }

  /**
   * 更新图片提示词块
   */
  async updatePromptBlocks(imageId: string, blocks: Array<{
    id?: string;
    content: string;
    color: 'pink' | 'cyan' | 'yellow' | 'green' | 'purple';
    order: number;
  }>) {
    const response = await this.request.put(`/api/images/${imageId}/prompt-blocks`, {
      data: blocks
    });
    
    if (!response.ok()) {
      throw new Error(`更新提示词块失败: ${response.status()} ${await response.text()}`);
    }
    
    return await response.json();
  }

  /**
   * 获取创建的测试数据ID
   */
  getTestDataIds() {
    return { ...this.testDataIds };
  }

  /**
   * 清理所有测试数据
   */
  async cleanupTestData() {
    const errors: string[] = [];
    
    // 清理图片
    for (const imageId of this.testDataIds.images) {
      try {
        await this.request.delete(`/api/images/${imageId}`);
      } catch (error) {
        errors.push(`清理图片 ${imageId} 失败: ${error}`);
      }
    }
    
    // 清理标签
    for (const tagId of this.testDataIds.tags) {
      try {
        await this.request.delete(`/api/tags/${tagId}`);
      } catch (error) {
        errors.push(`清理标签 ${tagId} 失败: ${error}`);
      }
    }
    
    // 清理分类
    for (const categoryId of this.testDataIds.categories) {
      try {
        await this.request.delete(`/api/tag-categories/${categoryId}`);
      } catch (error) {
        errors.push(`清理分类 ${categoryId} 失败: ${error}`);
      }
    }
    
    // 重置跟踪数据
    this.testDataIds = {
      categories: [],
      tags: [],
      images: [],
      prompts: []
    };
    
    if (errors.length > 0) {
      console.warn('清理测试数据时出现错误:', errors);
    }
    
    return errors;
  }

  /**
   * 等待数据同步
   */
  async waitForDataSync(timeout: number = 1000) {
    await new Promise(resolve => setTimeout(resolve, timeout));
  }

  /**
   * 创建测试数据集
   */
  async createTestDataSet() {
    // 创建测试分类
    const category1 = await this.createTestCategory({
      name: '测试场景',
      description: '测试用场景分类',
      color: 'pink'
    });
    
    const category2 = await this.createTestCategory({
      name: '测试风格',
      description: '测试用风格分类',
      color: 'cyan'
    });
    
    // 创建测试标签
    const tag1 = await this.createTestTag({
      name: '测试花海',
      categoryId: category1.data.id
    });
    
    const tag2 = await this.createTestTag({
      name: '测试山水',
      categoryId: category1.data.id
    });
    
    const tag3 = await this.createTestTag({
      name: '测试写实',
      categoryId: category2.data.id
    });
    
    return {
      categories: [category1.data, category2.data],
      tags: [tag1.data, tag2.data, tag3.data]
    };
  }
}