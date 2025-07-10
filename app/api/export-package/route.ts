import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { exportAllData } from '@/lib/database-admin';

export async function POST(request: NextRequest) {
  try {
    const { imageIds, cachedImages } = await request.json();
    
    // 获取所有数据
    const exportData = await exportAllData();
    
    // 创建ZIP文件
    const zip = new JSZip();
    
    // 添加JSON数据文件
    const jsonData = JSON.stringify(exportData, null, 2);
    zip.file('data.json', jsonData);
    
    // 如果提供了图片ID列表，则只导出指定图片
    let imagesToExport = exportData.images;
    if (imageIds && Array.isArray(imageIds) && imageIds.length > 0) {
      imagesToExport = exportData.images.filter(img => imageIds.includes(img.id));
    }
    
    // 创建图片文件夹
    const imagesFolder = zip.folder('images');

    // 下载进度跟踪
    let processedCount = 0;
    const totalCount = imagesToExport.length;
    
    // 批量处理图片
    const downloadPromises = imagesToExport.map(async (image: any, index: number) => {
      try {
        let imageData: ArrayBuffer;
        let fileName: string;
        
        // 优先使用缓存的图片数据
        const cachedImage = cachedImages?.find((cached: any) => cached.id === image.id);
        if (cachedImage && cachedImage.data) {
          // 使用缓存的图片数据
          const base64Data = cachedImage.data;
          // 将base64数据转换为ArrayBuffer
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          imageData = bytes.buffer;
          
          const fileExtension = cachedImage.extension || getFileExtension(image.url) || 'jpg';
          fileName = `${image.id}.${fileExtension}`;
        } else {
          // 从URL下载图片
          const response = await fetch(image.url);
          if (!response.ok) {
            console.warn(`Failed to download image: ${image.url}`);
            return;
          }
          
          imageData = await response.arrayBuffer();
          const fileExtension = getFileExtension(image.url) || 'jpg';
          fileName = `${image.id}.${fileExtension}`;
        }
        
        imagesFolder?.file(fileName, imageData);
        processedCount++;
        
        console.log(`Processed ${processedCount}/${totalCount}: ${fileName}`);
      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error);
      }
    });
    
    await Promise.all(downloadPromises);
    
    // 生成ZIP文件
    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    
    const filename = `gallery-export-${new Date().toISOString().split('T')[0]}.zip`;
    
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('打包导出失败:', error);
    return NextResponse.json(
      { error: '打包导出失败' },
      { status: 500 }
    );
  }
}

// 获取文件扩展名
function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const extension = pathname.split('.').pop();
    return extension || 'jpg';
  } catch {
    return 'jpg';
  }
}

// GET方法用于获取导出进度
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  // 这里可以实现进度查询逻辑
  // 暂时返回简单响应
  return NextResponse.json({
    success: true,
    progress: 100,
    status: 'completed'
  });
}