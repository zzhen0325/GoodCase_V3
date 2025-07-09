import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { convertToWebp, detectImageFormat, estimateImageSize } from '@/lib/image-utils';

/**
 * 图片格式迁移API
 * 将现有的非webp格式图片转换为webp格式
 */
export async function POST(request: NextRequest) {
  try {
    const { dryRun = true } = await request.json();
    
    // 获取所有图片
    const result = await Database.getAllImages();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    const images = result.data!;
    const migrationStats = {
      total: images.length,
      needsMigration: 0,
      migrated: 0,
      failed: 0,
      sizeBefore: 0,
      sizeAfter: 0,
      errors: [] as string[]
    };
    
    for (const image of images) {
      if (!image.url || !image.url.startsWith('data:')) {
        continue;
      }
      
      const format = detectImageFormat(image.url);
      const originalSize = estimateImageSize(image.url);
      migrationStats.sizeBefore += originalSize;
      
      if (format !== 'webp') {
        migrationStats.needsMigration++;
        
        if (!dryRun) {
          try {
            // 转换为webp格式
            const webpUrl = await convertToWebp(image.url, 0.8);
            const newSize = estimateImageSize(webpUrl);
            migrationStats.sizeAfter += newSize;
            
            // 更新数据库
            const updateResult = await Database.updateImage(image.id, {
              url: webpUrl
            });
            
            if (updateResult.success) {
              migrationStats.migrated++;
            } else {
              migrationStats.failed++;
              migrationStats.errors.push(`图片 ${image.id} 更新失败: ${updateResult.error}`);
            }
          } catch (error) {
            migrationStats.failed++;
            migrationStats.errors.push(`图片 ${image.id} 转换失败: ${error}`);
            migrationStats.sizeAfter += originalSize; // 保持原始大小
          }
        } else {
          // 干运行模式，估算转换后的大小（通常webp比原格式小30-50%）
          migrationStats.sizeAfter += Math.round(originalSize * 0.7);
        }
      } else {
        // 已经是webp格式
        migrationStats.sizeAfter += originalSize;
      }
    }
    
    const compressionRatio = migrationStats.sizeBefore > 0 
      ? ((migrationStats.sizeBefore - migrationStats.sizeAfter) / migrationStats.sizeBefore * 100).toFixed(1)
      : '0';
    
    return NextResponse.json({
      success: true,
      dryRun,
      stats: {
        ...migrationStats,
        compressionRatio: `${compressionRatio}%`,
        sizeSaved: migrationStats.sizeBefore - migrationStats.sizeAfter
      }
    });
    
  } catch (error) {
    console.error('图片迁移失败:', error);
    return NextResponse.json(
      { error: '图片迁移失败' },
      { status: 500 }
    );
  }
}

/**
 * 获取迁移状态
 */
export async function GET() {
  try {
    const result = await Database.getAllImages();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    const images = result.data!;
    const stats = {
      total: images.length,
      webp: 0,
      jpeg: 0,
      png: 0,
      gif: 0,
      other: 0,
      invalid: 0
    };
    
    for (const image of images) {
      if (!image.url || !image.url.startsWith('data:')) {
        stats.invalid++;
        continue;
      }
      
      const format = detectImageFormat(image.url);
      switch (format) {
        case 'webp':
          stats.webp++;
          break;
        case 'jpeg':
          stats.jpeg++;
          break;
        case 'png':
          stats.png++;
          break;
        case 'gif':
          stats.gif++;
          break;
        default:
          stats.other++;
      }
    }
    
    return NextResponse.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('获取迁移状态失败:', error);
    return NextResponse.json(
      { error: '获取迁移状态失败' },
      { status: 500 }
    );
  }
}