#!/usr/bin/env node

/**
 * 图片元数据修复脚本
 * 使用方法: node scripts/fix-image-metadata.js
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * 发送HTTP请求的辅助函数
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * 修复图片元数据的主函数
 */
async function fixImageMetadata() {
  try {
    console.log('🚀 开始修复图片元数据...');
    console.log('⏳ 正在连接API服务器...');
    
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const endpoint = `${apiUrl}/api/images/fix-all-metadata`;
    
    console.log(`📡 API地址: ${endpoint}`);
    
    const result = await makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (result.success) {
      console.log('\n✅ 修复完成!');
      console.log('📊 修复统计:');
      console.log(`   总图片数: ${result.data.totalImages}`);
      console.log(`   成功更新: ${result.data.updatedCount}`);
      console.log(`   失败数量: ${result.data.errorCount}`);
      
      if (result.data.errorCount > 0) {
        console.log('\n❌ 错误详情:');
        result.data.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
      if (result.data.updatedCount > 0) {
        console.log('\n🎉 修复成功! 所有图片的宽高数据已更新。');
      } else {
        console.log('\n✨ 所有图片的元数据都是完整的，无需修复。');
      }
    } else {
      console.error('\n❌ 修复失败:', result.error?.message || '未知错误');
      if (result.error?.details) {
        console.error('错误详情:', result.error.details);
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 脚本执行失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 解决方案:');
      console.error('   1. 确保开发服务器正在运行: npm run dev');
      console.error('   2. 检查服务器是否在 http://localhost:3000 运行');
      console.error('   3. 或设置环境变量: API_URL=http://your-server-url');
    }
    
    process.exit(1);
  }
}

/**
 * 显示使用帮助
 */
function showHelp() {
  console.log('\n📖 图片元数据修复脚本');
  console.log('\n使用方法:');
  console.log('   node scripts/fix-image-metadata.js');
  console.log('\n环境变量:');
  console.log('   API_URL - API服务器地址 (默认: http://localhost:3000)');
  console.log('\n示例:');
  console.log('   # 使用默认本地服务器');
  console.log('   node scripts/fix-image-metadata.js');
  console.log('\n   # 使用自定义服务器');
  console.log('   API_URL=https://your-app.vercel.app node scripts/fix-image-metadata.js');
}

// 检查命令行参数
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 执行修复
fixImageMetadata();