# Fixit 开发任务文档

| 文档信息 | 内容 |
|---------|------|
| 产品名称 | Fixit |
| 文档版本 | v1.0 |
| 创建日期 | 2026-02-01 |
| 关联文档 | PRD.md, TechDesign.md |

---

## 目录

1. [项目阶段规划](#1-项目阶段规划)
2. [任务清单](#2-任务清单)
3. [开发环境准备](#3-开发环境准备)
4. [启动步骤](#4-启动步骤)

---

## 1. 项目阶段规划

### 阶段一：基础框架 (Week 1-2)

完成项目脚手架搭建和基础功能。

| 序号 | 任务 | 描述 | 预估工作量 |
|-----|------|------|-----------|
| P1.1 | 项目初始化 | 前端 Vite + React + TS 项目初始化 | 0.5天 |
| P1.2 | 后端初始化 | NestJS 项目初始化 + Prisma 配置 | 0.5天 |
| P1.3 | 数据库设计 | 创建数据库表结构和索引 | 0.5天 |
| P1.4 | 开发环境 | Docker Compose 配置（PostgreSQL + MinIO） | 0.5天 |
| P1.5 | 基础架构 | 前端路由、状态管理、API 封装 | 1天 |
| P1.6 | 基础 UI | Ant Design 配置、布局组件、全局样式 | 1天 |

**阶段目标**：能跑起来的前后端框架，数据库连接正常。

---

### 阶段二：用户系统 (Week 2-3)

完成用户注册、登录、认证功能。

| 序号 | 任务 | 描述 | 预估工作量 |
|-----|------|------|-----------|
| P2.1 | 用户注册 | 注册接口 + 前端页面 | 1天 |
| P2.2 | 用户登录 | 登录接口 + 前端页面 + JWT 认证 | 1天 |
| P2.3 | 身份验证 | JWT Guard、拦截器、路由保护 | 1天 |
| P2.4 | 用户设置 | 个人资料编辑、密码修改 | 1天 |

**阶段目标**：用户可以注册登录，访问受保护页面。

---

### 阶段三：题目录入 (Week 3-5)

核心功能：题目的增删改查 + AI 导入。

| 序号 | 任务 | 描述 | 预估工作量 |
|-----|------|------|-----------|
| P3.1 | 题目 CRUD | 题目创建、查询、编辑、删除接口 | 1.5天 |
| P3.2 | Markdown 编辑器 | 集成 react-markdown + KaTeX | 1天 |
| P3.3 | 图片上传 | MinIO 文件上传 + 预览 | 1天 |
| P3.4 | 标签系统 | 标签 CRUD、题目打标签 | 1天 |
| P3.5 | 题目录入页 | 前端录入页面（题目/答案/解析分开） | 1.5天 |
| P3.6 | AI 题目识别 | 从图片识别题目内容 | 1.5天 |
| P3.7 | AI 生成答案 | 根据题目 + 指令生成答案 | 1天 |
| P3.8 | AI 生成解析 | 根据题目 + 指令生成解析 | 1天 |

**阶段目标**：用户可以录入题目，支持 Markdown 格式，AI 可以辅助生成内容。

---

### 阶段四：题库管理 (Week 5-6)

题目列表、筛选、详情展示。

| 序号 | 任务 | 描述 | 预估工作量 |
|-----|------|------|-----------|
| P4.1 | 题目列表 | 列表分页、排序 | 1天 |
| P4.2 | 条件筛选 | 按学科、标签、掌握程度筛选 | 1天 |
| P4.3 | 全文搜索 | 题目内容搜索 | 0.5天 |
| P4.4 | 题目详情 | 题目详情页 + Markdown 渲染 | 1天 |
| P4.5 | 题目编辑 | 编辑已有题目 | 0.5天 |

**阶段目标**：用户可以方便地查看和管理自己的题目。

---

### 阶段五：复习训练 (Week 6-7)

刷题模式和复习流程。

| 序号 | 任务 | 描述 | 预估工作量 |
|-----|------|------|-----------|
| P5.1 | 待复习筛选 | 根据艾宾浩斯曲线筛选待复习题目 | 1天 |
| P5.2 | 刷题模式 | 极简刷题界面、快捷键操作 | 1.5天 |
| P5.3 | 复习记录 | 记录每次复习结果 | 1天 |
| P5.4 | 掌握度计算 | 基于复习次数更新掌握程度 | 0.5天 |

**阶段目标**：用户可以高效地刷题复习，系统自动跟踪掌握程度。

---

### 阶段六：数据统计 (Week 7-8)

数据看板和可视化。

| 序号 | 任务 | 描述 | 预估工作量 |
|-----|------|------|-----------|
| P6.1 | 统计接口 | 题目数量、复习次数等统计 | 1天 |
| P6.2 | 学习热力图 | GitHub 风格热力图 | 1天 |
| P6.3 | 掌握度分布 | 饼图展示掌握程度分布 | 0.5天 |
| P6.4 | 仪表盘 | 首页数据概览 | 0.5天 |

**阶段目标**：用户可以直观看到自己的学习进度。

---

## 2. 任务清单

### 第一阶段详细任务

#### P1.1 项目初始化 (前端)

```bash
# 创建项目
npm create vite@latest fixit-web -- --template react-ts
cd fixit-web

# 安装依赖
npm install antd @ant-design/icons react-router-dom zustand axios
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node

# Markdown 相关
npm install react-markdown remark-math rehype-katex katex
```

**交付物**：
- [ ] 可运行的 React 项目
- [ ] 基础目录结构

#### P1.2 项目初始化 (后端)

```bash
# 创建 NestJS 项目
npm i -g @nestjs/cli
nest new fixit-api

# 安装依赖
npm install @prisma/client @nestjs/passport passport-jwt bcrypt class-validator class-transformer
npm install -D prisma @types/passport-jwt @types/bcrypt
```

**交付物**：
- [ ] 可运行的 NestJS 项目
- [ ] Prisma 配置

#### P1.3 数据库设计

```bash
# 初始化 Prisma
npx prisma init

# 编辑 schema.prisma (参考 TechDesign.md 4.1)
npx prisma migrate dev --name init
```

**交付物**：
- [ ] 数据库表创建
- [ ] Prisma Client 生成

#### P1.4 开发环境 (Docker)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: fixit
      POSTGRES_PASSWORD: fixit
      POSTGRES_DB: fixit
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: password123
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

**交付物**：
- [ ] docker-compose.yml
- [ ] 数据库和 MinIO 可正常启动

---

## 3. 开发环境准备

### 3.1 必要工具

| 工具 | 版本 | 用途 |
|-----|------|------|
| Node.js | >= 18 | 前端/后端运行环境 |
| npm/yarn/pnpm | 最新 | 包管理 |
| Docker Desktop | 最新 | 数据库、MinIO |
| Git | 最新 | 版本控制 |
| VS Code | 最新 | IDE (推荐) |

### 3.2 环境变量配置

#### 前端 (.env)

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

#### 后端 (.env)

```bash
# Database
DATABASE_URL="postgresql://fixit:fixit@localhost:5432/fixit"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# MinIO
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="admin"
MINIO_SECRET_KEY="password123"
MINIO_BUCKET="fixit-files"

# OpenAI
OPENAI_API_KEY="sk-xxxxx"
```

---

## 4. 启动步骤

### 4.1 启动基础设施

```bash
# 启动数据库和 MinIO
docker-compose up -d

# 验证 PostgreSQL
docker exec -it fixit-postgres psql -U fixit -c "SELECT 1;"

# 访问 MinIO Console
# 打开浏览器访问 http://localhost:9001
# 用户名: admin
# 密码: password123
# 创建 bucket: fixit-files
```

### 4.2 启动后端

```bash
cd fixit-api

# 安装依赖
npm install

# 初始化数据库
npx prisma migrate dev --name init

# 启动开发服务器
npm run start:dev
# 后端运行在 http://localhost:3000
```

### 4.3 启动前端

```bash
cd fixit-web

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 前端运行在 http://localhost:5173
```

### 4.4 验证安装

```bash
# 1. 访问前端页面 http://localhost:5173
# 2. 点击注册，测试用户系统
# 3. 测试题目录入
# 4. 测试图片上传
```

---

## 5. 开发规范速查

### 5.1 Git 使用

```bash
# 创建功能分支
git checkout -b feature/user-auth

# 提交规范
git commit -m "feat(user): add login functionality"
git commit -m "fix(auth): fix token refresh bug"

# 合并到主分支
git checkout develop
git merge feature/user-auth
```

### 5.2 代码风格

```bash
# 前端格式化
cd fixit-web
npm run format

# 后端格式化
cd fixit-api
npm run format
```

---

## 6. 里程碑检查点

| 阶段 | 检查点 | 验收标准 |
|-----|-------|---------|
| P1 | 框架完成 | 前后端可运行，数据库连接正常 |
| P2 | 用户系统 | 可注册、登录、受保护页面可访问 |
| P3 | 题目录入 | 可录入题目，支持 Markdown 和图片 |
| P3 | AI 功能 | AI 可识别图片生成题目，生成答案/解析 |
| P4 | 题库管理 | 可筛选、搜索、查看题目 |
| P5 | 复习训练 | 可刷题、记录复习、掌握度更新 |
| P6 | 数据统计 | 热力图、统计面板正常显示 |

---

## 7. 常用命令速查

| 操作 | 命令 |
|-----|------|
| 后端重启 | `npm run start:dev` |
| 前端重启 | `npm run dev` |
| Prisma 更新 | `npx prisma migrate dev` |
| Prisma Studio | `npx prisma studio` |
| 重建数据库 | `npx prisma migrate reset` |
| Docker 重启 | `docker-compose restart` |
| 查看日志 | `docker-compose logs -f` |
