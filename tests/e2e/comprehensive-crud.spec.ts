import { test, expect } from '@playwright/test';
import { TestDataManager } from './utils/TestDataManager';
import { ApiTestHelper } from './utils/ApiTestHelper';
import { TestImageGenerator } from './utils/TestImageGenerator';
import * as path from 'path';

/**
 * 综合CRUD测试套件
 * 测试图片上传、关联数据操作以及各类CRUD功能
 */
test.describe('综合CRUD功能测试', () => {
  let testDataManager: TestDataManager;
  let apiHelper: ApiTestHelper;
  let imageGenerator: TestImageGenerator;
  let testImages: any;

  // 测试数据存储
  let createdCategories: any[] = [];
  let createdTags: any[] = [];
  let createdImages: any[] = [];

  test.beforeAll(async () => {
    // 初始化测试工具
    imageGenerator = new TestImageGenerator(path.join(__dirname, 'fixtures'));
    
    // 创建测试图片文件
    testImages = imageGenerator.createStandardTestImages();
    
    console.log('测试环境初始化完成');
  });

  test.afterAll(async ({ request }) => {
    // 清理测试数据
    if (testDataManager) {
      await testDataManager.cleanupTestData();
    }
    
    // 清理测试文件
    imageGenerator.cleanupTestFiles();
    
    console.log('测试环境清理完成');
  });

  test.describe('标签分类CRUD测试', () => {
    test('创建标签分类 - 正常流程', async ({ request }) => {
      testDataManager = new TestDataManager(request);
      apiHelper = new ApiTestHelper(request);
      const testData = apiHelper.generateTestData();
      
      const result = await testDataManager.createTestCategory({
        name: testData.categoryName,
        description: testData.description,
        color: 'pink'
      });
      
      await apiHelper.expectSuccessResponse(result);
      expect(result.data.name).toBe(testData.categoryName);
      expect(result.data.color).toBe('pink');
      expect(result.data.isDefault).toBe(false);
      apiHelper.expectValidId(result.data.id);
      apiHelper.expectValidTimestamp(result.data.createdAt);
      
      createdCategories.push(result.data);
    });

    test('创建标签分类 - 验证错误处理', async ({ request }) => {
      // 测试缺少必填字段
      const response1 = await request.post('/api/tag-categories', {
        data: { description: '缺少名称' }
      });
      const result1 = await response1.json();
      await apiHelper.expectValidationError(result1, 'name');
      
      // 测试无效颜色
      const response2 = await request.post('/api/tag-categories', {
        data: {
          name: '测试分类',
          color: 'invalid_color'
        }
      });
      const result2 = await response2.json();
      await apiHelper.expectValidationError(result2, 'color');
      
      // 测试名称过长
      const response3 = await request.post('/api/tag-categories', {
        data: {
          name: 'a'.repeat(101),
          color: 'pink'
        }
      });
      const result3 = await response3.json();
      await apiHelper.expectValidationError(result3, 'name');
    });

    test('获取标签分类列表', async ({ request }) => {
      apiHelper = new ApiTestHelper(request);
      const result = await apiHelper.getAllCategories({ limit: 10, page: 1 });
      
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.meta.total).toBeGreaterThan(0);
      
      // 验证分类数据结构
      const category = result.data[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('color');
      expect(category).toHaveProperty('createdAt');
    });

    test('获取单个标签分类', async ({ request }) => {
      if (createdCategories.length === 0) {
        test.skip('没有可用的测试分类');
      }
      
      apiHelper = new ApiTestHelper(request);
      const categoryId = createdCategories[0].id;
      const result = await apiHelper.getCategory(categoryId);
      
      expect(result.data.id).toBe(categoryId);
      expect(result.data.name).toBeDefined();
      expect(result.data.color).toBeDefined();
    });

    test('更新标签分类', async ({ request }) => {
      if (createdCategories.length === 0) {
        test.skip('没有可用的测试分类');
      }
      
      const categoryId = createdCategories[0].id;
      const updateData = {
        name: '更新后的分类名称',
        description: '更新后的描述',
        color: 'cyan' as const
      };
      
      const response = await request.patch(`/api/tag-categories/${categoryId}`, {
        data: updateData
      });
      
      expect(response.ok()).toBe(true);
      const result = await response.json();
      
      await apiHelper.expectSuccessResponse(result);
      expect(result.data.name).toBe(updateData.name);
      expect(result.data.color).toBe(updateData.color);
      
      // 更新本地数据
      createdCategories[0] = { ...createdCategories[0], ...result.data };
    });

    test('删除标签分类 - 预览模式', async ({ request }) => {
      if (createdCategories.length === 0) {
        test.skip('没有可用的测试分类');
      }
      
      apiHelper = new ApiTestHelper(request);
      const categoryId = createdCategories[0].id;
      const result = await apiHelper.testDeletePreview('/api/tag-categories', categoryId);
      
      expect(result.data.canDelete).toBeDefined();
      expect(result.data.affectedTags).toBeDefined();
    });
  });

  test.describe('标签CRUD测试', () => {
    test('创建标签 - 正常流程', async ({ request }) => {
      if (createdCategories.length === 0) {
        test.skip('需要先创建分类');
      }
      
      if (!testDataManager) {
        testDataManager = new TestDataManager(request);
      }
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      const testData = apiHelper.generateTestData();
      const categoryId = createdCategories[0].id;
      
      const result = await testDataManager.createTestTag({
        name: testData.tagName,
        categoryId
      });
      
      await apiHelper.expectSuccessResponse(result);
      expect(result.data.name).toBe(testData.tagName);
      expect(result.data.categoryId).toBe(categoryId);
      apiHelper.expectValidId(result.data.id);
      
      createdTags.push(result.data);
    });

    test('创建标签 - 验证错误处理', async ({ request }) => {
      // 测试缺少分类ID
      const response1 = await request.post('/api/tags', {
        data: { name: '测试标签' }
      });
      const result1 = await response1.json();
      await apiHelper.expectValidationError(result1, 'categoryId');
      
      // 测试不存在的分类ID
      const response2 = await request.post('/api/tags', {
        data: {
          name: '测试标签',
          categoryId: 'non_existent_id'
        }
      });
      const result2 = await response2.json();
      await apiHelper.expectNotFoundError(result2);
    });

    test('创建重复名称标签 - 同分类冲突', async ({ request }) => {
      if (createdTags.length === 0) {
        test.skip('需要先创建标签');
      }
      
      const existingTag = createdTags[0];
      
      const response = await request.post('/api/tags', {
        data: {
          name: existingTag.name,
          categoryId: existingTag.categoryId
        }
      });
      
      const result = await response.json();
      await apiHelper.expectConflictError(result, 'name');
    });

    test('获取标签列表 - 全部标签', async ({ request }) => {
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      const result = await apiHelper.getAllTags({ limit: 20, page: 1 });
      
      expect(result.data.length).toBeGreaterThan(0);
      
      // 验证标签数据结构
      const tag = result.data[0];
      expect(tag).toHaveProperty('id');
      expect(tag).toHaveProperty('name');
      expect(tag).toHaveProperty('categoryId');
      expect(tag).toHaveProperty('category');
    });

    test('获取标签列表 - 按分类过滤', async ({ request }) => {
      if (createdCategories.length === 0) {
        test.skip('需要先创建分类');
      }
      
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      const categoryId = createdCategories[0].id;
      const result = await apiHelper.getAllTags({ categoryId, limit: 10 });
      
      // 验证所有返回的标签都属于指定分类
      result.data.forEach((tag: any) => {
        expect(tag.categoryId).toBe(categoryId);
      });
    });

    test('更新标签信息', async ({ request }) => {
      if (createdTags.length === 0) {
        test.skip('需要先创建标签');
      }
      
      const tagId = createdTags[0].id;
      const updateData = {
        name: '更新后的标签名称'
      };
      
      const response = await request.patch(`/api/tags/${tagId}`, {
        data: updateData
      });
      
      expect(response.ok()).toBe(true);
      const result = await response.json();
      
      await apiHelper.expectSuccessResponse(result);
      expect(result.data.name).toBe(updateData.name);
    });

    test('批量操作标签', async ({ request }) => {
      if (createdTags.length < 2) {
        test.skip('需要至少2个标签进行批量测试');
      }
      
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      const tagIds = createdTags.slice(0, 2).map(tag => tag.id);
      
      const result = await apiHelper.testBatchOperation(
        '/api/tags',
        'update',
        tagIds,
        { description: '批量更新的描述' }
      );
      
      expect(result.data.updatedCount).toBe(2);
    });
  });

  test.describe('图片上传测试', () => {
    test('上传PNG图片 - 正常流程', async ({ request }) => {
      if (!testDataManager) {
        testDataManager = new TestDataManager(request);
      }
      const result = await testDataManager.uploadTestImage(
        testImages.smallPng,
        'image/png'
      );
      
      await apiHelper.expectSuccessResponse(result);
      expect(result.data.imageId).toBeDefined();
      expect(result.data.url).toBeDefined();
      expect(result.data.storagePath).toBeDefined();
      
      createdImages.push(result.data);
    });

    test('上传JPEG图片 - 正常流程', async ({ request }) => {
      if (!testDataManager) {
        testDataManager = new TestDataManager(request);
      }
      const result = await testDataManager.uploadTestImage(
        testImages.mediumJpeg,
        'image/jpeg'
      );
      
      await apiHelper.expectSuccessResponse(result);
      createdImages.push(result.data);
    });

    test('上传WebP图片 - 正常流程', async ({ request }) => {
      if (!testDataManager) {
        testDataManager = new TestDataManager(request);
      }
      const result = await testDataManager.uploadTestImage(
        testImages.largeWebp,
        'image/webp'
      );
      
      await apiHelper.expectSuccessResponse(result);
      createdImages.push(result.data);
    });

    test('上传文件 - 大小限制测试', async ({ request }) => {
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(testImages.oversizedFile);
      
      const response = await request.post('/api/images/upload', {
        multipart: {
          imageFile: {
            name: 'oversize.png',
            mimeType: 'image/png',
            buffer: fileBuffer
          }
        }
      });
      
      const result = await response.json();
      await apiHelper.expectValidationError(result, 'imageFile', '文件大小');
    });

    test('上传文件 - 格式验证测试', async ({ request }) => {
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(testImages.invalidFormat);
      
      const response = await request.post('/api/images/upload', {
        multipart: {
          imageFile: {
            name: 'invalid.png',
            mimeType: 'image/png',
            buffer: fileBuffer
          }
        }
      });
      
      const result = await response.json();
      await apiHelper.expectValidationError(result, 'imageFile', '格式');
    });
  });

  test.describe('图片元数据管理测试', () => {
    test('添加图片元数据 - 完整信息', async ({ request }) => {
      if (createdImages.length === 0 || createdTags.length === 0) {
        test.skip('需要先上传图片和创建标签');
      }
      
      if (!testDataManager) {
        testDataManager = new TestDataManager(request);
      }
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      const imageId = createdImages[0].imageId;
      const testData = apiHelper.generateTestData();
      
      const metadataResult = await testDataManager.addImageMetadata(imageId, {
        name: testData.imageName,
        description: testData.description,
        tags: [
          {
            isNew: false,
            id: createdTags[0].id
          },
          {
            isNew: true,
            name: '新建标签测试',
            category: {
              isNew: false,
              id: createdCategories[0].id
            }
          }
        ],
        promptBlocks: [
          {
            content: testData.promptContent,
            color: 'pink'
          },
          {
            content: '第二个提示词块',
            color: 'cyan'
          }
        ]
      });
      
      await apiHelper.expectSuccessResponse(metadataResult);
      expect(metadataResult.data.name).toBe(testData.imageName);
      expect(metadataResult.data.createdTags).toBeDefined();
    });

    test('添加图片元数据 - 创建新分类和标签', async ({ request }) => {
      if (createdImages.length < 2) {
        test.skip('需要至少2张图片');
      }
      
      if (!testDataManager) {
        testDataManager = new TestDataManager(request);
      }
      const imageId = createdImages[1].imageId;
      
      const metadataResult = await testDataManager.addImageMetadata(imageId, {
        name: '测试新分类标签',
        tags: [
          {
            isNew: true,
            name: '全新标签',
            category: {
              isNew: true,
              name: '全新分类',
              description: '自动创建的分类',
              color: 'green'
            }
          }
        ]
      });
      
      await apiHelper.expectSuccessResponse(metadataResult);
      expect(metadataResult.data.createdTags).toBeDefined();
      expect(metadataResult.data.createdCategories).toBeDefined();
    });

    test('更新图片信息', async ({ request }) => {
      if (createdImages.length === 0) {
        test.skip('需要先上传图片');
      }
      
      if (!testDataManager) {
        testDataManager = new TestDataManager(request);
      }
      const imageId = createdImages[0].imageId;
      const updateData = {
        name: '更新后的图片名称',
        description: '更新后的图片描述'
      };
      
      const result = await testDataManager.updateImage(imageId, updateData);
      
      await apiHelper.expectSuccessResponse(result);
      expect(result.data.name).toBe(updateData.name);
    });

    test('获取图片详情', async ({ request }) => {
      if (createdImages.length === 0) {
        test.skip('需要先上传图片');
      }
      
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      const imageId = createdImages[0].imageId;
      const result = await apiHelper.getImage(imageId);
      
      expect(result.data.id).toBe(imageId);
      expect(result.data.name).toBeDefined();
      expect(result.data.url).toBeDefined();
      expect(result.data.tags).toBeDefined();
      expect(result.data.promptBlocks).toBeDefined();
    });
  });

  test.describe('提示词块管理测试', () => {
    test('更新提示词块 - 完整操作', async ({ request }) => {
      if (createdImages.length === 0) {
        test.skip('需要先上传图片');
      }
      
      if (!testDataManager) {
        testDataManager = new TestDataManager(request);
      }
      const imageId = createdImages[0].imageId;
      const promptBlocks = [
        {
          content: '更新后的第一个提示词',
          color: 'purple' as const,
          order: 1
        },
        {
          content: '更新后的第二个提示词',
          color: 'yellow' as const,
          order: 2
        },
        {
          content: '新增的第三个提示词',
          color: 'green' as const,
          order: 3
        }
      ];
      
      const result = await testDataManager.updatePromptBlocks(imageId, promptBlocks);
      
      await apiHelper.expectSuccessResponse(result);
      expect(result.data.promptBlocks).toHaveLength(3);
      
      // 验证顺序和内容
      const blocks = result.data.promptBlocks;
      expect(blocks[0].order).toBe(1);
      expect(blocks[1].order).toBe(2);
      expect(blocks[2].order).toBe(3);
    });

    test('提示词块验证 - 颜色枚举', async ({ request }) => {
      if (createdImages.length === 0) {
        test.skip('需要先上传图片');
      }
      
      const imageId = createdImages[0].imageId;
      
      const response = await request.put(`/api/images/${imageId}/prompt-blocks`, {
        data: [
          {
            content: '测试无效颜色',
            color: 'invalid_color',
            order: 1
          }
        ]
      });
      
      const result = await response.json();
      await apiHelper.expectValidationError(result, 'color');
    });

    test('提示词块验证 - 内容长度', async ({ request }) => {
      if (createdImages.length === 0) {
        test.skip('需要先上传图片');
      }
      
      const imageId = createdImages[0].imageId;
      
      const response = await request.put(`/api/images/${imageId}/prompt-blocks`, {
        data: [
          {
            content: 'a'.repeat(201), // 超过200字符限制
            color: 'pink',
            order: 1
          }
        ]
      });
      
      const result = await response.json();
      await apiHelper.expectValidationError(result, 'content');
    });
  });

  test.describe('数据一致性和关联测试', () => {
    test('验证标签-分类关联一致性', async ({ request }) => {
      if (createdTags.length === 0) {
        test.skip('需要先创建标签');
      }
      
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      const tag = createdTags[0];
      const tagResult = await apiHelper.getTag(tag.id);
      const categoryResult = await apiHelper.getCategory(tag.categoryId);
      
      expect(tagResult.data.categoryId).toBe(categoryResult.data.id);
      expect(tagResult.data.category.id).toBe(categoryResult.data.id);
      expect(tagResult.data.category.name).toBe(categoryResult.data.name);
    });

    test('验证图片-标签关联一致性', async ({ request }) => {
      if (createdImages.length === 0) {
        test.skip('需要先上传图片');
      }
      
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      const imageId = createdImages[0].imageId;
      const imageResult = await apiHelper.getImage(imageId);
      
      // 验证图片的标签信息完整性
      if (imageResult.data.tags && imageResult.data.tags.length > 0) {
        for (const tag of imageResult.data.tags) {
          expect(tag.id).toBeDefined();
          expect(tag.name).toBeDefined();
          expect(tag.category).toBeDefined();
          expect(tag.category.id).toBeDefined();
          expect(tag.category.name).toBeDefined();
        }
      }
    });

    test('测试级联删除影响', async ({ request }) => {
      if (createdCategories.length === 0) {
        test.skip('需要先创建分类');
      }
      
      if (!testDataManager) {
        testDataManager = new TestDataManager(request);
      }
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      // 创建一个专门用于删除测试的分类
      const testCategory = await testDataManager.createTestCategory({
        name: '待删除测试分类',
        color: 'purple'
      });
      
      // 在该分类下创建标签
      const testTag = await testDataManager.createTestTag({
        name: '待删除测试标签',
        categoryId: testCategory.data.id
      });
      
      // 测试删除预览
      const previewResult = await apiHelper.testDeletePreview(
        '/api/tag-categories',
        testCategory.data.id
      );
      
      expect(previewResult.data.affectedTags).toBeGreaterThan(0);
      expect(previewResult.data.targetCategory).toBeDefined();
    });
  });

  test.describe('性能和边界测试', () => {
    test('分页参数边界测试', async ({ request }) => {
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      // 测试最小分页参数
      const result1 = await apiHelper.getAllCategories({ limit: 1, page: 1 });
      expect(result1.data.length).toBeLessThanOrEqual(1);
      
      // 测试大分页参数
      const result2 = await apiHelper.getAllCategories({ limit: 100, page: 1 });
      expect(result2.data.length).toBeLessThanOrEqual(100);
    });

    test('并发操作测试', async ({ request }) => {
      if (!testDataManager) {
        testDataManager = new TestDataManager(request);
      }
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      const testData = apiHelper.generateTestData();
      
      // 并发创建多个分类
      const promises = Array.from({ length: 3 }, (_, i) => 
        testDataManager.createTestCategory({
          name: `${testData.categoryName}_${i}`,
          color: testData.colors[i % testData.colors.length]
        })
      );
      
      const results = await Promise.all(promises);
      
      // 验证所有操作都成功
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data.id).toBeDefined();
      });
    });

    test('数据完整性验证', async ({ request }) => {
      if (!apiHelper) {
        apiHelper = new ApiTestHelper(request);
      }
      // 获取所有创建的数据
      const categoriesResult = await apiHelper.getAllCategories();
      const tagsResult = await apiHelper.getAllTags();
      const imagesResult = await apiHelper.getAllImages();
      
      // 验证数据结构完整性
      categoriesResult.data.forEach((category: any) => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.color).toBeDefined();
        expect(['pink', 'cyan', 'yellow', 'green', 'purple']).toContain(category.color);
      });
      
      tagsResult.data.forEach((tag: any) => {
        expect(tag.id).toBeDefined();
        expect(tag.name).toBeDefined();
        expect(tag.categoryId).toBeDefined();
        expect(tag.category).toBeDefined();
      });
      
      imagesResult.data.forEach((image: any) => {
        expect(image.id).toBeDefined();
        expect(image.url).toBeDefined();
        expect(image.status).toBeDefined();
      });
    });
  });
});