import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { ExportData } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data }: { data: ExportData } = body;

    // 验证数据格式
    if (!data || !data.version || !Array.isArray(data.images)) {
      return NextResponse.json(
        { error: "无效的导入数据格式" },
        { status: 400 },
      );
    }

    // 简化导入：逐个添加图片
    let successCount = 0;
    let errorCount = 0;

    for (const image of data.images) {
      try {
        const database = Database.getInstance();
        const result = await database.addImage({
          title: image.title,
          url: image.url,
          prompt: image.prompt || "",
          size: image.size || 0,
          tags: image.tags || [],
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
      }
    }

    const result = {
      imported: successCount,
      failed: errorCount,
      total: data.images.length,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("导入失败:", error);
    return NextResponse.json({ error: "导入失败" }, { status: 500 });
  }
}
