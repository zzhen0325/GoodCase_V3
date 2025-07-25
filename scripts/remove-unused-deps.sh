#!/bin/bash

# 安全移除未使用的依赖包脚本
# 基于 depcheck 分析结果，只移除确实不需要的依赖

echo "🔍 开始安全移除未使用的依赖包..."

# 备份 package.json
cp package.json package.json.backup
echo "📋 已备份 package.json 到 package.json.backup"

# 移除确实不需要的生产依赖
echo "📦 移除确实不需要的生产依赖..."
npm uninstall @dnd-kit/modifiers @types/jszip gsap jszip node-fetch

# 移除确实不需要的开发依赖
echo "🛠️ 移除确实不需要的开发依赖..."
npm uninstall --save-dev @stagewise-plugins/react @stagewise/toolbar-next

# 保留但注释的依赖（这些可能仍然需要）:
# eslint-config-prettier - 如果使用 prettier 与 eslint 集成
# autoprefixer - Tailwind CSS 可能需要
# postcss - Tailwind CSS 需要
# eslint, eslint-config-next, eslint-plugin-prettier - 代码质量工具
# prettier - 代码格式化
# typescript - TypeScript 编译器

echo "⚠️ 以下依赖已保留（可能仍需要）："
echo "  - eslint-config-prettier (ESLint + Prettier 集成)"
echo "  - autoprefixer (CSS 前缀处理)"
echo "  - postcss (CSS 处理，Tailwind 需要)"
echo "  - eslint 相关包 (代码质量检查)"
echo "  - prettier (代码格式化)"
echo "  - typescript (TypeScript 编译器)"

echo "\n🧪 验证项目是否正常..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ 项目构建成功！"
else
    echo "❌ 项目构建失败，请检查依赖"
    echo "可以使用以下命令恢复："
    echo "cp package.json.backup package.json && npm install"
    exit 1
fi

echo "\n📊 当前包大小分析："
npm list --depth=0 | wc -l
echo "依赖包数量统计完成"

echo "\n✅ 安全依赖清理完成！"
echo "如需恢复，请运行：cp package.json.backup package.json && npm install"