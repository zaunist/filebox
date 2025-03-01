# 多阶段构建

# 构建参数
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# 后端构建阶段
FROM golang:1.24 AS backend-builder
# 设置工作目录
WORKDIR /build
# 设置 Go 模块代理
ENV GOPROXY=https://goproxy.cn,direct
ENV GO111MODULE=on
# 复制 backend 目录
COPY backend/ ./
# 启用 CGO 以支持 SQLite
RUN CGO_ENABLED=1 GOOS=linux go build -o /filebox-server

# 前端构建阶段
FROM node:18-alpine AS frontend-builder
WORKDIR /app
# 设置 yarn 镜像源
RUN yarn config set registry https://registry.npmmirror.com
# 复制依赖文件
COPY frontend/package.json frontend/yarn.lock* ./
# 安装依赖
RUN yarn install
# 复制源代码
COPY frontend/ ./
# 使用 yarn 构建前端，忽略 TypeScript 错误
ENV CI=false
ENV TSC_COMPILE_ON_ERROR=true
RUN yarn vite build

# 最终镜像 - 包含前端和后端
FROM debian:bookworm
# 添加标签
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.authors="FileBox Team" \
      org.opencontainers.image.title="FileBox" \
      org.opencontainers.image.description="文件存储和分享应用"

# 安装运行所需的库，包括 SQLite 支持和 Nginx
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    libsqlite3-dev \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制后端
COPY --from=backend-builder /filebox-server /app/

# 复制前端构建产物到 Nginx 目录
COPY --from=frontend-builder /app/dist /var/www/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/sites-available/default

# 复制 Supervisor 配置
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 创建存储目录
RUN mkdir -p /app/storage && chmod 777 /app/storage

# 创建数据目录
RUN mkdir -p /app/data && chmod 777 /app/data

# 设置环境变量
ENV PORT=8080
ENV STORAGE_PATH=/app/storage
ENV DB_TYPE=sqlite
ENV DB_PATH=/app/data/filebox.db

# 暴露端口
EXPOSE 80

# 启动命令 - 使用 Supervisor 同时启动 Nginx 和后端服务
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
