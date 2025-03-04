# 📦 FileBox - 文件快递柜

<div align="center">
  
![FileBox Logo](https://img.shields.io/badge/FileBox-文件分享系统-blue?style=for-the-badge&logo=dropbox)

*安全、高效、易用的文件分享解决方案*

</div>

## ✨ 功能特点

- 🔐 **用户认证与授权** - 安全可靠的账户系统
- 📤 **文件上传与管理** - 轻松管理您的所有文件
- 🔗 **文件分享与访问控制** - 灵活控制谁可以访问您的文件
- ⏱️ **文件过期时间设置** - 自动过期，无需手动清理
- 🔢 **下载次数限制** - 精确控制文件的下载次数
- 📱 **响应式前端界面** - 在任何设备上都能获得出色体验
- 📦 **单一二进制文件部署** - 部署简单快捷

## 🚀 快速开始

## Docker 部署

`docker run -d -p 8080:8080 zaunist/filebox:latest`

### 默认管理员账户

系统启动时会自动创建一个默认的管理员账户：

| 邮箱 | 密码 |
|------|------|
| box@zaunist.com | box123... |

> ⚠️ **注意**: 请在生产环境中及时修改默认密码。PS：目前管理员账户没有任何作用，同时也还不支持修改密码

## 🛠️ 技术栈

<table>
  <tr>
    <th>后端</th>
    <th>前端</th>
  </tr>
  <tr>
    <td>
      <ul>
        <li>Go</li>
        <li>Echo Web框架</li>
        <li>GORM ORM库</li>
        <li>SQLite数据库</li>
        <li>JWT认证</li>
        <li>Go Embed（前端静态文件嵌入）</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>React</li>
        <li>TypeScript</li>
        <li>Vite</li>
        <li>TailwindCSS</li>
        <li>React Router</li>
        <li>React Query</li>
        <li>Radix UI组件</li>
      </ul>
    </td>
  </tr>
</table>

## 💻 开发环境设置

### 前提条件
- 🐳 Docker和Docker Compose
- 📦 Node.js 18+（仅用于本地开发）
- 🔧 Go 1.21+（仅用于本地开发）

### 使用Docker启动开发环境

1️⃣ 克隆仓库
```bash
git clone https://github.com/zaunist/filebox.git
cd filebox
```

2️⃣ 启动Docker容器
```bash
docker-compose up
```

3️⃣ 访问应用
- 🌐 应用: http://localhost:8080

### 本地开发

1️⃣ 克隆仓库
```bash
git clone https://github.com/zaunist/filebox.git
cd filebox
```

2️⃣ 使用构建脚本构建应用
```bash
chmod +x build.sh
./build.sh
```

3️⃣ 运行应用
```bash
./backend/filebox-server
```

4️⃣ 访问应用
- 🌐 应用: http://localhost:8080

## 📂 项目结构

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

## 🔄 持续集成/持续部署

本项目使用 GitHub Actions 进行持续集成和部署：

### Docker 镜像构建和推送

当代码推送到 `main` 分支或创建新的版本标签（格式为 `v*`）时，会自动构建 Docker 镜像并推送到 DockerHub：

- 🏗️ 构建多平台镜像（支持 x86_64，arm的构建有问题，目前作者也用不上，就没去管）
- 🏷️ 自动添加适当的标签（版本号、分支名、SHA 等）

要使用此功能，需要在 GitHub 仓库设置中添加以下 Secrets：
- `DOCKERHUB_USERNAME`: DockerHub 用户名
- `DOCKERHUB_TOKEN`: DockerHub 访问令牌

详细说明请参考 [.github/workflows/README.md](.github/workflows/README.md)

## 💡 AI主力开发

由 cursor + claude-3.7-sonnet 开发完成，作者仅仅按 `enter`，让 AI 继续干活。

> PS：修改多了以后AI有些抽风，后期还是得作者介入才能完成。

## 📜 许可证

MIT
