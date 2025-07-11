import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-admin';

import { Database } from '@/lib/database';
import { ImageData } from '@/types';

/**
 * Firebase Storage到Firestore数据迁移API
 * 将现有的JSON文件数据迁移到Firestore集合中
 */
export async function POST(request: NextRequest) {
  try {
    const { dryRun = true } = await request.json();
    
    const migrationStats = {
      total: 0,
      migrated: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    // 获取Storage中的所有JSON文件
    const storageInstance = getAdminStorage();
    if (!storageInstance) {
      throw new Error('Storage 未初始化');
    }
    const bucket = getAdminStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'images/' });
    
    const jsonFiles = files.filter(file => file.name.endsWith('.json'));
    migrationStats.total = jsonFiles.length;
    
    console.log(`发现 ${jsonFiles.length} 个JSON文件需要迁移`);
    
    for (const file of jsonFiles) {
      const imageId = file.name.substring(file.name.lastIndexOf('/') + 1).replace('.json', '');
      
      try {
        // 检查Firestore中是否已存在该图片
        const existingImageResult = await Database.getImageById(imageId);
        if (existingImageResult.success && !dryRun) {
          migrationStats.skipped++;
          console.log(`跳过已存在的图片: ${imageId}`);
          continue;
        }
        
        // 从Storage读取JSON数据
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491' // A long, long time in the future
        });
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }
        
        const metadata = await response.json();
        const imageData: ImageData = { id: imageId, ...metadata };
        
        if (!dryRun) {
          // 迁移到Firestore
          const result = await Database.addImage({
            url: imageData.url,
            title: imageData.title,
            prompts: imageData.prompts || [],
            tags: imageData.tags || [],
            usageCount: imageData.usageCount || 0
          });
          
          if (result.success) {
            migrationStats.migrated++;
            console.log(`成功迁移图片: ${imageId}`);
          } else {
            migrationStats.failed++;
            migrationStats.errors.push(`图片 ${imageId} 迁移失败: ${result.error}`);
          }
        } else {
          // 干运行模式，只统计
          migrationStats.migrated++;
          console.log(`[DRY RUN] 将迁移图片: ${imageId}`);
        }
        
      } catch (error) {
        migrationStats.failed++;
        const errorMsg = `图片 ${imageId} 处理失败: ${error}`;
        migrationStats.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    return NextResponse.json({
      success: true,
      dryRun,
      stats: migrationStats,
      message: dryRun 
        ? '迁移预览完成，使用 dryRun: false 执行实际迁移'
        : '数据迁移完成'
    });
    
  } catch (error) {
    console.error('数据迁移失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '数据迁移失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * 获取迁移状态
 */
export async function GET() {
  try {
    // 获取Storage中的JSON文件数量
    const storageInstance = getAdminStorage();
    if (!storageInstance) {
      throw new Error('Firebase Storage not initialized');
    }
    const bucket = getAdminStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'images/' });
    const jsonFiles = files.filter(file => file.name.endsWith('.json'));
    
    // 获取Firestore中的图片数量
    const firestoreResult = await Database.getAllImages();
    const firestoreCount = firestoreResult.success ? firestoreResult.data!.length : 0;
    
    return NextResponse.json({
      success: true,
      stats: {
        storageJsonFiles: jsonFiles.length,
        firestoreImages: firestoreCount,
        migrationNeeded: jsonFiles.length - firestoreCount,
        migrationComplete: jsonFiles.length === firestoreCount
      }
    });
    
  } catch (error) {
    console.error('获取迁移状态失败:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取迁移状态失败',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}