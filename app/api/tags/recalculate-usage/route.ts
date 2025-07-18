import { NextRequest, NextResponse } from 'next/server';
import { DatabaseAdmin } from '@/lib/database-admin';

// 重新计算所有标签的使用次数
export async function POST(request: NextRequest) {
  try {
    // 获取所有图片和标签
    const [images, tags] = await Promise.all([
      DatabaseAdmin.getAllImages(),
      DatabaseAdmin.getAllTags(),
    ]);

    // 计算每个标签的实际使用次数
    const tagUsageMap = new Map<string, number>();

    // 初始化所有标签的使用次数为0
    tags.forEach((tag) => {
      tagUsageMap.set(tag.id, 0);
    });

    // 统计每个标签在图片中的使用次数
    images.forEach((image) => {
      const tags = image.tags || [];
      tags.forEach((tag) => {
        const currentCount = tagUsageMap.get(tag) || 0;
        tagUsageMap.set(tag, currentCount + 1);
      });
    });

    // 更新所有标签的使用次数
    const updatePromises = Array.from(tagUsageMap.entries()).map(
      async ([tag, actualCount]) => {
        try {
          const tagData = tags.find((t) => t.id === tag);
          if (tagData && tagData.usageCount !== actualCount) {
            // 直接设置为实际使用次数
            const difference = actualCount - tagData.usageCount;
            await DatabaseAdmin.updateTagUsageCount(tag, difference);
            return {
              tagId: tag,
              oldCount: tagData.usageCount,
              newCount: actualCount,
            };
          }
          return null;
        } catch (error) {
          console.error(`更新标签 ${tag} 使用次数失败:`, error);
          return null;
        }
      }
    );

    const results = await Promise.all(updatePromises);
    const updatedTags = results.filter((result) => result !== null);

    return NextResponse.json({
      success: true,
      message: `成功重新计算 ${updatedTags.length} 个标签的使用次数`,
      updatedTags,
    });
  } catch (error) {
    console.error('重新计算标签使用次数失败:', error);
    return NextResponse.json(
      { success: false, error: '重新计算标签使用次数失败' },
      { status: 500 }
    );
  }
}
