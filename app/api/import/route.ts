import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { ExportData, ImportOptions } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, options }: { data: ExportData; options: ImportOptions } = body;

    // 验证数据格式
    if (!data || !data.version || !Array.isArray(data.images) || !Array.isArray(data.tags)) {
      return NextResponse.json(
        { error: '无效的导入数据格式' },
        { status: 400 }
      );
    }

    // 验证版本兼容性
    if (data.version !== '1.0.0') {
      return NextResponse.json(
        { error: `不支持的数据版本: ${data.version}` },
        { status: 400 }
      );
    }

    // 设置默认导入选项
    const importOptions: ImportOptions = {
      mode: options?.mode || 'merge',
      skipDuplicates: options?.skipDuplicates ?? true,
      preserveIds: options?.preserveIds ?? false,
    };

    // 执行导入
    const result = await Database.importData(data, importOptions);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error('导入失败:', error);
    return NextResponse.json(
      { error: '导入失败' },
      { status: 500 }
    );
  }
}