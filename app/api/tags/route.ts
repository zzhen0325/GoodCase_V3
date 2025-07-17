import { NextRequest, NextResponse } from "next/server";
import { DatabaseAdmin } from "@/lib/database-admin";
import { Tag } from "@/types";

// 获取所有标签
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    let tags;
    if (groupId) {
      tags = await DatabaseAdmin.getTagsByGroupId(groupId);
    } else {
      tags = await DatabaseAdmin.getAllTags();
    }

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
    const { name, groupId } = await request.json();

    if (!name || !groupId) {
      return NextResponse.json(
        { success: false, error: "标签名称和分组ID不能为空" },
        { status: 400 },
      );
    }

    // 检查分组是否存在
    const tagGroup = await DatabaseAdmin.getTagGroupById(groupId);
    if (!tagGroup) {
      return NextResponse.json(
        { success: false, error: "指定的分组不存在" },
        { status: 400 },
      );
    }

    const tag = await DatabaseAdmin.createTag({ name, groupId });
    return NextResponse.json({ success: true, data: tag });
  } catch (error) {
    console.error("创建标签失败:", error);
    return NextResponse.json(
      { success: false, error: "创建标签失败" },
      { status: 500 },
    );
  }
}
