import { NextRequest, NextResponse } from "next/server";
import { dataService, ensureDataServiceInitialized } from "@/lib/data-service";
import { TagGroup } from "@/types";

// 获取所有标签分组
export async function GET() {
  try {
    await ensureDataServiceInitialized();
    const tagGroups = await dataService.getAllTagGroups(false); // 不使用缓存确保数据最新
    return NextResponse.json({ success: true, data: tagGroups });
  } catch (error) {
    console.error("获取标签分组失败:", error);
    return NextResponse.json(
      { success: false, error: "获取标签分组失败" },
      { status: 500 },
    );
  }
}

// 创建标签分组
export async function POST(request: NextRequest) {
  try {
    await ensureDataServiceInitialized();
    const { name, color } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { success: false, error: "分组名称和颜色不能为空" },
        { status: 400 },
      );
    }

    const result = await dataService.createTagGroup({ name, color, tagCount: 0 });
    if (result.success && result.data) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      throw new Error(result.error || "创建标签分组失败");
    }
  } catch (error) {
    console.error("创建标签分组失败:", error);
    return NextResponse.json(
      { success: false, error: "创建标签分组失败" },
      { status: 500 },
    );
  }
}
