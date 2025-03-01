# FileBox 后端

FileBox后端是一个基于Go语言和Echo框架的文件分享系统API服务。

## 默认管理员账户

系统启动时会自动创建一个默认的管理员账户：
- 用户名：boxer
- 密码：box123

请在生产环境中及时修改默认密码。

## 目录结构

```
backend/
├── api/            # API处理程序
├── config/         # 配置
├── middleware/     # 中间件
├── model/          # 数据模型
├── service/        # 业务逻辑
├── storage/        # 文件存储
├── utils/          # 工具函数
├── go.mod          # Go模块定义
├── go.sum          # Go依赖版本锁定
└── main.go         # 主程序入口
```

## 开发环境

### 要求

- Go 1.21+
- SQLite3 或 PostgreSQL

### 安装依赖

```bash
go mod download
```

### 运行

```bash
go run main.go
```

或者构建后运行：

```bash
go build -o filebox-server
./filebox-server
```

## 配置

通过环境变量配置应用：

```bash
# 基本配置
export PORT=8080
export JWT_SECRET="your-secret-key"
export JWT_EXPIRATION_HOURS=24

# 存储配置
export STORAGE_PATH="./storage"
export STORAGE_ENC_KEY="32字节十六进制密钥"
export MAX_FILE_SIZE=104857600  # 100MB
export MAX_ANONYMOUS_FILE_SIZE=52428800  # 50MB

# 分享配置
export DEFAULT_EXPIRE_DAYS=7
export DEFAULT_DOWNLOAD_LIMIT=5

# 数据库配置 (SQLite)
export DB_TYPE="sqlite"
export DB_PATH="filebox.db"

# 数据库配置 (PostgreSQL)
export DB_TYPE="postgres"
export DB_HOST="localhost"
export DB_PORT="5432"
export DB_USER="postgres"
export DB_PASSWORD="postgres"
export DB_NAME="filebox"

# 管理员配置
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="box123"  # 默认管理员密码
```

## API文档

### 认证

#### 注册用户

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 用户登录

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 刷新令牌

```
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 文件

#### 上传文件

```
POST /api/files
Content-Type: multipart/form-data

file: (binary)
```

#### 获取用户文件列表

```
GET /api/files?page=1&page_size=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 获取文件信息

```
GET /api/files/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 下载文件

```
GET /api/files/:id/download
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 删除文件

```
DELETE /api/files/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 分享

#### 创建分享

```
POST /api/shares
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "file_id": "123e4567-e89b-12d3-a456-426614174000",
  "code": "abc123",  // 可选，不提供则自动生成
  "expires_in": 7,   // 可选，过期天数
  "download_limit": 5  // 可选，下载次数限制
}
```

#### 获取分享信息

```
GET /api/shares/:code
```

#### 下载分享文件

```
GET /api/shares/:code/download
```

#### 获取用户分享列表

```
GET /api/user/shares?page=1&page_size=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 删除分享

```
DELETE /api/user/shares/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 管理员

#### 获取所有用户

```
GET /api/admin/users?page=1&page_size=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 删除用户

```
DELETE /api/admin/users/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 获取所有文件

```
GET /api/admin/files?page=1&page_size=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 删除文件

```
DELETE /api/admin/files/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 获取所有分享

```
GET /api/admin/shares?page=1&page_size=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 删除分享

```
DELETE /api/admin/shares/:id
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 获取系统统计信息

```
GET /api/admin/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
