# 北华大学猫猫网站

基于 `FastAPI + React + Tailwind CSS + SQLite + Docker` 的校园猫档案与社区系统。

## 功能概览

- 猫档案展示、详情、浏览量统计
- 管理后台新增/编辑猫档案
- 首页统计、今日最佳、轮播管理
- 用户邮箱注册登录
- 社区发帖、评论、回复
- 游客/用户点赞切换
- 图片上传自动转 WebP，落盘文件控制在 400KB 以内
- SQLite 单机部署，图片保存在本地目录

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

## 默认管理员

通过环境变量自动初始化：

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NICKNAME`

## 图片存储

- SQLite：`backend/storage/app.db`
- 上传目录：`backend/storage/uploads/`

## 说明

- 首版不包含 AI 聊天
- 首版不包含邮箱验证码
- 游客点赞依赖浏览器设备标识控制重复点赞
