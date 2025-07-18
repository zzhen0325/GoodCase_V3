import { NextRequest, NextResponse } from "next/server";
import { getStorageInstance } from "@/lib/firebase";
import { ref as storageRef, listAll, getDownloadURL } from "firebase/storage";
import { Database } from "@/lib/database";
import { ImageData } from "@/types";

/**
 * Firebase Storage到Firestore数据迁移API
 * 将现有的JSON文件数据迁移到Firestore集合中
 */
export async function POST(request: NextRequest) {
  try {
    const { dryRun = true } = await request.json();

    const database = Database.getInstance();

    const migrationStats = {
      total: 0,
      migrated: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // 获取Storage中的所有JSON文件
    const storageInstance = getStorageInstance();
    if (!storageInstance) {
      throw new Error("Storage 未初始化");
    }
    const listRef = storageRef(storageInstance, "images/");
    const res = await listAll(listRef);

    const jsonFiles = res.items.filter((itemRef) =>
      itemRef.name.endsWith(".json"),
    );
    migrationStats.total = jsonFiles.length;

    console.log(`发现 ${jsonFiles.length} 个JSON文件需要迁移`);

    for (const itemRef of jsonFiles) {
      const imageId = itemRef.name.replace(".json", "");

      try {
        // 检查Firestore中是否已存在该图片
        const existingImageResult = await database.getImageById(imageId);
        if (existingImageResult.success && !dryRun) {
          migrationStats.skipped++;
          console.log(`跳过已存在的图片: ${imageId}`);
          continue;
        }

        // 从Storage读取JSON数据
        const url = await getDownloadURL(itemRef);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.statusText}`);
        }

        const metadata = await response.json();
        const imageData: ImageData = { id: imageId, ...metadata };

        if (!dryRun) {
          // 迁移到Firestore
          const result = await database.addImage({
            url: imageData.url,
            title: imageData.title,
            prompt: imageData.prompts?.[0]?.text || imageData.prompt || "",
            size: imageData.size || 0,
            tags: imageData.tags || [],
          });

          if (result.success) {
            migrationStats.migrated++;
            console.log(`成功迁移图片: ${imageId}`);
          } else {
            migrationStats.failed++;
            migrationStats.errors.push(
              `图片 ${imageId} 迁移失败: ${result.error}`,
            );
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
        ? "迁移预览完成，使用 dryRun: false 执行实际迁移"
        : "数据迁移完成",
    });
  } catch (error) {
    console.error("数据迁移失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "数据迁移失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/**
 * 获取迁移状态
 */
export async function GET() {
  try {
    // 获取Storage中的JSON文件数量
    const storageInstance = getStorageInstance();
    if (!storageInstance) {
      throw new Error("Firebase Storage not initialized");
    }
    const listRef = storageRef(storageInstance, "images/");
    const res = await listAll(listRef);
    const jsonFiles = res.items.filter((itemRef) =>
      itemRef.name.endsWith(".json"),
    );

    // 获取Firestore中的图片数量
    const database = Database.getInstance();
    const firestoreResult = await database.getAllImages();
    const firestoreCount = firestoreResult.success
      ? firestoreResult.data!.length
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        storageJsonFiles: jsonFiles.length,
        firestoreImages: firestoreCount,
        migrationNeeded: jsonFiles.length - firestoreCount,
        migrationComplete: jsonFiles.length === firestoreCount,
      },
    });
  } catch (error) {
    console.error("获取迁移状态失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取迁移状态失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
