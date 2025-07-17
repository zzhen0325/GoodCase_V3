import { NextRequest, NextResponse } from "next/server";
import { FirebaseHealthCheck } from "@/lib/firebase-health-check";

// GET - Firebase健康检查
export async function GET(request: NextRequest) {
  try {
    console.log("🔍 执行Firebase健康检查...");

    const report = await FirebaseHealthCheck.generateReport();
    const clientCheck = FirebaseHealthCheck.checkClientConfig();
    const adminCheck = await FirebaseHealthCheck.checkAdminConfig();

    const overallHealth = clientCheck.success && adminCheck.success;

    return NextResponse.json({
      success: true,
      data: {
        overall: overallHealth ? "healthy" : "unhealthy",
        client: {
          status: clientCheck.success ? "healthy" : "unhealthy",
          errors: clientCheck.errors,
          warnings: clientCheck.warnings,
        },
        admin: {
          status: adminCheck.success ? "healthy" : "unhealthy",
          errors: adminCheck.errors,
          warnings: adminCheck.warnings,
        },
        report,
      },
    });
  } catch (error: any) {
    console.error("❌ Firebase健康检查失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Firebase健康检查失败",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
