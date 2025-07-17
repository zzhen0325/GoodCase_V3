import { NextRequest, NextResponse } from "next/server";
import { AdminImageStorageService } from "@/lib/admin-image-storage";

// DELETE - 删除图片
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "缺少图片URL参数" }, { status: 400 });
    }

    await AdminImageStorageService.deleteImage(imageUrl);

    return NextResponse.json({ message: "图片删除成功" }, { status: 200 });
  } catch (error) {
    console.error("删除图片失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除图片失败" },
      { status: 500 },
    );
  }
}

// GET - 获取图片元数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "缺少图片URL参数" }, { status: 400 });
    }

    const metadata = await AdminImageStorageService.getImageMetadata(imageUrl);

    return NextResponse.json({ metadata }, { status: 200 });
  } catch (error) {
    console.error("获取图片元数据失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取图片元数据失败" },
      { status: 500 },
    );
  }
}
