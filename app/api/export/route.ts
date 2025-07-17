import { NextRequest, NextResponse } from "next/server";
import { DatabaseAdmin } from "@/lib/database-admin";

export async function GET(request: NextRequest) {
  try {
    // 导出所有数据
    const exportData = await DatabaseAdmin.exportAllData();
    const filename = `gallery-export-${new Date().toISOString().split("T")[0]}.json`;

    // 返回JSON文件
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("导出失败:", error);
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
