# 北华大学猫猫网站（校园猫档案与社区）系统设计文档

## 1. 概述

本项目实现一个面向北华大学校园猫管理与社区互动的完整 Web 系统，首版采用单体架构，技术栈固定为 FastAPI、React、Tailwind CSS、SQLite、Docker。本系统包含前台站点与管理后台，围绕猫档案管理、首页运营、社区互动、用户认证与图片处理展开。

## 2. 首版范围

### 2.1 包含功能

- 猫猫档案展示、检索、排序、详情浏览
- 管理后台维护猫档案
- 首页数据汇总、轮播、今日最佳自动推荐
- 社区帖子、评论、回复、点赞
- 用户邮箱注册登录
- 管理员账号自动初始化
- 本地目录图片存储
- 图片上传后统一转为 WebP
- 所有落盘图片转码后控制在 400KB 以下
- Docker 本地部署

### 2.2 明确不做

- AI 聊天
- 邮箱验证码 / 邮件激活
- 社区内容审核流
- 普通用户新增或编辑猫档案

## 3. 用户角色与权限

### 3.1 游客

- 浏览首页
- 浏览猫档案列表与详情
- 浏览社区帖子与评论
- 点赞猫、帖子、评论

### 3.2 普通用户

- 游客全部权限
- 邮箱注册与登录
- 发布帖子
- 发布评论与回复
- 编辑和删除自己的帖子
- 编辑和删除自己的评论

### 3.3 管理员

- 普通用户全部权限
- 进入后台管理页面
- 新增、编辑、隐藏、显示猫档案
- 管理首页轮播
- 查看后台统计数据

## 4. 总体架构

### 4.1 架构方案

采用方案 A：单体后端 + 单个 React 前端。

- `backend/`：FastAPI 提供 REST API、鉴权、数据访问、图片处理、静态文件服务
- `frontend/`：React + Tailwind CSS，统一承载用户前台和管理后台
- `storage/`：本地目录持久化保存图片文件
- `docker-compose.yml`：编排前后端服务，并挂载 SQLite 数据文件与图片目录

### 4.2 设计原则

- 保持首版单机部署友好，优先简单稳定
- 前端只通过 API 访问业务数据
- 图片文件与业务元数据分离存储
- 用服务层封装图片与删除逻辑，避免数据库和文件系统状态不一致
- 保留适度可扩展字段，但避免过度工程化

## 5. 核心数据模型

### 5.1 users

字段建议：

- `id`
- `email`，唯一
- `password_hash`
- `nickname`
- `role`，枚举：`user` / `admin`
- `is_active`
- `created_at`

说明：

- 启动时根据配置初始化管理员账号
- 密码仅保存哈希值

### 5.2 cats

字段建议：

- `id`
- `name`
- `campus`，枚举：`east` / `south` / `north`
- `breed`
- `gender`，枚举：`male` / `female` / `unknown`
- `sterilized`
- `location`
- `personality_tags`，JSON 字符串
- `description`
- `status`，枚举：`visible` / `hidden`
- `view_count`
- `like_count`
- `created_at`
- `updated_at`

### 5.3 cat_images

字段建议：

- `id`
- `cat_id`
- `file_path`
- `thumb_path`
- `sort_order`
- `is_cover`
- `width`
- `height`
- `created_at`

### 5.4 posts

字段建议：

- `id`
- `author_id`
- `related_cat_id`，可空
- `title`
- `content`
- `status`
- `like_count`
- `comment_count`
- `created_at`
- `updated_at`

说明：

- 帖子支持关联已有猫档案
- 社区内容首版默认为立即可见

### 5.5 post_images

字段建议：

- `id`
- `post_id`
- `file_path`
- `thumb_path`
- `sort_order`
- `width`
- `height`
- `created_at`

### 5.6 comments

字段建议：

- `id`
- `post_id`
- `author_id`
- `parent_id`，可空
- `content`
- `like_count`
- `created_at`
- `updated_at`

说明：

- `parent_id` 为空表示一级评论
- 首版前端展示为两层结构：评论 + 回复

### 5.7 banners

字段建议：

- `id`
- `title`
- `subtitle`
- `link_url`
- `sort_order`
- `is_active`
- `created_at`
- `updated_at`

### 5.8 banner_images

字段建议：

- `id`
- `banner_id`
- `file_path`
- `thumb_path`
- `sort_order`
- `width`
- `height`
- `created_at`

### 5.9 likes

字段建议：

- `id`
- `target_type`，枚举：`cat` / `post` / `comment`
- `target_id`
- `user_id`，可空
- `device_id`，可空
- `created_at`

说明：

- 登录用户按 `user_id` 去重
- 游客按 `device_id` 去重
- 点赞接口采用 toggle 语义：已点赞则取消，未点赞则新增

## 6. 图片上传与处理设计

### 6.1 上传范围

