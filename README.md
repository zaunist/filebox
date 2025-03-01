# FileBox - 文件分享系统

FileBox是一个现代化的文件分享系统，允许用户上传、管理和分享文件。系统支持文件访问控制、过期时间设置和下载次数限制等功能。

灵感来自 https://github.com/vastsa/FileCodeBox ，由 cursor + claude-3.7-sonnet 开发完成，作者仅仅按 `enter`，让 AI 继续干活。
PS：修改多了以后AI有些抽风，后期还是得作者介入才能完成。

## 功能特点

- 用户认证与授权
- 文件上传与管理
- 文件分享与访问控制
- 文件过期时间设置
- 下载次数限制
- 管理员控制面板
- 响应式前端界面
- 单一二进制文件部署（前端嵌入后端）

## 默认管理员账户

系统启动时会自动创建一个默认的管理员账户：
- 用户名：boxer
- 密码：box123

请在生产环境中及时修改默认密码。

## 技术栈

### 后端
- Go
- Echo Web框架
- GORM ORM库
- SQLite数据库
- JWT认证
- Go Embed（前端文件嵌入）

### 前端
- React
- TypeScript
- Vite
- TailwindCSS
- React Router
- React Query
- Radix UI组件

## 开发环境设置

### 前提条件
- Docker和Docker Compose
- Node.js 18+（仅用于本地开发）
- Go 1.21+（仅用于本地开发）

### 使用Docker启动开发环境

1. 克隆仓库
```bash
git clone https://github.com/yourusername/filebox.git
cd filebox
```

2. 启动Docker容器
```bash
docker-compose up
```

3. 访问应用
- 应用: http://localhost:8080

### 本地开发

1. 克隆仓库
```bash
git clone https://github.com/yourusername/filebox.git
cd filebox
```

2. 使用构建脚本构建应用
```bash
chmod +x build.sh
./build.sh
```

3. 运行应用
```bash
./backend/filebox-server
```

4. 访问应用
- 应用: http://localhost:8080

## 项目结构

```
filebox/
├── backend/             # Go后端代码
│   ├── api/             # API处理器
│   ├── config/          # 配置
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── services/        # 业务逻辑
│   ├── filestore/       # 文件存储
│   ├── utils/           # 工具函数
│   ├── frontend_dist/   # 嵌入的前端构建产物
│   ├── main.go          # 入口文件
│   └── embed.go         # 前端文件嵌入
│
├── frontend/            # React前端代码
│   ├── src/             # 源代码
│   │   ├── api/         # API客户端
│   │   ├── components/  # UI组件
│   │   ├── hooks/       # React钩子
│   │   ├── lib/         # 工具库
│   │   ├── pages/       # 页面组件
│   │   └── App.tsx      # 主应用组件
│   ├── public/          # 静态资源
│   └── vite.config.ts   # Vite配置
│
├── .github/             # GitHub配置
│   └── workflows/       # GitHub Actions工作流
│       ├── docker-build-push.yml  # Docker构建和推送工作流
│
├── build.sh             # 本地构建脚本
└── docker-compose.yml   # Docker Compose配置
```

## 持续集成/持续部署

本项目使用 GitHub Actions 进行持续集成和部署：

### 代码检查工作流

每次推送到 `main` 分支或创建 Pull Request 时，会自动运行代码检查工作流，包括：

- 后端 Go 代码检查和测试
- 前端 ESLint 检查、类型检查和构建测试

### Docker 镜像构建和推送

当代码推送到 `main` 分支或创建新的版本标签（格式为 `v*`）时，会自动构建 Docker 镜像并推送到 DockerHub：

- 构建多平台镜像（支持 x86_64），arm 在拉取依赖时报错，也用不上，不管了
- 自动添加适当的标签（版本号、分支名、SHA 等）
- 使用缓存加速构建过程

要使用此功能，需要在 GitHub 仓库设置中添加以下 Secrets：
- `DOCKERHUB_USERNAME`: DockerHub 用户名
- `DOCKERHUB_TOKEN`: DockerHub 访问令牌

详细说明请参考 [.github/workflows/README.md](.github/workflows/README.md)

## 许可证

MIT
