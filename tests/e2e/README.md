# E2E 测试套件

这是一个全面的端到端测试套件，用于测试图片上传、数据关联和CRUD操作功能。

## 📁 目录结构

```
tests/e2e/
├── comprehensive-crud.spec.ts    # 完整的CRUD功能测试
├── quick-smoke.spec.ts           # 快速冒烟测试
├── run-tests.sh                  # 测试运行脚本
├── utils/                        # 测试工具类
│   ├── TestDataManager.ts        # 测试数据管理器
│   ├── ApiTestHelper.ts          # API测试辅助工具
│   └── TestImageGenerator.ts     # 测试图片生成器
└── fixtures/                     # 测试数据和配置
    ├── test-config.ts            # 测试配置
    └── test-data-seeds.ts        # 测试数据种子
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 运行测试

#### 快速冒烟测试（推荐）
```bash
./tests/e2e/run-tests.sh -s
```

#### 完整综合测试
```bash
./tests/e2e/run-tests.sh -f
```

#### 运行所有测试
```bash
./tests/e2e/run-tests.sh -a
```

## 📋 测试脚本选项

### 基本选项

| 选项 | 描述 |
|------|------|
| `-s, --smoke` | 运行快速冒烟测试 |
| `-f, --full` | 运行完整的综合测试 |
| `-a, --all` | 运行所有测试 |
| `-h, --help` | 显示帮助信息 |

### 高级选项

| 选项 | 描述 |
|------|------|
| `-d, --debug` | 启用调试模式 |
| `-v, --verbose` | 启用详细输出 |
| `-k, --keep-data` | 保留测试数据（用于调试） |
| `-p, --parallel` | 并行运行测试 |
| `-r, --report` | 生成HTML报告 |
| `-c, --clean` | 清理测试环境 |

### 使用示例

```bash
# 运行快速测试并生成报告
./tests/e2e/run-tests.sh -s -r

# 运行完整测试，启用调试和详细输出
./tests/e2e/run-tests.sh -f -d -v

# 并行运行所有测试并生成报告
./tests/e2e/run-tests.sh -a -p -r

# 清理测试环境
./tests/e2e/run-tests.sh -c
```

## 🧪 测试内容

### 快速冒烟测试 (`quick-smoke.spec.ts`)

- ✅ 基本CRUD操作流程
- ✅ API响应格式验证
- ✅ 错误处理验证
- ✅ 数据关联一致性
- ✅ 文件上传功能
- ✅ 分页功能

**预计运行时间**: 2-3分钟

### 完整综合测试 (`comprehensive-crud.spec.ts`)

#### 标签分类CRUD测试
- 创建、读取、更新、删除分类
- 验证错误处理和边界条件
- 测试分类列表和分页

#### 标签CRUD测试
- 创建、读取、更新标签
- 测试标签与分类的关联
- 批量操作测试
- 重复名称冲突处理

#### 图片上传测试
- 支持PNG、JPEG、WebP格式
- 文件大小限制验证
- 无效格式处理
- 上传响应验证

#### 图片元数据管理
- 添加完整图片信息
- 自动创建新标签和分类
- 更新图片信息
- 获取图片详情

#### 提示词块管理
- 创建和更新提示词块
- 颜色枚举验证
- 内容长度限制
- 顺序管理

#### 数据一致性测试
- 标签-分类关联验证
- 图片-标签关联验证
- 级联删除影响测试

#### 性能和边界测试
- 分页参数边界
- 并发操作测试
- 数据完整性验证

**预计运行时间**: 8-12分钟

## 🛠️ 工具类说明

### TestDataManager

负责管理测试数据的生命周期：

```typescript
// 创建测试分类
const category = await testDataManager.createTestCategory({
  name: '测试分类',
  color: 'pink'
});

// 上传测试图片
const image = await testDataManager.uploadTestImage(
  imagePath, 
  'image/png'
);

// 清理测试数据
await testDataManager.cleanupTestData();
```

### ApiTestHelper

提供API测试的辅助方法：

```typescript
// 验证成功响应
await apiHelper.expectSuccessResponse(result);

