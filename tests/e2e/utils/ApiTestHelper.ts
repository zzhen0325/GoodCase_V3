import { APIRequestContext, expect } from '@playwright/test';

/**
 * API测试辅助类
 * 提供通用的API测试方法和断言
 */
export class ApiTestHelper {
  constructor(private request: APIRequestContext) {}

  /**
   * 验证成功响应格式
   */
  async expectSuccessResponse(response: any, expectedData?: any) {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    
    if (expectedData) {
      expect(response.data).toMatchObject(expectedData);
    }
  }

  /**
   * 验证错误响应格式
   */
  async expectErrorResponse(response: any, expectedCode?: string, expectedMessage?: string) {
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error.code).toBeDefined();
    expect(response.error.message).toBeDefined();
    
    if (expectedCode) {
      expect(response.error.code).toBe(expectedCode);
    }
    
    if (expectedMessage) {
      expect(response.error.message).toContain(expectedMessage);
    }
  }

  /**
   * 验证分页响应格式
   */
  async expectPaginatedResponse(response: any, expectedTotal?: number) {
    expect(response.success).toBe(true);
    expect(response.data).toBeInstanceOf(Array);
    expect(response.meta).toBeDefined();
    expect(response.meta.page).toBeGreaterThan(0);
    expect(response.meta.limit).toBeGreaterThan(0);
    expect(response.meta.total).toBeGreaterThanOrEqual(0);
    
    if (expectedTotal !== undefined) {
      expect(response.meta.total).toBe(expectedTotal);
    }
  }

  /**
   * 获取所有分类
   */
  async getAllCategories(params?: { limit?: number; page?: number }) {
    const url = new URL('/api/tag-categories', 'http://localhost:3000');
    if (params?.limit) url.searchParams.set('limit', params.limit.toString());
    if (params?.page) url.searchParams.set('page', params.page.toString());
    
    const response = await this.request.get(url.toString());
    expect(response.ok()).toBe(true);
    
    const result = await response.json();
    await this.expectPaginatedResponse(result);
    
    return result;
  }

  /**
   * 获取单个分类
   */
  async getCategory(categoryId: string) {
    const response = await this.request.get(`/api/tag-categories/${categoryId}`);
    expect(response.ok()).toBe(true);
    
    const result = await response.json();
    await this.expectSuccessResponse(result);
    
    return result;
  }

  /**
   * 获取所有标签
   */
  async getAllTags(params?: { categoryId?: string; limit?: number; page?: number }) {
    const url = new URL('/api/tags', 'http://localhost:3000');
    if (params?.categoryId) url.searchParams.set('categoryId', params.categoryId);
    if (params?.limit) url.searchParams.set('limit', params.limit.toString());
    if (params?.page) url.searchParams.set('page', params.page.toString());
    
    const response = await this.request.get(url.toString());
    expect(response.ok()).toBe(true);
    
    const result = await response.json();
    await this.expectPaginatedResponse(result);
    
    return result;
  }

  /**
   * 获取单个标签
   */
  async getTag(tagId: string) {
    const response = await this.request.get(`/api/tags/${tagId}`);
    expect(response.ok()).toBe(true);
    
    const result = await response.json();
    await this.expectSuccessResponse(result);
    
    return result;
  }

  /**
   * 获取所有图片
   */
  async getAllImages(params?: { limit?: number; page?: number; tags?: string[] }) {
    const url = new URL('/api/images', 'http://localhost:3000');
    if (params?.limit) url.searchParams.set('limit', params.limit.toString());
    if (params?.page) url.searchParams.set('page', params.page.toString());
    if (params?.tags) {
      params.tags.forEach(tag => url.searchParams.append('tags', tag));
    }
    
    const response = await this.request.get(url.toString());
    expect(response.ok()).toBe(true);
    
    const result = await response.json();
    await this.expectPaginatedResponse(result);
    
    return result;
  }

  /**
   * 获取单个图片
   */
  async getImage(imageId: string) {
    const response = await this.request.get(`/api/images/${imageId}`);
    expect(response.ok()).toBe(true);
    
    const result = await response.json();
    await this.expectSuccessResponse(result);
    
    return result;
  }

  /**
   * 测试删除预览
   */
  async testDeletePreview(endpoint: string, id: string) {
    const response = await this.request.delete(`${endpoint}/${id}?preview=true`);
    expect(response.ok()).toBe(true);
    
    const result = await response.json();
    await this.expectSuccessResponse(result);
    expect(result.data.canDelete).toBeDefined();
    
    return result;
  }

  /**
   * 测试批量操作
   */
  async testBatchOperation(endpoint: string, operation: string, ids: string[], updates?: any) {
    const data: any = {
      operation,
      [`${endpoint.split('/').pop()}Ids`]: ids
    };
    
    if (updates) {
      data.updates = updates;
    }
    
    const response = await this.request.patch(`${endpoint}/batch`, { data });
    expect(response.ok()).toBe(true);
    
    const result = await response.json();
    await this.expectSuccessResponse(result);
    
    return result;
  }

  /**
   * 验证字段验证错误
   */
  async expectValidationError(response: any, field: string, message?: string) {
    await this.expectErrorResponse(response, 'VALIDATION_ERROR');
    expect(response.error.details).toBeDefined();
    expect(response.error.details.errors).toBeInstanceOf(Array);
    
    const fieldError = response.error.details.errors.find((err: any) => err.field === field);
    expect(fieldError).toBeDefined();
    
    if (message) {
      expect(fieldError.message).toContain(message);
    }
  }

  /**
   * 验证资源冲突错误
   */
  async expectConflictError(response: any, field?: string) {
    await this.expectErrorResponse(response, 'RESOURCE_CONFLICT');
    
    if (field) {
      expect(response.error.details.field).toBe(field);
    }
  }

  /**
   * 验证资源未找到错误
   */
  async expectNotFoundError(response: any) {
    await this.expectErrorResponse(response, 'RESOURCE_NOT_FOUND');
  }

  /**
   * 验证操作不允许错误
   */
  async expectOperationNotAllowedError(response: any, message?: string) {
    await this.expectErrorResponse(response, 'OPERATION_NOT_ALLOWED', message);
  }

  /**
   * 创建测试图片文件
   */
  createTestImageBuffer(width: number = 100, height: number = 100): Buffer {
    // 创建一个简单的PNG图片数据
    const canvas = require('canvas');
    const canvasInstance = canvas.createCanvas(width, height);
    const ctx = canvasInstance.getContext('2d');
    
    // 绘制一个简单的测试图案
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.fillText('TEST', 10, 30);
    
    return canvasInstance.toBuffer('image/png');
  }

  /**
   * 生成随机测试数据
   */
  generateTestData() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    return {
      categoryName: `测试分类_${timestamp}_${random}`,
      tagName: `测试标签_${timestamp}_${random}`,
      imageName: `测试图片_${timestamp}_${random}`,
      description: `这是一个测试描述_${timestamp}`,
      promptContent: `测试提示词内容_${timestamp}`,
      colors: ['pink', 'cyan', 'yellow', 'green', 'purple'] as const
    };
  }

  /**
   * 等待异步操作完成
   */
  async waitForOperation(timeout: number = 2000) {
    await new Promise(resolve => setTimeout(resolve, timeout));
  }

  /**
   * 验证时间戳格式
   */
  expectValidTimestamp(timestamp: string) {
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(new Date(timestamp).getTime()).toBeGreaterThan(0);
  }

  /**
   * 验证ID格式
   */
  expectValidId(id: string) {
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  }
}