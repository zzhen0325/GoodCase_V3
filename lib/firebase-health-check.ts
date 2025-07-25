import { getAdminDb, getAdminStorage } from './firebase-admin';

// Firebase健康检查工具
export class FirebaseHealthCheck {
  // 检查Firebase Admin SDK配置
  static async checkAdminConfig(): Promise<{
    success: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 检查环境变量
      if (!process.env.FIREBASE_PROJECT_ID) {
        errors.push('缺少环境变量: FIREBASE_PROJECT_ID');
      }
      if (!process.env.FIREBASE_CLIENT_EMAIL) {
        errors.push('缺少环境变量: FIREBASE_CLIENT_EMAIL');
      }
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        errors.push('缺少环境变量: FIREBASE_PRIVATE_KEY');
      }
      if (!process.env.FIREBASE_STORAGE_BUCKET) {
        warnings.push('缺少环境变量: FIREBASE_STORAGE_BUCKET');
      }

      // 尝试初始化Firebase
      const db = getAdminDb();
      const storage = getAdminStorage();

      // 测试Firestore连接
      try {
        await db.collection('_health_check').limit(1).get();
        console.log('✅ Firestore连接正常');
      } catch (error: any) {
        errors.push(`Firestore连接失败: ${error.message}`);
      }

      // 测试Storage连接
      try {
        const bucket = storage.bucket();
        await bucket.getMetadata();
        console.log('✅ Firebase Storage连接正常');
      } catch (error: any) {
        errors.push(`Firebase Storage连接失败: ${error.message}`);
      }

      return {
        success: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error: any) {
      errors.push(`Firebase初始化失败: ${error.message}`);
      return {
        success: false,
        errors,
        warnings,
      };
    }
  }

  // 检查客户端Firebase配置
  static checkClientConfig(): {
    success: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        errors.push(`缺少环境变量: ${envVar}`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  // 生成健康检查报告
  static async generateReport(): Promise<string> {
    console.log('🔍 开始Firebase健康检查...');

    const clientCheck = this.checkClientConfig();
    const adminCheck = await this.checkAdminConfig();

    let report = '\n=== Firebase 健康检查报告 ===\n\n';

    // 客户端配置检查
    report += '📱 客户端配置:\n';
    if (clientCheck.success) {
      report += '  ✅ 客户端配置正常\n';
    } else {
      report += '  ❌ 客户端配置有问题:\n';
      clientCheck.errors.forEach((error) => {
        report += `    - ${error}\n`;
      });
    }

    if (clientCheck.warnings.length > 0) {
      report += '  ⚠️ 警告:\n';
      clientCheck.warnings.forEach((warning) => {
        report += `    - ${warning}\n`;
      });
    }

    report += '\n';

    // 服务端配置检查
    report += '🖥️ 服务端配置:\n';
    if (adminCheck.success) {
      report += '  ✅ 服务端配置正常\n';
    } else {
      report += '  ❌ 服务端配置有问题:\n';
      adminCheck.errors.forEach((error) => {
        report += `    - ${error}\n`;
      });
    }

    if (adminCheck.warnings.length > 0) {
      report += '  ⚠️ 警告:\n';
      adminCheck.warnings.forEach((warning) => {
        report += `    - ${warning}\n`;
      });
    }

    report += '\n=== 检查完成 ===\n';

    console.log(report);
    return report;
  }
}
