import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件 - 端到端测试
 * 支持图片管理、关联数据CRUD、数据关联和一致性测试
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* 并行运行测试 */
  fullyParallel: true,
  /* 在CI中禁用test.only */
  forbidOnly: !!process.env.CI,
  /* 重试次数 */
  retries: process.env.CI ? 2 : 0,
  /* 并行worker数量 */
  workers: process.env.CI ? 1 : 2,
  /* 测试超时 */
  timeout: 60000,

  /* 测试报告配置 */
  reporter: [
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line']
  ],

  /* 全局测试配置 */
  use: {
    /* 基础URL */
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    /* 浏览器追踪 */
    trace: 'on-first-retry',
    /* 截图配置 */
    screenshot: 'only-on-failure',
    /* 视频录制 */
    video: 'retain-on-failure',
    /* 忽略HTTPS错误 */
    ignoreHTTPSErrors: true,
    /* 超时设置 */
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* 测试项目配置 */
  projects: [
    // 设置项目 - 数据库初始化和清理
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/,
    },

    // 桌面浏览器测试
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    // 移动端测试
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },
  ],

  /* 本地开发服务器配置 */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3002',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  //   env: {
  //     NODE_ENV: 'test',
  //     NEXT_PUBLIC_USE_TEST_DB: 'true',
  //   },
  // },

  /* 测试输出目录 */
  outputDir: 'test-results/artifacts',

  /* 全局设置和清理 */
  // globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
});
