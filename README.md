# Fixit

<div align="center">

**智能错题管理系统 - 将错题转化为掌握的知识**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![NestJS](https://img.shields.io/badge/NestJS-11.0-red)
![React](https://img.shields.io/badge/React-19.0-cyan)

[在线演示](#演示) • [快速开始](#快速开始) • [部署文档](#生产部署) • [API文档](#api文档) • [更新日志](./CHANGELOG.md)

</div>

---

## 📖 项目简介

Fixit 是一个基于艾宾浩斯遗忘曲线的智能错题管理系统，通过科学的复习节奏帮助学生高效管理和复习错题，将错误答案转化为掌握的知识点。

### ✨ 核心特性

- 🚀 **快速录入** - 支持文本、图片、公式、代码等多种格式
- 🤖 **AI 智能标签** - 自动分析题目内容，生成知识点标签
- 📅 **科学复习** - 基于艾宾浩斯遗忘曲线的智能复习提醒
- 📊 **数据统计** - 可视化掌握程度，追踪学习进度
- 📤 **导出分享** - 导出精美PDF，方便打印和分享
- 👥 **邀请码** - 优雅的用户邀请机制

---

## 🛠️ 技术栈

### 前端

- **框架**: React 19 + TypeScript
- **构建**: Vite
- **UI库**: Ant Design 6
- **状态**: Zustand
- **路由**: React Router v7
- **样式**: Tailwind CSS
- **编辑器**: @uiw/react-md-editor

### 后端

- **框架**: NestJS 11 + TypeScript
- **ORM**: Prisma 5
- **数据库**: PostgreSQL 17
- **认证**: JWT
- **存储**: MinIO (S3兼容)
- **AI**: OpenAI API / 通义千问等兼容接口

### 基础设施

- **容器**: Docker + Docker Compose
- **反向代理**: Caddy (自动HTTPS)
- **CI/CD**: GitHub Actions (可选)

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- Docker >= 20.x
- Git

### 5分钟启动开发环境

```bash
# 1. 克隆项目
git clone https://github.com/CleverOnion/Fixit.git
cd Fixit

# 2. 启动基础服务
docker-compose -f deploy/dev/docker-compose.yml up -d

# 3. 安装依赖
cd fixit-web && npm install
cd ../fixit-api && npm install

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 文件（至少配置 OPENAI_API_KEY）

# 5. 启动后端
cd fixit-api
npm run start:dev

# 6. 启动前端（新终端）
cd ../fixit-web
npm run dev
```

访问 http://localhost:5173 开始使用！

---

## 🏗️ 生产部署

### 部署架构

```
┌─────────────────────────────────────────┐
│           用户请求 (80/443)              │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │   Caddy     │ ← 自动HTTPS/路由
        │  反向代理    │
        └──────┬──────┘
               │
       ┌───────┴────────┐
       │                │
   /api/*              /*
       │                │
       ▼                ▼
┌──────────┐      ┌──────────┐
│ API服务   │      │ Web静态   │
│ NestJS   │      │ Nginx    │
│ :3000    │      │ :80      │
└────┬─────┘      └──────────┘
     │
  ┌──┼────────┐
  ▼  ▼        ▼
┌──┴──┴─┐ ┌────┐ ┌────┐
│PostgreSQL│MinIO│ MC │
│ :5432  │ :9000│    │
└────────┘ └────┘ └────┘
```

### 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/CleverOnion/Fixit.git
cd Fixit/deploy/prod

# 2. 配置环境变量
cp .env.example .env
nano .env  # 修改敏感配置

# 3. 启动所有服务
docker-compose up -d

# ✓ 数据库自动初始化（每次启动都会检查并自动处理）
# ✓ 服务自动启动
```

**说明**：每次启动API容器时都会自动执行：
- `npx prisma migrate deploy` - 应用未执行的迁移（幂等）
- `node scripts/seed-prod.js` - 创建初始邀请码（已存在则跳过）

查看服务状态：
```bash
docker-compose ps
docker-compose logs -f api
```

### 访问方式

- **HTTP**: `http://your-server-ip`
- **HTTPS**: `http://your-domain.com`（需完成备案）

### 启用 HTTPS

域名备案完成后，执行：

```bash
# 切换到HTTPS配置
mv Caddyfile.https Caddyfile

# 重启Caddy
docker-compose restart caddy

# Caddy会自动：
# ✓ 获取Let's Encrypt证书
# ✓ 配置HTTPS
# ✓ 自动续签证书
```

### 环境变量配置

生产环境必需配置项：

```bash
# .env 文件内容

# JWT认证
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# AI服务（支持OpenAI及兼容接口）
OPENAI_API_KEY=sk-your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1  # 或兼容接口
OPENAI_MODEL=gpt-4o

# MinIO对象存储
MINIO_ENDPOINT=http://minio:9000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=your-strong-password
MINIO_BUCKET=fixit-files

# 前端API地址
VITE_API_BASE_URL=/api
```

---

## 📁 项目结构

```
Fixit/
├── deploy/                    # 部署配置
│   ├── dev/                  # 开发环境
│   │   └── docker-compose.yml
│   └── prod/                 # 生产环境
│       ├── docker-compose.yml
│       ├── Caddyfile         # HTTP配置
│       ├── Caddyfile.https   # HTTPS配置
│       ├── Dockerfile.api
│       ├── Dockerfile.web
│       └── .env.example
│
├── fixit-api/                # 后端服务
│   ├── src/
│   │   ├── modules/          # 业务模块
│   │   │   ├── auth/         # JWT认证
│   │   │   ├── question/     # 题目管理
│   │   │   ├── tag/          # 标签管理
│   │   │   ├── review/       # 复习系统
│   │   │   ├── ai/           # AI自动标签
│   │   │   ├── file/         # 文件上传
│   │   │   └── invitation/   # 邀请码
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma     # 数据模型
│   │   ├── seed.ts           # 种子数据
│   │   └── migrations/       # 数据库迁移
│   └── package.json
│
├── fixit-web/                # 前端应用
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   ├── components/       # 公共组件
│   │   ├── stores/           # Zustand状态
│   │   ├── api/              # API服务
│   │   └── main.tsx
│   └── package.json
│
└── README.md
```

---

## 💻 开发指南

### 后端开发命令

```bash
cd fixit-api

npm run start:dev    # 开发服务器（热重载）
npm run test         # 单元测试
npm run test:e2e     # 端到端测试
npm run lint         # ESLint检查
npm run format       # Prettier格式化
npx prisma studio    # 数据库GUI
npx prisma migrate dev   # 运行迁移
```

### 前端开发命令

```bash
cd fixit-web

npm run dev          # 开发服务器（http://localhost:5173）
npm run build        # 生产构建
npm run lint         # ESLint检查
npm run test         # Playwright E2E测试
```

### 数据库操作

```bash
cd fixit-api

# 创建迁移
npx prisma migrate dev --name add_user_field

# 重置数据库
npx prisma migrate reset

# 生成Prisma客户端
npx prisma generate

# 查看数据库
npx prisma studio
```

---

## 🔧 常见问题

### 1. 前端无法访问后端API

检查 `fixit-web/vite.config.ts` 中的代理配置：

```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

### 2. 数据库连接失败

确保PostgreSQL容器正在运行：

```bash
docker-compose -f deploy/dev/docker-compose.yml ps
```

### 3. AI标签功能不工作

检查 `.env` 中的 `OPENAI_API_KEY` 是否正确配置。

### 4. 文件上传失败

检查MinIO服务是否正常：

```bash
docker logs fixit-minio
# 访问 http://localhost:9001
```

---

## 📊 数据库Schema

核心数据模型：

- **users** - 用户表
- **questions** - 题目表
- **tags** - 标签表
- **question_tags** - 题目标签关联表
- **review_logs** - 复习记录表
- **invitation_codes** - 邀请码表

详细结构见 `fixit-api/prisma/schema.prisma`

---

## 🔐 安全建议

1. ✅ 永远不要将 `.env` 文件提交到Git
2. ✅ 生产环境必须修改所有默认密码
3. ✅ 定期更新依赖包：`npm audit fix`
4. ✅ 启用HTTPS（生产环境）
5. ✅ 定期备份数据库和MinIO数据
6. ✅ 使用强JWT密钥

---

## 🤝 贡献指南

欢迎贡献代码！请遵循以下流程：

1. Fork本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交Pull Request

### 提交信息规范

- `feat:` 新功能
- `fix:` 修复bug
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
