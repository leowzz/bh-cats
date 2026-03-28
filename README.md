# 北华大学猫猫网站

基于 `FastAPI + React + Tailwind CSS + SQLite + Docker + RustFS(S3)` 的校园猫档案与社区系统。

## 功能概览

- 猫档案展示、详情、浏览量统计
- 管理后台新增/编辑猫档案
- 首页统计、今日最佳、轮播管理
- 用户邮箱注册登录
- 社区发帖、评论、回复
- 游客/用户点赞切换
- 图片上传自动转 WebP，单文件控制在 400KB 以内
- Docker 部署时图片保存在 RustFS 提供的 S3 兼容对象存储
- SQLite 单机部署保存业务数据

## 本地开发

### 后端

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -e './backend[dev]'
cd backend
pytest -v
uvicorn app.main:app --reload
```

### 前端

```bash
cd frontend
npm install
npm test
npm run dev
```

默认前端开发地址：`http://localhost:5173`

## Docker 运行

```bash
docker compose up --build
```

- 前端：`http://localhost:3000`
- 后端：`http://localhost:8000`
- RustFS S3 API：`http://localhost:9000`
- RustFS Console：`http://localhost:9001`

前端镜像构建时支持以下参数：

- `VITE_API_BASE_URL`：写入前端静态产物，默认 `/api`
- `VITE_MEDIA_BASE_URL`：写入前端静态产物，默认 `/media`
- `BACKEND_BASE_URL`：写入前端容器内的 Nginx 反向代理上游地址，默认 `http://backend:8000`

如果只是在 Docker Compose 容器网络里访问后端，保持 `BACKEND_BASE_URL=http://backend:8000` 即可。

RustFS 相关默认环境变量定义在根目录 `.env`：

- `RUSTFS_ACCESS_KEY`
- `RUSTFS_SECRET_KEY`
- `S3_BUCKET`
- `S3_PUBLIC_BASE_URL`

Compose 启动时会自动创建 `S3_BUCKET` 指定的 bucket，并设置为匿名可读，后端上传后会直接返回完整图片 URL，前端无需额外代理。

## 默认管理员

通过环境变量自动初始化：

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NICKNAME`

## 图片存储

- SQLite：`backend/storage/app.db`
- 本地文件模式上传目录：`backend/storage/uploads/`
- Docker Compose 默认对象存储：RustFS bucket `bh-cats-media`

## RustFS 说明

- 后端通过 S3 兼容接口上传图片对象，数据库里保存完整图片 URL
- 前端保留 `VITE_MEDIA_BASE_URL` 配置用于本地文件模式；当接口返回绝对 URL 时会直接使用该 URL
- 我没有在官方公开文档里查到一个已确认可用的“通过配置文件限制 RustFS 最大占用空间”的 compose 级配置项，所以这里没有默认启用配额限制；如果你后续在 Console 或后台里配置配额，可以直接接着用

## 说明

- 首版不包含 AI 聊天
- 首版不包含邮箱验证码
- 游客点赞依赖浏览器设备标识控制重复点赞
