#!/bin/bash

# 部署修复脚本
# 解决生产环境500错误和上传超时问题

echo "🚀 开始部署修复..."

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：请在项目根目录运行此脚本"
    exit 1
fi

# 提交更改
echo "📝 提交代码更改..."
git add .
git commit -m "修复生产环境500错误：增加内存限制、超时处理和请求体大小限制"

# 推送到仓库
echo "📤 推送到仓库..."
git push origin main

echo "✅ 部署修复完成！"
echo "📋 修复内容："
echo "   - Cloud Run内存从1Gi增加到2Gi"
echo "   - CPU从1核增加到2核"
echo "   - 添加300秒超时限制"
echo "   - 请求体大小限制增加到50MB"
echo "   - 修正部署区域为europe-west1"
echo "   - 增强错误处理和日志记录"
echo ""
echo "🔍 请检查Cloud Build状态："
echo "   https://console.cloud.google.com/cloud-build/builds"