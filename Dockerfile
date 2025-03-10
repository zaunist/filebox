# 多阶段构建

# 构建参数
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

# 前端构建阶段
FROM node:18-alpine AS frontend-builder
WORKDIR /app
# 复制依赖文件
COPY frontend/package.json frontend/yarn.lock* ./
# 设置国内源 并安装依赖
RUN yarn config set registry https://registry.npmmirror.com && yarn install
# 复制源代码
COPY frontend/ ./
# 使用 yarn 构建前端，忽略 TypeScript 错误
ENV CI=false
ENV TSC_COMPILE_ON_ERROR=true
# 直接使用vite构建，跳过类型检查
RUN yarn vite build --emptyOutDir

# 后端构建阶段
FROM golang:1.24 AS backend-builder
# 设置工作目录
WORKDIR /build
# 设置 Go 模块代理
ENV GOPROXY=https://goproxy.cn,direct
ENV GO111MODULE=on
# 复制 backend 目录
COPY backend/ ./
# 创建前端构建产物目录
RUN mkdir -p frontend_dist
# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/dist/ ./frontend_dist/
# 启用 CGO 以支持 SQLite
RUN CGO_ENABLED=1 GOOS=linux go build -o /filebox-server

# 最终镜像 - 只包含后端二进制文件
FROM debian:bookworm
# 添加标签
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.authors="zaunist" \
      org.opencontainers.image.title="FileBox" \
      org.opencontainers.image.description="文件快递柜"

# 安装运行所需的库，包括 SQLite 支持
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 复制后端二进制文件
COPY --from=backend-builder /filebox-server /app/

# 创建存储目录
RUN mkdir -p /app/storage && chmod 777 /app/storage

# 创建数据目录
RUN mkdir -p /app/data && chmod 777 /app/data

# 设置环境变量
ENV STORAGE_PATH=/app/storage
ENV DB_TYPE=sqlite
ENV DB_PATH=/app/data/filebox.db

# 暴露端口
EXPOSE 8080

# 启动命令 - 直接运行后端服务
CMD ["/app/filebox-server"]
