#!/bin/bash

# 构建前端
echo "构建前端..."
cd frontend
yarn install
# 设置环境变量，忽略TypeScript错误
export CI=false
export TSC_COMPILE_ON_ERROR=true
# 直接使用vite构建，跳过类型检查
yarn vite build --emptyOutDir
cd ..

# 创建前端构建产物目录
echo "准备前端构建产物..."
mkdir -p backend/frontend_dist
cp -r frontend/dist/* backend/frontend_dist/

# 构建后端
echo "构建后端..."
cd backend
go build -o filebox-server

echo "构建完成！"
echo "可以通过运行 ./backend/filebox-server 启动应用" 