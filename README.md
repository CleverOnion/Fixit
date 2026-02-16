# Fixit

<div align="center">

**将错题转化为掌握的知识点**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![NestJS](https://img.shields.io/badge/NestJS-11.0-red)
![React](https://img.shields.io/badge/React-19.0-cyan)

[功能特性](#功能特性) • [快速开始](#快速开始) • [技术栈](#技术栈) • [部署](#部署) • [贡献](#贡献)

</div>

---

## 📖 项目简介

Fixit 是一个基于艾宾浩斯遗忘曲线的智能错题管理系统，帮助学生高效管理和复习错题，通过科学的复习节奏将错误答案转化为掌握的知识点。

### 核心功能

- ✅ **便捷录入** - 快速添加错题，支持图片、公式、代码
- 🤖 **智能标签** - AI 自动分析题目，生成知识点标签
- 📅 **科学复习** - 基于艾宾浩斯曲线的智能复习提醒
- 📊 **统计分析** - 可视化掌握程度，追踪学习进度
- 📤 **导出分享** - 导出 PDF，方便打印和分享

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- PostgreSQL >= 15
- Docker (可选，用于基础服务)

### 一键启动（开发环境）

```bash
# 1. 克隆项目
git clone https://github.com/CleverOnion/Fixit.git
cd Fixit

# 2. 安装依赖
npm install
cd fixit-api && npm install
cd ../fixit-web && npm install

# 3. 启动基础服务（PostgreSQL + MinIO）
docker-compose -f deploy/dev/docker-compose.yml up -d

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写必要的配置

# 5. 初始化数据库
cd fixit-api
npx prisma migrate dev
npx prisma seed

# 6. 启动后端（终端1）
cd fixit-api
npm run start:dev

# 7. 启动前端（终端2）
cd fixit-web
npm run dev
```

访问 http://localhost:5173 开始使用！

---

## 🛠️ 技术栈

### 前端 (fixit-web)

- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **UI 组件**: Ant Design 6
- **状态管理**: Zustand
- **路由**: React Router v7
- **样式**: Tailwind CSS
- **Markdown**: @uiw/react-md-editor
- **PDF**: html2pdf.js

### 后端 (fixit-api)

- **框架**: NestJS 11 + TypeScript
- **数据库**: PostgreSQL 15 + Prisma 5
- **认证**: JWT
- **文件存储**: MinIO
- **AI**: OpenAI GPT-4o / 兼容接口
- **测试**: Vitest + Supertest

### DevOps

- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **HTTPS**: Let's Encrypt (Certbot)

---

## 📁 项目结构

```
Fixit/
├── .env                   # 开发环境配置（不提交）
├── .env.example           # 配置模板
├── CLAUDE.md              # Claude Code 项目指南
├── README.md              # 项目说明
│
├── fixit-api/             # 后端服务
│   ├── src/
│   │   ├── modules/       # 业务模块
│   │   │   ├── auth/      # JWT 认证
│   │   │   ├── question/  # 题目管理
│   │   │   ├── tag/       # 标签管理
│   │   │   ├── review/    # 复习系统
│   │   │   ├── ai/        # AI 自动标签
│   │   │   ├── file/      # 文件上传
│   │   │   └── invitation/# 邀请码
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma  # 数据库模型
│   │   ├── seed.ts        # 种子数据
│   │   └── migrations/    # 数据库迁移
│   └── package.json
│
├── fixit-web/             # 前端应用
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 公共组件
│   │   ├── stores/        # Zustand 状态
│   │   ├── api/           # API 服务
│   │   └── main.tsx
│   └── package.json
│
└── deploy/                # 部署配置
    ├── dev/               # 开发环境
    │   └── docker-compose.yml
    └── prod/              # 生产环境
        ├── docker-compose.yml
        ├── Dockerfile.api
        ├── Dockerfile.web
        └── nginx-*.conf
```

---

## 🔧 配置说明

### 环境变量

开发环境只需维护根目录的 `/.env` 文件：

```bash
# JWT 配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AI 配置
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o

# 数据库
DATABASE_URL=postgresql://fixit:fixit@localhost:5432/fixit

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=password123
MINIO_BUCKET=fixit-files
```

生产环境使用 `deploy/prod/.env`，配置类似但 `MINIO_ENDPOINT` 为 `http://minio:9000`（容器间通信）。

---

## 🚀 生产部署

### Docker 部署（推荐）

```bash
cd deploy/prod

# 1. 配置环境变量
cp .env.example .env
nano .env  # 修改敏感配置

# 2. 启动所有服务
docker-compose up -d

# 3. 初始化数据库
docker exec fixit-api npx prisma migrate deploy

# 4. 创建初始邀请码
docker exec fixit-postgres psql -U fixit -d fixit \
  -c "INSERT INTO invitation_codes (id, code) VALUES ('init', 'INIT123');"
```

访问 `https://your-domain.com` 或 `https://your-ip`。

### SSL 证书配置

项目使用 Let's Encrypt 自动续期：

```bash
# 首次获取证书
docker run --rm -v ./certbot/conf:/etc/letsencrypt \
  -v ./certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot -d fixit.your-domain.com

# 续期证书（已自动配置 cron）
docker run --rm -v ./certbot/conf:/etc/letsencrypt \
  -v ./certbot/www:/var/www/certbot \
  certbot/certbot renew --webroot -w /var/www/certbot
```

---

## 📚 开发指南

### 常用命令

**后端开发**：
```bash
cd fixit-api
npm run start:dev    # 热重载开发服务器
npm run test         # 运行测试
npm run test:e2e     # 端到端测试
npm run lint         # 代码检查
npm run format       # Prettier 格式化
npx prisma studio    # 数据库 GUI
```

**前端开发**：
```bash
cd fixit-web
npm run dev          # 开发服务器（http://localhost:5173）
npm run build        # 生产构建
npm run lint         # ESLint 检查
npm run test         # Playwright E2E 测试
```

### 代码规范

- **TypeScript**: 严格模式，所有文件必须类型完整
- **ESLint**: 遵循 Airbnb 风格指南
- **Commit**: 使用约定式提交（Conventional Commits）
- **API**: RESTful 设计，统一错误处理

---

## 🔐 安全注意事项

1. **永远不要**将包含敏感信息的 `.env` 文件提交到 Git
2. 生产环境**必须修改**所有默认密码
3. 定期更新依赖包：`npm audit fix`
4. 启用 HTTPS，使用强加密算法
5. 定期备份数据库和 MinIO 数据

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

### 提交信息格式

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具更新

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- 作者：CleverOnion
- 项目链接：[https://github.com/CleverOnion/Fixit](https://github.com/CleverOnion/Fixit)
- 问题反馈：[Issues](https://github.com/CleverOnion/Fixit/issues)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star！**

Made with ❤️ by CleverOnion

</div>
