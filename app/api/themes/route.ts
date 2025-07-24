import { NextRequest, NextResponse } from 'next/server';
import { PRESET_THEMES } from '@/types';

// GET - 获取所有预制主题
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const colorName = searchParams.get('color');
    
    // 如果指定了颜色名称，返回单个主题
    if (colorName) {
      if (colorName in PRESET_THEMES) {
        const theme = {
          name: colorName,
          colors: PRESET_THEMES[colorName as keyof typeof PRESET_THEMES]
        };
        
        return NextResponse.json({
          success: true,
          data: theme
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: '指定的主题不存在',
              details: {
                availableThemes: Object.keys(PRESET_THEMES)
              }
            }
          },
          { status: 404 }
        );
      }
    }
    
    // 返回所有主题
    const themes = Object.entries(PRESET_THEMES).map(([name, colors]) => ({
      name,
      colors
    }));
    
    return NextResponse.json({
      success: true,
      data: themes,
      meta: {
        total: themes.length,
        availableColors: Object.keys(PRESET_THEMES)
      }
    });
    
  } catch (error) {
    console.error('获取主题失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取主题失败'
        }
      },
      { status: 500 }
    );
  }
}
