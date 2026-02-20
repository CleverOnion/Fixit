# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

Fixit is a mistake management web application helping students convert wrong answers into mastered knowledge points. It features low-friction problem entry, AI-powered tagging, and Ebbinghaus-based review scheduling.

## Tech Stack

**Frontend (fixit-web)**: React 19, TypeScript, Vite, Ant Design 6, Zustand (state), React Router
**Backend (fixit-api)**: NestJS 11, TypeScript, Prisma 5 (PostgreSQL), JWT auth, MinIO (file storage)
**Infrastructure**: Docker (PostgreSQL 17, MinIO)

## Project Structure

```
Fixit/
├── .env                    # 环境配置文件 (根目录)
├── CHANGELOG.md            # 版本更新日志
├── CLAUDE.md               # Claude Code 指南
├── README.md               # 项目文档
├── fixit-api/              # NestJS 后端
│   ├── src/
│   │   ├── modules/        # 业务模块
│   │   │   ├── auth/      # JWT 认证
│   │   │   ├── question/  # 题目管理
│   │   │   ├── tag/       # 标签管理
│   │   │   ├── file/      # 文件上传
│   │   │   ├── ai/        # AI 功能 (DashScope)
│   │   │   ├── review/    # 复习模块
│   │   │   └── invitation/# 邀请码
│   │   ├── prisma.service.ts
│   │   ├── main.ts
│   │   └── app.module.ts
│   └── prisma/
│       └── schema.prisma   # 数据库模型
├── fixit-web/              # React 前端
│   ├── src/
│   │   ├── api/           # API 服务层
│   │   ├── stores/        # Zustand 状态管理
│   │   ├── pages/         # 页面组件
│   │   └── components/   # 公共组件
│   └── vite.config.ts
└── deploy/
    ├── dev/               # 开发环境 Docker 配置
    └── prod/              # 生产环境 Docker 配置
```

## Commands

### Frontend
```bash
cd fixit-web
npm run dev          # 开发服务器 http://localhost:5173
npm run build        # TypeScript 检查 + 生产构建
npm run lint         # ESLint 检查
```

### Backend
```bash
cd fixit-api
npm run start:dev    # 热重载服务器 http://localhost:3000
npm run test         # Vitest 监听模式
npm run test:run    # 单次测试 (CI 模式)
npm run format       # Prettier 格式化
npm run lint         # ESLint 检查 + 自动修复
```

### Infrastructure
```bash
# 启动开发环境 (PostgreSQL + MinIO)
docker-compose -f deploy/dev/docker-compose.yml up -d

# 数据库
cd fixit-api
npx prisma migrate dev    # 运行数据库迁移
npx prisma studio         # 打开 Prisma Studio
npx prisma db seed        # 初始化数据
```

## Environment Configuration

### .env (项目根目录)

环境配置文件位于项目根目录 `.env`，后端通过 `app.module.ts` 中的 `ConfigModule` 加载：

```bash
# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI 配置 (阿里云 DashScope)
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen3-vl-flash
AI_MAX_TOKENS=2000

# 数据库 (PostgreSQL)
DATABASE_URL=postgresql://fixit:fixit@localhost:35432/fixit

# MinIO 对象存储
MINIO_ENDPOINT=http://localhost:39000
MINIO_PORT=39000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=password123
MINIO_BUCKET=fixit-files

# 前端
VITE_API_BASE_URL=/api
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | - |
| Backend | http://localhost:3000 | - |
| MinIO Console | http://localhost:39001 | admin / password123 |
| PostgreSQL | localhost:35432 | fixit / fixit |

## Key Patterns

- **State**: Zustand with persist middleware (localStorage)
- **Auth**: JWT stored in localStorage, PrivateOutlet for protected routes
- **API**: Service layer pattern with separate files per domain
- **Validation**: DTOs with class-validator on backend
- **Database**: Prisma ORM with cascading deletes

## Database Schema

- `users` - 用户账户 (email, password, nickname, avatar)
- `questions` - 题目 (content, answer, analysis, subject, mastery, tags)
- `tags` - 标签 (SYSTEM/CUSTOM types)
- `question_tags` - 题目-标签多对多关系
- `review_logs` - 复习记录 (FORGOTTEN/FUZZY/MASTERED)
- `practice_sessions` - 练习轮次
- `practice_records` - 每日练习记录
- `invitation_codes` - 邀请码

## Version Management

### Every Commit Requirements

Before creating any commit, you MUST:

1. **Update version number** in both:
   - `fixit-api/package.json` (version field)
   - `fixit-web/package.json` (version field)

2. **Update CHANGELOG.md** with:
   - New version entry with current date
   - List of changes (Added/Changed/Fixed/Removed)
   - Use [Keep a Changelog](https://keepachangelog.com/) format

3. **Version bump rules**:
   - `patch` (x.x.0 → x.x.1): Bug fixes, small improvements
   - `minor` (x.0.0 → x.1.0): New features, backward compatible
   - `major` (0.x.0 → 1.0.0): Breaking changes

### Example CHANGELOG Entry

```markdown
## [1.0.1] - 2026-02-20

### Fixed
- Fix JWT token validation issue

### Changed
- Update theme switch animation
```

## Commit Message Format

```
<type>: <description>

[optional body]
```

Types: feat, fix, refactor, docs, test, chore, perf, ci
