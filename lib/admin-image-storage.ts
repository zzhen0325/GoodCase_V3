import { adminStorage } from "./firebase-admin";
import { v4 as uuidv4 } from "uuid";

// 服务端图片存储服务
export class AdminImageStorageService {
  // 服务端上传图片
  static async uploadImage(
    file: File,
    folder: string = "images",
  ): Promise<string> {
    try {
      // 检查文件大小 (限制为 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("文件大小超过限制 (10MB)");
      }

      // 检查文件类型
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      console.log("文件类型检查:", {
        fileName: file.name,
        fileType: file.type,
        allowedTypes,
      });
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          `不支持的文件类型: ${file.type}。支持的类型: ${allowedTypes.join(", ")}`,
        );
      }

      // 生成唯一文件名
      const fileExtension = file.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;

      console.log("服务端开始上传图片:", {
        fileName,
        fileSize: file.size,
        fileType: file.type,
      });

      // 获取存储桶
      const bucket = adminStorage.bucket();
      const fileRef = bucket.file(filePath);

      // 将 File 转换为 Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 设置上传选项
      const options = {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadTime: new Date().toISOString(),
          },
        },
      };

      // 上传文件
      await fileRef.save(buffer, options);

      // 使公开访问
      await fileRef.makePublic();

      // 生成公开访问URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      console.log("服务端图片上传成功:", publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error("服务端图片上传失败:", error);
      throw new Error(`服务端图片上传失败: ${error.message || "未知错误"}`);
    }
  }
  // 服务端删除图片
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // 从URL中提取文件路径
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.*?)\?/);
      if (!pathMatch) {
        throw new Error("无效的图片URL");
      }

      const filePath = decodeURIComponent(pathMatch[1]);
      const bucket = adminStorage.bucket();
      const file = bucket.file(filePath);

      await file.delete();
    } catch (error) {
      console.error("服务端图片删除失败:", error);
      throw new Error("服务端图片删除失败");
    }
  }

  // 获取图片元数据
  static async getImageMetadata(imageUrl: string) {
    try {
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.*?)\?/);
      if (!pathMatch) {
        throw new Error("无效的图片URL");
      }

      const filePath = decodeURIComponent(pathMatch[1]);
      const bucket = adminStorage.bucket();
      const file = bucket.file(filePath);

      const [metadata] = await file.getMetadata();
      return metadata;
    } catch (error) {
      console.error("获取图片元数据失败:", error);
      throw new Error("获取图片元数据失败");
    }
  }
}
