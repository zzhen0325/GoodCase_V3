import { NextRequest, NextResponse } from "next/server";
import { dataService, ensureDataServiceInitialized } from "@/lib/data-service";
import { Tag } from "@/types";

// 获取所有标签
export async function GET(request: NextRequest) {
  try {
    await ensureDataServiceInitialized();
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    const tags = await dataService.getAllTags(groupId || undefined, false); // 不使用缓存确保数据最新

    return NextResponse.json({ success: true, data: tags });
  } catch (error) {
    console.error("获取标签失败:", error);
    return NextResponse.json(
      { success: false, error: "获取标签失败" },
      { status: 500 },
    );
  }
}

// 创建标签
export async function POST(request: NextRequest) {
  try {
    await ensureDataServiceInitialized();
    const { name, color, groupId } = await request.json();

    if (!name || !color || !groupId) {
      return NextResponse.json(
        { success: false, error: "标签名称、颜色和分组ID不能为空" },
        { status: 400 },
      );
    }

    // 检查分组是否存在
    const tagGroups = await dataService.getAllTagGroups(false); // 不使用缓存确保数据最新
    const tagGroup = tagGroups.find(group => group.id === groupId);
    if (!tagGroup) {
      return NextResponse.json(
        { success: false, error: "指定的分组不存在" },
        { status: 400 },
      );
    }

    const result = await dataService.createTag({ name, color, groupId, usageCount: 0 });
    if (result.success && result.data) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      throw new Error(result.error || "创建标签失败");
    }
  } catch (error) {
    console.error("创建标签失败:", error);
    return NextResponse.json(
      { success: false, error: "创建标签失败" },
      { status: 500 },
    );
  }
}
