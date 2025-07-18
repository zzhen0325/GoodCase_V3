import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { DatabaseAdmin } from "@/lib/database-admin";
import { ImageData } from "@/types";

// PUT - 更新图片
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const updates: Partial<ImageData> = await request.json();

    const database = Database.getInstance();

    // 如果更新包含标签变更，需要更新标签使用次数
    if (updates.tags !== undefined) {
      // 获取原始图片数据
      const originalResult = await database.getImageById(id);
      if (originalResult.success && originalResult.data) {
        const originalTags = originalResult.data.tags || [];
        const newTags = updates.tags || [];

        // 找出被移除的标签
        const removedTags = originalTags.filter(
          (tag) => !newTags.includes(tag),
        );
        // 找出新添加的标签
        const addedTags = newTags.filter((tag) => !originalTags.includes(tag));

        // 更新标签使用次数
        for (const tag of removedTags) {
          try {
            const tagId = typeof tag === 'string' ? tag : (tag as any).id || tag;
            await DatabaseAdmin.updateTagUsageCount(tagId, -1);
          } catch (error) {
            console.error(`更新标签 ${tag} 使用次数失败:`, error);
          }
        }

        for (const tag of addedTags) {
          try {
            const tagId = typeof tag === 'string' ? tag : (tag as any).id || tag;
            await DatabaseAdmin.updateTagUsageCount(tagId, 1);
          } catch (error) {
            console.error(`更新标签 ${tag} 使用次数失败:`, error);
          }
        }
      }
    }

    const result = await database.updateImage(id, updates);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("更新图片失败:", error);
    return NextResponse.json(
      { success: false, error: "更新图片失败" },
      { status: 500 },
    );
  }
}

// GET - 获取单个图片
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const database = Database.getInstance();
    const result = await database.getImageById(id);

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === "图片不存在" ? 404 : 500 },
      );
    }
  } catch (error) {
    console.error("获取图片失败:", error);
    return NextResponse.json(
      { success: false, error: "获取图片失败" },
      { status: 500 },
    );
  }
}

// DELETE - 删除图片（包括存储中的文件）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const database = Database.getInstance();

    // 获取图片数据以减少标签使用次数
    const imageResult = await database.getImageById(id);
    if (imageResult.success && imageResult.data) {
      const tags = imageResult.data.tags || [];

      // 减少所有关联标签的使用次数
      for (const tag of tags) {
        try {
          const tagId = typeof tag === 'string' ? tag : (tag as any).id || tag;
          await DatabaseAdmin.updateTagUsageCount(tagId, -1);
        } catch (error) {
          console.error(`减少标签 ${tag} 使用次数失败:`, error);
        }
      }
    }

    // 删除图片
    const result = await database.deleteImage(id);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === "图片不存在" ? 404 : 500 },
      );
    }
  } catch (error) {
    console.error("删除图片失败:", error);
    return NextResponse.json(
      { success: false, error: "删除图片失败" },
      { status: 500 },
    );
  }
}
