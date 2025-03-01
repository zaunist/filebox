# GitHub Actions 工作流说明

本项目使用 GitHub Actions 自动构建并推送 Docker 镜像到 DockerHub。

## 多平台构建

工作流配置为构建以下平台的 Docker 镜像：
- linux/amd64 (x86_64)
- linux/arm64 (ARM64/aarch64)

## 必要的 GitHub Secrets

在使用此工作流之前，您需要在 GitHub 仓库设置中添加以下 Secrets：

1. `DOCKERHUB_USERNAME` - 您的 DockerHub 用户名
2. `DOCKERHUB_TOKEN` - 您的 DockerHub 访问令牌（不是密码）

### 如何获取 DockerHub 访问令牌

1. 登录您的 DockerHub 账户
2. 点击右上角的头像，选择 "Account Settings"
3. 在左侧菜单中选择 "Security"
4. 点击 "New Access Token"
5. 输入令牌描述（例如："GitHub Actions"）
6. 选择适当的权限（至少需要 "Read & Write"）
7. 点击 "Generate"
8. 复制生成的令牌（这是您唯一能看到它的机会）

### 如何添加 GitHub Secrets

1. 在您的 GitHub 仓库页面，点击 "Settings"
2. 在左侧菜单中选择 "Secrets and variables" -> "Actions"
3. 点击 "New repository secret"
4. 添加 `DOCKERHUB_USERNAME` 和 `DOCKERHUB_TOKEN` 两个 secret

## 触发条件

此工作流会在以下情况下触发：
- 推送到 `main` 分支
- 创建新的标签（格式为 `v*`，例如 `v1.0.0`）
- 创建针对 `main` 分支的 Pull Request

## 镜像标签

工作流会自动为构建的镜像添加以下标签：
- 分支名称（例如：`main`）
- PR 编号（例如：`pr-42`）
- 语义化版本（例如：`v1.0.0`、`1.0`）
- Git SHA（例如：`sha-a1b2c3d4e5f6`）
- `latest`（仅当推送到默认分支时） 