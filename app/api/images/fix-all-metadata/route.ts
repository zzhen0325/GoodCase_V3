import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FirestoreImage } from '@/types';

/**
 * 修复所有图片的元数据
 * 包括单图和双图类型的宽高信息
 */
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    
    // 查询所有图片
    const querySnapshot = await db.collection('images').get();
    
    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    console.log(`开始修复 ${querySnapshot.docs.length} 张图片的元数据`);
    
    for (const docSnapshot of querySnapshot.docs) {
      try {
        const imageData = docSnapshot.data() as FirestoreImage;
        let needsUpdate = false;
        const updates: any = {};
        
        if (imageData.type === 'single') {
          // 修复单图类型
          if (!imageData.width || !imageData.height || 
              imageData.width === 0 || imageData.height === 0) {
            
            const dimensions = await getImageDimensionsFromUrl(imageData.url!);
            if (dimensions && dimensions.width > 0 && dimensions.height > 0) {
              updates.width = dimensions.width;
              updates.height = dimensions.height;
              needsUpdate = true;
              console.log(`修复单图 ${docSnapshot.id}: ${dimensions.width}x${dimensions.height}`);
            }
          }
        } else if (imageData.type === 'comparison') {
          // 修复双图类型
          if (imageData.beforeImage && 
              (!imageData.beforeImage.width || !imageData.beforeImage.height ||
               imageData.beforeImage.width === 0 || imageData.beforeImage.height === 0)) {
            
            const beforeDimensions = await getImageDimensionsFromUrl(imageData.beforeImage.url);
            if (beforeDimensions && beforeDimensions.width > 0 && beforeDimensions.height > 0) {
              updates['beforeImage.width'] = beforeDimensions.width;
              updates['beforeImage.height'] = beforeDimensions.height;
              needsUpdate = true;
              console.log(`修复Before图片 ${docSnapshot.id}: ${beforeDimensions.width}x${beforeDimensions.height}`);
            }
          }
          
          if (imageData.afterImage && 
              (!imageData.afterImage.width || !imageData.afterImage.height ||
               imageData.afterImage.width === 0 || imageData.afterImage.height === 0)) {
            
            const afterDimensions = await getImageDimensionsFromUrl(imageData.afterImage.url);
            if (afterDimensions && afterDimensions.width > 0 && afterDimensions.height > 0) {
              updates['afterImage.width'] = afterDimensions.width;
              updates['afterImage.height'] = afterDimensions.height;
              needsUpdate = true;
              console.log(`修复After图片 ${docSnapshot.id}: ${afterDimensions.width}x${afterDimensions.height}`);
            }
          }
          
          // 修复主要的width和height字段（使用after图片的尺寸）
          if (imageData.afterImage && 
              (!imageData.width || !imageData.height ||
               imageData.width === 0 || imageData.height === 0)) {
            
            const afterDimensions = await getImageDimensionsFromUrl(imageData.afterImage.url);
            if (afterDimensions && afterDimensions.width > 0 && afterDimensions.height > 0) {
              updates.width = afterDimensions.width;
              updates.height = afterDimensions.height;
              needsUpdate = true;
              console.log(`修复双图主尺寸 ${docSnapshot.id}: ${afterDimensions.width}x${afterDimensions.height}`);
            }
          }
        }
        
        // 执行更新
        if (needsUpdate) {
          await db.collection('images').doc(docSnapshot.id).update(updates);
          updatedCount++;
          console.log(`成功更新图片 ${docSnapshot.id}`);
        }
        
      } catch (error) {
        errorCount++;
        const errorMsg = `更新图片 ${docSnapshot.id} 失败: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        totalImages: querySnapshot.docs.length,
        updatedCount,
        errorCount,
        errors: errors.slice(0, 10)
      }
    });
    
  } catch (error) {
    console.error('修复所有图片元数据失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FIX_ALL_METADATA_ERROR',
          message: '修复所有图片元数据失败',
          details: error
        }
      },
      { status: 500 }
    );
  }
}

/**
 * 从图片URL获取图片尺寸
 */
async function getImageDimensionsFromUrl(url: string): Promise<{ width: number; height: number } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // 尝试解析不同格式
    if (isPNG(uint8Array)) {
      return parsePNGDimensions(uint8Array);
    }
    
    if (isJPEG(uint8Array)) {
      return parseJPEGDimensions(uint8Array);
    }
    
    if (isWebP(uint8Array)) {
      return parseWebPDimensions(uint8Array);
    }
    
    // 如果无法解析，返回默认尺寸
    console.warn(`无法解析图片尺寸: ${url}`);
    return { width: 512, height: 512 };
    
  } catch (error) {
    console.error(`获取图片尺寸失败: ${url}`, error);
    return { width: 512, height: 512 }; // 返回默认尺寸
  }
}

/**
 * 检查是否为PNG格式
 */
function isPNG(data: Uint8Array): boolean {
  return data.length >= 8 && 
         data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47 &&
         data[4] === 0x0D && data[5] === 0x0A && data[6] === 0x1A && data[7] === 0x0A;
}

/**
 * 解析PNG图片尺寸
 */
function parsePNGDimensions(data: Uint8Array): { width: number; height: number } | null {
  try {
    if (data.length < 24) return null;
    
    const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
    const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
    
    return { width, height };
  } catch (error) {
    console.error('解析PNG尺寸失败:', error);
    return null;
  }
}

/**
 * 检查是否为JPEG格式
 */
function isJPEG(data: Uint8Array): boolean {
  return data.length >= 2 && data[0] === 0xFF && data[1] === 0xD8;
}

/**
 * 解析JPEG图片尺寸
 */
function parseJPEGDimensions(data: Uint8Array): { width: number; height: number } | null {
  try {
    let offset = 2; // Skip SOI marker
    
    while (offset < data.length - 1) {
      if (data[offset] !== 0xFF) {
        offset++;
        continue;
      }
      
      const marker = data[offset + 1];
      
      // SOF0, SOF1, SOF2 markers contain dimension info
      if (marker >= 0xC0 && marker <= 0xC3) {
        if (offset + 9 < data.length) {
          const height = (data[offset + 5] << 8) | data[offset + 6];
          const width = (data[offset + 7] << 8) | data[offset + 8];
          return { width, height };
        }
      }
      
      // Skip this segment
      if (offset + 3 < data.length) {
        const segmentLength = (data[offset + 2] << 8) | data[offset + 3];
        offset += 2 + segmentLength;
      } else {
        break;
      }
    }
    
    return null;
  } catch (error) {
    console.error('解析JPEG尺寸失败:', error);
    return null;
  }
}

/**
 * 检查是否为WebP格式
 */
function isWebP(data: Uint8Array): boolean {
  return data.length >= 12 && 
         data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 && // RIFF
         data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50; // WEBP
}

/**
 * 解析WebP图片尺寸
 */
function parseWebPDimensions(data: Uint8Array): { width: number; height: number } | null {
  try {
    // WebP VP8 format
    if (data.length >= 30) {
      const width = ((data[26] | (data[27] << 8)) & 0x3fff) + 1;
      const height = ((data[28] | (data[29] << 8)) & 0x3fff) + 1;
      return { width, height };
    }
    return null;
  } catch (error) {
    console.error('解析WebP尺寸失败:', error);
    return null;
  }
}