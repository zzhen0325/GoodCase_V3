import { NextRequest, NextResponse } from "next/server";
import { DatabaseAdmin } from "@/lib/database-admin";
import { TagGroup } from "@/types";

// 获取所有标签分组
export async function GET() {
  try {
    const tagGroups = await DatabaseAdmin.getAllTagGroups();
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
    const { name, color } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { success: false, error: "分组名称和颜色不能为空" },
        { status: 400 },
      );
    }

    const tagGroup = await DatabaseAdmin.createTagGroup({ name, color });
    return NextResponse.json({ success: true, data: tagGroup });
  } catch (error) {
    console.error("创建标签分组失败:", error);
    return NextResponse.json(
      { success: false, error: "创建标签分组失败" },
      { status: 500 },
    );
  }
}
