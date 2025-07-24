const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// 创建一个简单的1x1像素PNG文件
const createSimplePNG = () => {
  // 最简单的1x1像素PNG文件
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x90, 0x77, 0x53, 0xDE, // CRC
    0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, // compressed data
    0x02, 0x00, 0x01, // checksum
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return pngData;
};

// 测试上传功能
async function testUpload() {
  try {
    console.log('创建测试PNG文件...');
    const pngBuffer = createSimplePNG();
    console.log('PNG文件大小:', pngBuffer.length, '字节');
    
    // 创建Blob和File对象（模拟浏览器环境）
    const { Blob } = require('buffer');
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    
    // 创建FormData
    const FormData = require('form-data');
    const form = new FormData();
    
    // 添加文件到FormData
    form.append('imageFile', pngBuffer, {
      filename: 'test.png',
      contentType: 'image/png',
      knownLength: pngBuffer.length
    });
    
    console.log('发送上传请求...');
    const response = await fetch('http://localhost:3000/api/images/upload', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    });
    
    console.log('响应状态:', response.status);
    const result = await response.text();
    console.log('响应内容:', result);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testUpload();