// 验证错误响应
await apiHelper.expectValidationError(result, 'fieldName');

// 获取所有分类
const categories = await apiHelper.getAllCategories();
```

### TestImageGenerator

生成各种测试图片：

```typescript
// 创建标准测试图片集
const images = imageGenerator.createStandardTestImages();

// 生成大文件用于测试限制
const largeFile = imageGenerator.createLargeFile();
```

## 🔧 配置

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `API_BASE_URL` | API基础URL | `http://localhost:3000` |
| `TEST_VERBOSE` | 启用详细日志 | `false` |
| `KEEP_TEST_DATA` | 保留测试数据 | `false` |
| `SKIP_CLEANUP` | 跳过清理步骤 | `false` |

### 测试配置 (`test-config.ts`)

```typescript
export const TEST_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_FORMATS: ['image/png', 'image/jpeg', 'image/webp'],
  DEFAULT_PAGE_SIZE: 20,
  API_TIMEOUT: 10000
};
```

## 📊 测试报告

### 生成HTML报告

```bash
./tests/e2e/run-tests.sh -s -r
```

报告将生成在 `playwright-report/` 目录中，包含：

- 测试执行结果
- 失败截图
- 执行时间统计
- 错误详情

### 查看报告

```bash
npx playwright show-report
```

## 🐛 调试

### 启用调试模式

```bash
./tests/e2e/run-tests.sh -s -d
```

调试模式将：
- 启用浏览器可视化
- 显示详细的执行步骤
- 在失败时暂停执行

### 保留测试数据

```bash
./tests/e2e/run-tests.sh -s -k
```

这将保留测试过程中创建的数据，便于手动检查。

### 查看详细日志

```bash
./tests/e2e/run-tests.sh -s -v
```

## 🔍 故障排除

### 常见问题

#### 1. 测试超时

**原因**: 服务器响应慢或网络问题

**解决方案**:
```bash
# 增加超时时间
export API_TIMEOUT=30000
./tests/e2e/run-tests.sh -s
```

#### 2. 文件权限错误

**原因**: 测试脚本没有执行权限

**解决方案**:
```bash
chmod +x tests/e2e/run-tests.sh
```

#### 3. 依赖缺失

**原因**: 未安装Playwright或其他依赖

**解决方案**:
```bash
npm install
npx playwright install
```

#### 4. 端口冲突

**原因**: 3000端口被占用

**解决方案**:
```bash
# 使用不同端口
export API_BASE_URL=http://localhost:3001
npm run dev -- -p 3001
```

### 清理测试环境

如果测试环境出现问题，可以完全清理：

```bash
# 清理测试文件和报告
./tests/e2e/run-tests.sh -c

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
npx playwright install
```

## 📈 性能基准

### 预期执行时间

| 测试类型 | 执行时间 | 测试数量 |
|----------|----------|----------|
| 快速冒烟测试 | 2-3分钟 | ~15个测试 |
| 完整综合测试 | 8-12分钟 | ~50个测试 |
| 所有测试 | 10-15分钟 | ~65个测试 |

### 性能阈值

- API响应时间: < 500ms (正常)
- 文件上传: < 2s (10MB以下)
- 数据库操作: < 100ms (单次)

## 🤝 贡献指南

### 添加新测试

1. 在相应的测试文件中添加测试用例
2. 使用现有的工具类和配置
3. 确保测试具有适当的清理逻辑
4. 添加必要的文档说明

### 修改工具类

1. 保持向后兼容性
2. 添加适当的错误处理
3. 更新相关文档
4. 运行所有测试确保无破坏性变更

## 📝 更新日志

### v1.0.0 (2024-12-19)

- ✨ 初始版本发布
- ✅ 完整的CRUD测试套件
- ✅ 快速冒烟测试
- ✅ 测试工具类和配置
- ✅ 自动化测试脚本
- ✅ 详细的文档说明

---

## 📞 支持

如果在使用过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查测试日志和报告
3. 确认环境配置正确
4. 联系开发团队获取支持

**祝测试愉快！** 🎉