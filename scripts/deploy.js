#!/usr/bin/env node

/**
 * 部署脚本
 * 展示如何在生产环境中使用Base64编码的Firebase服务账户
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 检查环境变量
function checkEnvironment() {
  console.log('🔍 检查环境变量...');
  
  const requiredEnvs = [
    'FIREBASE_SERVICE_ACCOUNT_BASE64',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  ];
  
  const missing = requiredEnvs.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ 缺少必需的环境变量:', missing.join(', '));
    process.exit(1);
  }
  
  console.log('✅ 环境变量检查通过');
}

// 验证Base64编码的服务账户
function validateServiceAccount() {
  console.log('🔐 验证Firebase服务账户...');
  
  try {
    const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const serviceAccount = JSON.parse(Buffer.from(base64Key, 'base64').toString('utf8'));
    
    const requiredFields = ['type', 'project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`服务账户缺少字段: ${missingFields.join(', ')}`);
    }
    
    console.log('✅ Firebase服务账户验证通过');
    console.log(`📋 项目ID: ${serviceAccount.project_id}`);
    console.log(`📧 客户端邮箱: ${serviceAccount.client_email}`);
    
  } catch (error) {
    console.error('❌ Firebase服务账户验证失败:', error.message);
    process.exit(1);
  }
}

// 构建项目
function buildProject() {
  console.log('🏗️ 构建项目...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ 项目构建完成');
  } catch (error) {
    console.error('❌ 项目构建失败:', error.message);
    process.exit(1);
  }
}

// 部署到Firebase
function deployToFirebase() {
  console.log('🚀 部署到Firebase...');
  
  try {
    // 使用Firebase CLI部署
    execSync('npx firebase deploy --only hosting', { stdio: 'inherit' });
    console.log('✅ 部署完成');
  } catch (error) {
    console.error('❌ 部署失败:', error.message);
    process.exit(1);
  }
}

// 主函数
function main() {
  console.log('🚀 开始部署流程...');
  console.log('=' .repeat(50));
  
  checkEnvironment();
  validateServiceAccount();
  buildProject();
  deployToFirebase();
  
  console.log('=' .repeat(50));
  console.log('🎉 部署流程完成!');
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ 未捕获的异常:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironment,
  validateServiceAccount,
  buildProject,
  deployToFirebase
};