以下对象均支持多图：

- 猫档案
- 帖子
- 首页轮播

### 6.2 存储结构

建议目录：

- `storage/uploads/cats/<cat_id>/`
- `storage/uploads/posts/<post_id>/`
- `storage/uploads/banners/<banner_id>/`

文件命名：

- 主图：`<uuid>.webp`
- 缩略图：`<uuid>_thumb.webp`

### 6.3 转码规则

- 接收 `jpg`、`jpeg`、`png`、`webp`
- 使用 Pillow 统一转为 `webp`
- 所有最终落盘图片必须小于 400KB
- 原始上传文件不保留
- 如需压缩，采用“先调低质量，再缩小分辨率”的递减策略
- 主图与缩略图都必须满足 400KB 限制

### 6.4 建议限制

- 帖子单次最多 9 张图
- 猫档案最多 12 张图
- 轮播单项最多 5 张图

### 6.5 静态资源访问

FastAPI 直接挂载本地目录：

- `/media/*` 对应 `storage/uploads/*`

### 6.6 删除清理

删除业务对象时，同步删除：

- 数据库图片记录
- 本地目录中的对应图片文件

删除逻辑必须由服务层统一封装。

## 7. 认证与安全

### 7.1 认证方式

- 注册：邮箱 + 密码
- 登录：邮箱 + 密码
- 不做邮箱验证码
- 登录成功后签发 JWT
- 前端通过请求头携带令牌访问需要登录的接口

### 7.2 管理员初始化

配置项：

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NICKNAME`

应用启动时：

- 若不存在对应邮箱用户，则自动创建管理员
- 若已存在，则不重复插入

### 7.3 游客设备标识

- 前端首次访问生成随机 `device_id`
- 持久化保存到 `localStorage`
- 游客点赞时将该值提交给后端

## 8. 首页与运营逻辑

### 8.1 首页展示内容

- 校猫总数
- 今日活跃猫数
- 轮播图
- 今日最佳
- 热门猫猫
- 最新社区帖子

### 8.2 今日最佳自动计算

从当前可见猫档案中动态选出一只得分最高的猫。

建议得分公式：

`score = like_count * 5 + view_count * 1 + related_post_count * 8 + recent_activity_bonus`

其中：

- `related_post_count`：关联该猫的帖子数量
- `recent_activity_bonus`：最近 7 天新增帖子、评论、点赞带来的活跃加分

首页接口同时返回：

- 今日最佳猫数据
- 推荐分值
- 自动生成的上榜理由

## 9. 页面与路由结构

### 9.1 前台页面

- `/`：首页
- `/cats`：猫档案列表
- `/cats/:id`：猫详情页
- `/community`：社区帖子流
- `/posts/:id`：帖子详情页
- `/login`：登录页
- `/register`：注册页
- `/profile`：个人中心

### 9.2 后台页面

- `/admin`：仪表盘
- `/admin/cats`：猫档案管理
- `/admin/cats/new`：新增猫档案
- `/admin/cats/:id/edit`：编辑猫档案
- `/admin/banners`：轮播管理

## 10. 后端接口分组

建议 API 分组：

- `/api/auth`
- `/api/home`
- `/api/cats`
- `/api/posts`
- `/api/comments`
- `/api/likes`
- `/api/banners`
- `/api/admin/*`

## 11. 工程目录建议

```text
backend/
  app/
    api/
    core/
    models/
    schemas/
    services/
    db/
    main.py
  storage/
frontend/
  src/
    components/
    features/
    hooks/
    lib/
    pages/
docs/
  superpowers/
    specs/
    plans/
docker-compose.yml
README.md
.env.example
```

## 12. 测试策略

首版建议覆盖以下测试层级：

- 后端单元测试：认证、点赞切换、图片压缩、今日最佳算法
- 后端接口测试：注册登录、猫档案 CRUD、帖子/评论、轮播管理
- 前端关键交互测试：登录注册、发帖、评论、后台管理核心流程
- 手工联调：图片上传、静态文件访问、Docker 启动链路

## 13. 风险与约束

- SQLite 适合首版与单机部署，不适合高并发写入场景
- 游客点赞基于浏览器设备标识，只能实现轻量级防刷，无法替代强风控
- 严格压缩到 400KB 以内会显著影响超大图片的画质，需要在质量和清晰度之间做折中
- 本地目录存储适合当前目标，后续扩容时可替换为对象存储

## 14. 最终实施结论

首版系统按以下原则实施：

- 单体架构，前后端分离
- 单 React 工程同时承载前台与后台
- FastAPI + SQLite 作为核心业务基础
- 本地目录存图，统一转 WebP，并保证所有落盘图片小于 400KB
- 管理员从配置自动初始化
- 今日最佳采用动态评分算法
- 社区内容即时发布
- 猫档案仅允许后台维护
