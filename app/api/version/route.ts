import { NextRequest, NextResponse } from 'next/server';
import { VersionManager } from '@/lib/version-manager';

/**
 * 版本信息 API
 * GET /api/version - 获取当前版本信息
 * GET /api/version?report=true - 获取详细版本报告
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const generateReport = searchParams.get('report') === 'true';
    
    if (generateReport) {
      // 生成详细版本报告
      const report = VersionManager.generateVersionReport();
      
      return new NextResponse(report, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    } else {
      // 返回当前版本信息
      const versions = VersionManager.getCurrentVersions();
      const history = VersionManager.getVersionHistory();
      
      return NextResponse.json({
        success: true,
        data: {
          current: versions,
          history: history,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('获取版本信息失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '获取版本信息失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * 版本兼容性检查 API
 * POST /api/version - 检查客户端版本兼容性
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientVersion } = body;
    
    if (typeof clientVersion !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: '无效的客户端版本号',
          message: 'clientVersion 必须是数字类型'
        },
        { status: 400 }
      );
    }
    
    const compatibility = VersionManager.checkCompatibility(clientVersion);
    
    return NextResponse.json({
      success: true,
      data: {
        compatibility,
        currentVersion: VersionManager.getCurrentVersions().indexedDB,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('版本兼容性检查失败:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '版本兼容性检查失败',
        message: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}