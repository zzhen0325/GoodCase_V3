# 构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 复制应用代码
COPY . .

# 构建 Next.js 应用
RUN npm run build

# 生产阶段
FROM node:20-alpine AS runner

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]