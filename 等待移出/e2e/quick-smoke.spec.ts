import { test, expect } from '@playwright/test';
import { TestDataManager } from './utils/TestDataManager';
import { ApiTestHelper } from './utils/ApiTestHelper';
import { TestImageGenerator } from './utils/TestImageGenerator';
import { SEED_CATEGORIES, SEED_TAGS } from './fixtures/test-data-seeds';
import * as path from 'path';

/**
 * 快速冒烟测试套件
 * 验证核心功能是否正常工作
 */
test.describe('快速冒烟测试', () => {
  let imageGenerator: TestImageGenerator;
  
  // 测试数据
  let testCategory: any;
  let testTag: any;
  let testImage: any;
  let testDataManager: TestDataManager;

  test.beforeAll(async () => {
    imageGenerator = new TestImageGenerator(path.join(__dirname, 'fixtures'));
    console.log('快速测试环境初始化完成');
  });

  test.afterAll(async ({ request }) => {
    if (testDataManager) {
      await testDataManager.cleanupTestData();
    }
    imageGenerator.cleanupTestFiles();
    console.log('快速测试环境清理完成');
  });

  test('创建分类 -> 创建标签 -> 上传图片 -> 添加元数据', async ({ request }) => {
    testDataManager = new TestDataManager(request);
    const apiHelper = new ApiTestHelper(request);
    // 1. 创建测试分类
    console.log('步骤1: 创建测试分类');
    const categoryResult = await testDataManager.createTestCategory({
      name: '快速测试分类',
      description: '用于快速测试的分类',
      color: 'pink'
    });
    
    await apiHelper.expectSuccessResponse(categoryResult);
    testCategory = categoryResult.data;
    console.log(`分类创建成功: ${testCategory.name} (ID: ${testCategory.id})`);
    
    // 2. 创建测试标签
    console.log('步骤2: 创建测试标签');
    const tagResult = await testDataManager.createTestTag({
      name: '快速测试标签',
      categoryId: testCategory.id
    });
    
    await apiHelper.expectSuccessResponse(tagResult);
    testTag = tagResult.data;
    console.log(`标签创建成功: ${testTag.name} (ID: ${testTag.id})`);
    
    // 3. 生成并上传测试图片
    console.log('步骤3: 生成并上传测试图片');
    const testImages = imageGenerator.createStandardTestImages();
    
    const uploadResult = await testDataManager.uploadTestImage(
      testImages.smallPng,
      'image/png'
    );
    
    await apiHelper.expectSuccessResponse(uploadResult);
    testImage = uploadResult.data;
    console.log(`图片上传成功: ${testImage.imageId}`);
    
    // 4. 添加图片元数据
    console.log('步骤4: 添加图片元数据');
    const metadataResult = await testDataManager.addImageMetadata(testImage.imageId, {
      name: '快速测试图片',
      description: '这是一个快速测试图片',
      tags: [
        {
          isNew: false,
          id: testTag.id
        },
        {
          isNew: true,
          name: '新建测试标签',
          category: {
            isNew: false,
            id: testCategory.id
          }
        }
      ],
      promptBlocks: [
        {
          content: '快速测试提示词',
          color: 'pink'
        },
        {
          content: '第二个测试提示词',
          color: 'cyan'
        }
      ]
    });
    
    await apiHelper.expectSuccessResponse(metadataResult);
    console.log('图片元数据添加成功');
    
    // 5. 验证数据完整性
    console.log('步骤5: 验证数据完整性');
    const imageDetails = await apiHelper.getImage(testImage.imageId);
    
    expect(imageDetails.data.name).toBe('快速测试图片');
    expect(imageDetails.data.tags).toHaveLength(2);
    expect(imageDetails.data.promptBlocks).toHaveLength(2);
    
    console.log('快速冒烟测试完成 ✅');
  });

  test('验证API响应格式', async ({ request }) => {
    const apiHelper = new ApiTestHelper(request);
    // 测试分类列表API
    const categoriesResult = await apiHelper.getAllCategories({ limit: 5 });
    
    expect(categoriesResult).toHaveProperty('data');
    expect(categoriesResult).toHaveProperty('meta');
    expect(Array.isArray(categoriesResult.data)).toBe(true);
    expect(categoriesResult.meta).toHaveProperty('total');
    expect(categoriesResult.meta).toHaveProperty('page');
    expect(categoriesResult.meta).toHaveProperty('limit');
    
    // 测试标签列表API
    const tagsResult = await apiHelper.getAllTags({ limit: 5 });
    
    expect(tagsResult).toHaveProperty('data');
    expect(tagsResult).toHaveProperty('meta');
    expect(Array.isArray(tagsResult.data)).toBe(true);
    
    // 测试图片列表API
    const imagesResult = await apiHelper.getAllImages({ limit: 5 });
    
    expect(imagesResult).toHaveProperty('data');
    expect(imagesResult).toHaveProperty('meta');
    expect(Array.isArray(imagesResult.data)).toBe(true);
    
    console.log('API响应格式验证通过 ✅');
  });

  test('验证错误处理', async ({ request }) => {
    // 测试创建分类时的验证错误
    const invalidCategoryResponse = await request.post('/api/tag-categories', {
      data: {
        // 缺少必填字段 name
        description: '缺少名称的分类',
        color: 'pink'
      }
    });
    
    expect(invalidCategoryResponse.ok()).toBe(false);
    const invalidCategoryResult = await invalidCategoryResponse.json();
    expect(invalidCategoryResult.success).toBe(false);
    expect(invalidCategoryResult.error).toBeDefined();
    
    // 测试获取不存在的资源
    const notFoundResponse = await request.get('/api/tag-categories/non_existent_id');
    expect(notFoundResponse.ok()).toBe(false);
    
    // 测试无效的文件上传
    const invalidUploadResponse = await request.post('/api/images/upload', {
      multipart: {
        imageFile: {
          name: 'invalid.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('This is not an image')
        }
      }
    });
    
    expect(invalidUploadResponse.ok()).toBe(false);
    
    console.log('错误处理验证通过 ✅');
  });

  test('验证数据关联一致性', async ({ request }) => {
    const apiHelper = new ApiTestHelper(request);
    if (!testCategory || !testTag || !testImage) {
      test.skip('需要先执行主要测试流程');
    }
    
    // 获取标签详情，验证与分类的关联
    const tagDetails = await apiHelper.getTag(testTag.id);
    expect(tagDetails.data.categoryId).toBe(testCategory.id);
    expect(tagDetails.data.category.id).toBe(testCategory.id);
    expect(tagDetails.data.category.name).toBe(testCategory.name);
    
    // 获取图片详情，验证标签关联
    const imageDetails = await apiHelper.getImage(testImage.imageId);
    const associatedTags = imageDetails.data.tags;
    
    expect(associatedTags.length).toBeGreaterThan(0);
    
    // 验证每个关联的标签都有完整的分类信息
    associatedTags.forEach((tag: any) => {
      expect(tag.id).toBeDefined();
      expect(tag.name).toBeDefined();
      expect(tag.category).toBeDefined();
      expect(tag.category.id).toBeDefined();
      expect(tag.category.name).toBeDefined();
    });
    
    console.log('数据关联一致性验证通过 ✅');
  });

  test('验证基本CRUD操作', async ({ request }) => {
    const localTestDataManager = new TestDataManager(request);
    const apiHelper = new ApiTestHelper(request);
    const testData = apiHelper.generateTestData();
    
    // 创建 -> 读取 -> 更新 -> 删除 (分类)
    console.log('测试分类CRUD操作');
    
    // 创建
    const createResult = await localTestDataManager.createTestCategory({
      name: testData.categoryName,
      description: testData.description,
      color: 'green'
    });
    await apiHelper.expectSuccessResponse(createResult);
    const categoryId = createResult.data.id;
    
    // 读取
    const readResult = await apiHelper.getCategory(categoryId);
    expect(readResult.data.name).toBe(createResult.data.name); // 使用实际创建的名称
    
    // 更新
    const updateResponse = await request.patch(`/api/tag-categories/${categoryId}`, {
      data: {
        name: '更新后的名称',
        color: 'purple'
      }
    });
    expect(updateResponse.ok()).toBe(true);
    const updateResult = await updateResponse.json();
    expect(updateResult.data.name).toBe('更新后的名称');
    
    // 删除预览
    const deletePreviewResult = await apiHelper.testDeletePreview('/api/tag-categories', categoryId);
    expect(deletePreviewResult.data.canDelete).toBeDefined();
    
    console.log('基本CRUD操作验证通过 ✅');
  });

  test('验证文件上传功能', async ({ request }) => {
    const localTestDataManager = new TestDataManager(request);
    console.log('测试多种格式文件上传');
    
    const testImages = imageGenerator.createStandardTestImages();
    
    // 测试PNG上传
     const pngResult = await localTestDataManager.uploadTestImage(testImages.smallPng, 'image/png');
     const apiHelper = new ApiTestHelper(request);
     await apiHelper.expectSuccessResponse(pngResult);
    expect(pngResult.data.imageId).toBeDefined();
    
    // 测试JPEG上传
    const jpegResult = await localTestDataManager.uploadTestImage(testImages.mediumJpeg, 'image/jpeg');
    await apiHelper.expectSuccessResponse(jpegResult);
    expect(jpegResult.data.imageId).toBeDefined();
    
    // 测试WebP上传
    const webpResult = await localTestDataManager.uploadTestImage(testImages.largeWebp, 'image/webp');
    await apiHelper.expectSuccessResponse(webpResult);
    expect(webpResult.data.imageId).toBeDefined();
    
    console.log('文件上传功能验证通过 ✅');
  });

  test('验证分页功能', async ({ request }) => {
    const apiHelper = new ApiTestHelper(request);
    console.log('测试分页功能');
    
    // 测试分类分页
    const page1 = await apiHelper.getAllCategories({ limit: 2, page: 1 });
    const page2 = await apiHelper.getAllCategories({ limit: 2, page: 2 });
    
    expect(page1.data.length).toBeLessThanOrEqual(2);
    expect(page2.data.length).toBeLessThanOrEqual(2);
    expect(page1.meta.page).toBe(1);
    expect(page2.meta.page).toBe(2);
    
    // 如果有足够的数据，验证分页数据不重复
    if (page1.data.length > 0 && page2.data.length > 0) {
      const page1Ids = page1.data.map((item: any) => item.id);
      const page2Ids = page2.data.map((item: any) => item.id);
      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));
      expect(intersection.length).toBe(0);
    }
    
    console.log('分页功能验证通过 ✅');
  });
});