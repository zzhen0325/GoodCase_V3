import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { DatabaseAdmin } from "@/lib/database-admin";
import { ImageData } from "@/types";

// GET - 获取所有图片
export async function GET(request: NextRequest) {
  try {
    // 获取所有图片（搜索功能在前端实现）
    const images = await DatabaseAdmin.getAllImages();
    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error("获取图片失败:", error);
    return NextResponse.json(
      { success: false, error: "获取图片失败" },
      { status: 500 },
    );
  }
}

import { AdminImageStorageService } from "@/lib/admin-image-storage";

// POST - 添加新图片
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log("📤 开始处理图片上传请求");

    // 设置超时处理
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("请求超时")), 4 * 60 * 1000); // 4分钟超时
    });

    const processPromise = async () => {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const prompt = formData.get("prompt") as string;

      return { file, prompt };
    };

    const { file, prompt } = (await Promise.race([
      processPromise(),
      timeoutPromise,
    ])) as any;

    console.log("📋 请求参数:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      prompt,
    });

    if (!file) {
      console.error("❌ 缺少文件");
      return NextResponse.json(
        { success: false, error: "请选择图片文件" },
        { status: 400 },
      );
    }

    if (!prompt) {
      console.error("❌ 缺少提示词");
      return NextResponse.json(
        { success: false, error: "请输入提示词" },
        { status: 400 },
      );
    }

    // 1. 上传图片到 Firebase Storage
    const imageUrl = await AdminImageStorageService.uploadImage(file, "images");

    // 2. 准备要存入 Firestore 的数据

    const imageData = {
      title: prompt, // 使用提示词作为标题
      url: imageUrl, // 图片下载URL
      prompts: [
        {
          id: Date.now().toString(),
          title: prompt,
          content: prompt,
          color: "slate",
          order: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ], // 提示词对象数组
      tags: [], // 移除标签功能
    };

    // 3. 调用 DatabaseAdmin 方法存入 Firestore（服务端）
    const imageId = await DatabaseAdmin.createImage(imageData);

    const processingTime = Date.now() - startTime;
    console.log(`✅ 图片上传成功，处理时间: ${processingTime}ms`);

    return NextResponse.json(
      { success: true, data: { id: imageId, ...imageData } },
      { status: 201 },
    );
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("❌ 添加图片失败:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      processingTime: `${processingTime}ms`,
    });

    // 根据错误类型返回更具体的错误信息
    let errorMessage = "添加图片失败";
    let statusCode = 500;

    if (error.message.includes("请求超时")) {
      errorMessage = "文件上传超时，请尝试上传较小的文件";
      statusCode = 408;
    } else if (error.message.includes("文件类型")) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes("文件大小")) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (
      error.message.includes("Firebase") ||
      error.message.includes("Storage")
    ) {
      errorMessage = "Firebase存储服务错误，请检查配置";
      statusCode = 503;
    } else if (
      error.message.includes("Database") ||
      error.message.includes("Firestore")
    ) {
      errorMessage = "数据库服务错误，请检查配置";
      statusCode = 503;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
        processingTime: `${processingTime}ms`,
      },
      { status: statusCode },
    );
  }
}
