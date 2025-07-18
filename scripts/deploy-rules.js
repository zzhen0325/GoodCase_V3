#!/usr/bin/env node

/**
 * Firebase 安全规则快速部署脚本
 * 用于部署 Storage 和 Firestore 安全规则
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    log(`❌ 文件不存在: ${filePath}`, 'red');
    return false;
  }
  log(`✅ 文件存在: ${filePath}`, 'green');
  return true;
}

function runCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'blue');
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000, // 30秒超时
    });
    log(`✅ ${description} 成功`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} 失败: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function main() {
  log('🚀 Firebase 安全规则部署脚本', 'cyan');
  log('='.repeat(50), 'cyan');

  // 检查规则文件
  const storageRulesPath = path.join(
    __dirname,
    '..',
    'firebase',
    'storage.rules'
  );
  const firestoreRulesPath = path.join(
    __dirname,
    '..',
    'firebase',
    'firestore.rules'
  );

  if (!checkFile(storageRulesPath) || !checkFile(firestoreRulesPath)) {
    log('❌ 规则文件检查失败，请确保文件存在', 'red');
    process.exit(1);
  }

  // 检查 Firebase CLI
  const cliCheck = runCommand('npx firebase --version', '检查 Firebase CLI');
  if (!cliCheck.success) {
    log('❌ Firebase CLI 不可用，请先安装', 'red');
    process.exit(1);
  }

  // 检查登录状态
  const loginCheck = runCommand('npx firebase projects:list', '检查登录状态');
  if (!loginCheck.success) {
    log('⚠️  需要登录 Firebase', 'yellow');
    log('请手动运行: npx firebase login', 'yellow');

    // 尝试自动登录
    const autoLogin = runCommand(
      'npx firebase login --no-localhost',
      '尝试自动登录'
    );
    if (!autoLogin.success) {
      log('❌ 自动登录失败，请手动登录后重试', 'red');
      process.exit(1);
    }
  }

  // 检查项目配置
  const projectCheck = runCommand('npx firebase use', '检查项目配置');
  if (!projectCheck.success) {
    log('⚠️  需要设置 Firebase 项目', 'yellow');

    // 列出可用项目
    const projectsList = runCommand(
      'npx firebase projects:list',
      '获取项目列表'
    );
    if (projectsList.success) {
      log('可用项目:', 'blue');
      console.log(projectsList.output);
      log('请手动运行: npx firebase use <project-id>', 'yellow');
      process.exit(1);
    }
  }

  // 部署规则
  log('\n🔄 开始部署安全规则...', 'magenta');

  // 部署 Firestore 规则
  const firestoreDeploy = runCommand(
    'npx firebase deploy --only firestore:rules',
    '部署 Firestore 规则'
  );

  // 部署 Storage 规则
  const storageDeploy = runCommand(
    'npx firebase deploy --only storage',
    '部署 Storage 规则'
  );

  // 结果汇总
  log('\n📊 部署结果汇总:', 'cyan');
  log('='.repeat(30), 'cyan');

  if (firestoreDeploy.success) {
    log('✅ Firestore 规则部署成功', 'green');
  } else {
    log('❌ Firestore 规则部署失败', 'red');
  }

  if (storageDeploy.success) {
    log('✅ Storage 规则部署成功', 'green');
  } else {
    log('❌ Storage 规则部署失败', 'red');
  }

  if (firestoreDeploy.success && storageDeploy.success) {
    log('\n🎉 所有规则部署成功！', 'green');
    log('现在所有用户都可以读写 Firebase 数据', 'green');
    log('⚠️  请注意：这在生产环境中是不安全的', 'yellow');
  } else {
    log('\n❌ 部分规则部署失败', 'red');
    log('请检查网络连接和 Firebase 配置', 'yellow');
    log('或者使用 Firebase 控制台手动部署', 'yellow');
  }
}

// 错误处理
process.on('uncaughtException', (error) => {
  log(`❌ 未捕获的错误: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`❌ 未处理的 Promise 拒绝: ${reason}`, 'red');
  process.exit(1);
});

// 运行主函数
main().catch((error) => {
  log(`❌ 脚本执行失败: ${error.message}`, 'red');
  process.exit(1);
});
