# Fixit 技术设计文档 (TDD)

| 文档信息 | 内容 |
|---------|------|
| 产品名称 | Fixit |
| 文档版本 | v1.0 |
| 文档状态 | 正式发布 |
| 创建日期 | 2026-02-01 |
| 关联文档 | PRD.md |

---

## 目录

1. [技术栈总览](#1-技术栈总览)
2. [前端架构](#2-前端架构)
3. [后端架构](#3-后端架构)
4. [数据库设计](#4-数据库设计)
5. [API 设计规范](#5-api-设计规范)
6. [AI 服务集成](#6-ai-服务集成)
7. [文件存储方案](#7-文件存储方案)
8. [部署架构](#8-部署架构)
9. [开发规范](#9-开发规范)

---

## 1. 技术栈总览

### 1.1 技术选型决策

| 层级 | 技术选型 | 选择理由 |
|-----|---------|---------|
| **前端框架** | React 18 + TypeScript | 生态成熟，组件化开发，类型安全 |
| **构建工具** | Vite | 开发启动快，热更新优秀 |
| **UI 组件库** | Ant Design 5.x | 组件丰富，设计规范一致 |
| **状态管理** | Zustand | 轻量简洁，API 友好 |
| **路由管理** | React Router 6 | 官方标准，嵌套路由支持 |
| **Markdown 渲染** | react-markdown + KaTeX | 支持公式和代码高亮 |
| **HTTP 客户端** | Axios | 拦截器强大，类型推断完善 |
| **后端框架** | NestJS (Node.js) | 结构清晰，模块化设计，TypeScript 原生支持 |
| **数据库** | PostgreSQL | 关系型数据支持好，JSON 字段灵活 |
| **ORM** | Prisma | 类型安全，迁移管理方便 |
| **文件存储** | MinIO (S3 兼容) | 开源免费、私有部署、简单易用 |
| **AI 服务** | OpenAI GPT-4o (视觉多模态) | OCR + 题目解析一体化 |
| **用户认证** | JWT (JSON Web Token) | 无状态，易于扩展 |
| **代码规范** | ESLint + Prettier | 团队协作统一风格 |
| **版本控制** | Git | - |

### 1.2 技术架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户客户端                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   React + TypeScript (Web)                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ Zustand  │  │ Ant Design│  │ Markdown │  │  Router  │   │   │
│  │  │  状态管理 │  │   UI库    │  │  渲染    │  │   路由   │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────────┐
│                          服务端                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   NestJS Application                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ Auth     │  │ Question │  │ Review   │  │  AI      │   │   │
│  │  │ Module   │  │ Module   │  │ Module   │  │ Module   │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│              ┌───────────────┼───────────────┐                    │
│              ▼               ▼               ▼                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   PostgreSQL    │  │     MinIO       │  │  OpenAI API     │   │
│  │   (主数据库)     │  │  (S3 兼容存储)   │  │  (AI 服务)      │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 前端架构

### 2.1 项目结构

```
src/
├── assets/              # 静态资源
├── components/          # 公共组件
│   ├── ui/              # 基础 UI 组件
│   ├── layout/          # 布局组件
│   └── form/            # 表单组件
├── pages/               # 页面组件
│   ├── Home/            # 首页/仪表盘
│   ├── Question/        # 题目管理
│   ├── Practice/        # 刷题模式
│   ├── Import/          # 题目录入
│   └── Profile/         # 个人中心
├── hooks/               # 自定义 Hooks
├── stores/              # Zustand 状态
├── services/            # API 服务
├── utils/               # 工具函数
├── types/               # TypeScript 类型
└── styles/              # 全局样式
```

### 2.2 核心依赖版本

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "antd": "^5.12.0",
    "@ant-design/icons": "^5.2.6",
    "zustand": "^4.4.7",
    "axios": "^1.6.2",
    "react-markdown": "^9.0.1",
    "remark-math": "^6.0.0",
    "rehype-katex": "^7.0.0",
    "katex": "^0.16.9",
    "dayjs": "^1.11.10"
  },
  "devDependencies": {
    "typescript": "^5.3.2",
    "vite": "^5.0.6",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

### 2.3 状态管理设计

```typescript
// stores/userStore.ts
interface UserState {
  id: string;
  nickname: string;
  avatar?: string;
  isLoggedIn: boolean;
  // actions...
}

// stores/questionStore.ts
interface QuestionState {
  questions: Question[];
  currentFilter: QuestionFilter;
  pagination: Pagination;
  // actions...
}

// stores/practiceStore.ts
interface PracticeState {
  currentQuestion: Question | null;
  mode: 'review' | 'practice';
  isAnswerVisible: boolean;
  // actions...
}
```

### 2.4 路由配置

```typescript
// router/index.tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'questions', element: <QuestionList /> },
      { path: 'questions/:id', element: <QuestionDetail /> },
      { path: 'import', element: <QuestionImport /> },
      { path: 'practice', element: <Practice /> },
      { path: 'stats', element: <Stats /> },
    ],
  },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
]);
```

---

## 3. 后端架构

### 3.1 项目结构

```
src/
├── main.ts                      # 应用入口
├── app.module.ts                # 根模块
├── config/                      # 配置模块
│   ├── config.module.ts
│   └── database.config.ts
├── common/                      # 公共模块
│   ├── guards/                  # 守卫
│   ├── decorators/              # 装饰器
│   ├── filters/                 # 过滤器
│   └── interceptors/            # 拦截器
├── modules/
│   ├── auth/                    # 认证模块
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   └── dto/
│   ├── user/                    # 用户模块
│   ├── question/                # 题目模块
│   │   ├── question.module.ts
│   │   ├── question.controller.ts
│   │   ├── question.service.ts
│   │   ├── dto/
│   │   └── entities/
│   ├── review/                  # 复习模块
│   ├── ai/                      # AI 模块
│   │   ├── ai.module.ts
│   │   ├── ai.service.ts        # AI 服务封装
│   │   └── dto/
│   └── tag/                     # 标签模块
└── prisma/                      # Prisma 相关
    ├── schema.prisma
    └── migrations/
```

### 3.2 核心依赖

```json
{
  "dependencies": {
    "@nestjs/core": "^10.2.10",
    "@nestjs/common": "^10.2.10",
    "@nestjs/platform-express": "^10.2.10",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.2",
    "@prisma/client": "^5.6.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "openai": "^4.24.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "dayjs": "^1.11.10",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.2.1",
    "@nestjs/schematics": "^10.0.3",
    "@types/node": "^20.10.4",
    "@types/passport-jwt": "^3.0.13",
    "@types/bcrypt": "^5.0.2",
    "typescript": "^5.3.2",
    "prisma": "^5.6.0"
  }
}
```

### 3.3 模块设计

```
┌─────────────────────────────────────────────────────────────┐
│                     AppModule                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ConfigModule → AuthModule → UserModule             │   │
│  │                       ↓                             │   │
│  │  QuestionModule ← ReviewModule ← TagModule          │   │
│  │                       ↓                             │   │
│  │                    AIModule                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 数据库设计

### 4.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户表
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  nickname      String
  avatar        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  questions     Question[]
  reviewLogs    ReviewLog[]
  tags          Tag[]
}

// 题目表
model Question {
  id            String    @id @default(uuid())
  content       String    @db.Text      // 题目内容 (Markdown)
  answer        String    @db.Text      // 答案 (Markdown)
  analysis      String?   @db.Text      // 解析 (Markdown)
  images        String[]                // 图片 URL 列表

  // 元数据
  subject       String                  // 学科
  sourcePath    Json?                   // 来源路径 (层级结构)
  masteryLevel  Int       @default(0)   // 掌握程度 0-5
  nextReviewAt  DateTime?               // 下次复习时间
  lastReviewedAt DateTime?

  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  tags          QuestionTag[]
  reviewLogs    ReviewLog[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId, subject])
  @@index([userId, masteryLevel])
  @@index([nextReviewAt])
}

// 标签表
model Tag {
  id            String    @id @default(uuid())
  name          String
  type          TagType
  category      String                 // 标签类别
  color         String?

  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  questions     QuestionTag[]

  createdAt     DateTime  @default(now())
  @@unique([userId, name, type])
}

// 题目-标签关联表
model QuestionTag {
  id            String    @id @default(uuid())
  questionId    String
  question      Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)
  tagId         String
  tag           Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([questionId, tagId])
}

// 复习记录表
model ReviewLog {
  id            String    @id @default(uuid())
  questionId    String
  question      Question  @relation(fields: [questionId], references: [id], onDelete: Cascade)

  status        ReviewStatus
  note          String?   @db.Text      // 复习心得

  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime  @default(now())

  @@index([questionId, createdAt])
  @@index([userId, createdAt])
}

enum TagType {
  SYSTEM
  CUSTOM
}

enum ReviewStatus {
  FORGOTTEN   // 没做对
  FUZZY       // 模糊
  MASTERED    // 掌握
}
```

### 4.2 数据库索引策略

| 表名 | 索引字段 | 索引类型 | 用途 |
|-----|---------|---------|------|
| Question | userId, subject | B-tree | 按用户+学科筛选 |
| Question | userId, masteryLevel | B-tree | 按掌握程度筛选 |
| Question | nextReviewAt | B-tree | 复习提醒查询 |
| ReviewLog | questionId, createdAt | B-tree | 复习历史查询 |
| ReviewLog | userId, createdAt | B-tree | 用户复习统计 |
| Tag | userId, name, type | B-tree | 标签查找 |

### 4.3 数据库配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: fixit-postgres
    environment:
      POSTGRES_USER: fixit
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: fixit
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fixit -d fixit"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## 5. API 设计规范

### 5.1 RESTful 设计原则

| HTTP 方法 | 操作类型 | 示例 |
|----------|---------|------|
| GET | 获取资源 | GET /api/v1/questions |
| POST | 创建资源 | POST /api/v1/questions |
| PUT | 全量更新 | PUT /api/v1/questions/:id |
| PATCH | 部分更新 | PATCH /api/v1/questions/:id |
| DELETE | 删除资源 | DELETE /api/v1/questions/:id |

### 5.2 URL 命名规范

- 使用名词复数形式：`/questions` 而非 `/question`
- 使用连字符分隔单词：`/question-tags` 而非 `/questionTags`
- 层级不超过 3 层：`/users/:userId/questions/:questionId`

### 5.3 认证方式

```typescript
// 请求头携带 Token
Authorization: Bearer <token>

// JWT Payload
interface JWTPayload {
  sub: string;      // userId
  email: string;
  iat: number;
  exp: number;
}
```

### 5.4 错误响应格式

```typescript
interface ErrorResponse {
  success: false;
  code: string;        // 错误码
  message: string;     // 用户友好消息
  details?: any;       // 详细错误信息（开发环境）
  timestamp: string;
}

// 示例错误码
const ERROR_CODES = {
  UNAUTHORIZED: 'AUTH_001',
  FORBIDDEN: 'AUTH_002',
  NOT_FOUND: 'RES_001',
  VALIDATION_ERROR: 'VAL_001',
  AI_SERVICE_ERROR: 'AI_001',
};
```

### 5.5 核心 API 接口

#### 5.5.1 认证模块

| 方法 | 路径 | 描述 |
|-----|------|------|
| POST | /api/v1/auth/register | 用户注册 |
| POST | /api/v1/auth/login | 用户登录 |
| POST | /api/v1/auth/refresh | 刷新 Token |
| POST | /api/v1/auth/logout | 退出登录 |

#### 5.5.2 题目模块

| 方法 | 路径 | 描述 |
|-----|------|------|
| GET | /api/v1/questions | 获取题目列表 |
| POST | /api/v1/questions | 创建题目 |
| GET | /api/v1/questions/:id | 获取题目详情 |
| PUT | /api/v1/questions/:id | 更新题目 |
| DELETE | /api/v1/questions/:id | 删除题目 |
| PATCH | /api/v1/questions/:id/tags | 更新题目标签 |

#### 5.5.3 复习模块

| 方法 | 路径 | 描述 |
|-----|------|------|
| GET | /api/v1/reviews/pending | 获取待复习题目 |
| POST | /api/v1/reviews | 提交复习记录 |
| GET | /api/v1/reviews/history | 获取复习历史 |
| GET | /api/v1/reviews/stats | 获取复习统计 |

#### 5.5.4 AI 模块

| 方法 | 路径 | 描述 |
|-----|------|------|
| POST | /api/v1/ai/generate | AI 生成内容（题目/答案/解析） |

### 5.6 分页查询规范

```typescript
// 请求参数
interface PaginationQuery {
  page: number;     // 页码，从 1 开始
  limit: number;    // 每页数量，默认 20
  sortBy?: string;  // 排序字段
  sortOrder?: 'asc' | 'desc';
}

// 响应格式
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
```

---

## 6. AI 服务集成

### 6.1 设计理念

**不单独接入 OCR 服务**，直接使用多模态大语言模型（如 GPT-4o）的视觉能力，从图片中识别题目内容。

### 6.2 OpenAI 集成方案

使用 GPT-4o 的多模态能力，从图片中识别题目内容。

```typescript
// modules/ai/ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * 生成题目/答案/解析
   */
  async generate(input: {
    target: 'question' | 'answer' | 'analysis';
    imageBase64?: string;
    content?: string;
    instruction?: string;
  }): Promise<AIGenerateResult> {
    const prompt = this.buildPrompt(input);

    const userContent = input.imageBase64
      ? [{ type: 'image_url', image_url: { url: input.imageBase64 } }]
      : [{ type: 'text', text: input.content || '' }];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    return this.parseResponse(response.choices[0].message.content);
  }

  private buildPrompt(input: { target: string; instruction?: string }): { system: string } {
    // 根据不同目标构建 prompt
    const prompts = {
      question: {
        system: `你是一个专业的教育助手。请从图片中准确提取题目内容，保留公式和格式。请以 JSON 格式返回：{ "content": "题目文本" }`,
      },
      answer: {
        system: `你是一个专业的教育助手。根据以下题目内容，${input.instruction || '生成标准答案'}。请以 JSON 格式返回：{ "content": "答案文本" }`,
      },
      analysis: {
        system: `你是一个专业的教育助手。根据以下题目内容，${input.instruction || '给出详细解题步骤和解析'}。请以 JSON 格式返回：{ "content": "解析文本" }`,
      },
    };
    return prompts[input.target as keyof typeof prompts];
  }

  private parseResponse(content: string): AIGenerateResult {
    const parsed = JSON.parse(content);
    return {
      content: parsed.content,
      confidence: 0.9,
    };
  }
}

interface AIGenerateResult {
  content: string;
  confidence: number;
}
```

### 6.2 AI Prompt 优化

```typescript
const AI_SYSTEM_PROMPTS = {
  QUESTION: `你是一个专业的教育助手。请从图片中准确提取题目内容，保留公式和格式。
请以 JSON 格式返回：{ "content": "题目文本", "confidence": 0.95 }`,

  ANSWER: `你是一个专业的教育助手。根据以下题目内容，生成标准答案。
请以 JSON 格式返回：{ "content": "答案文本", "confidence": 0.95 }`,

  ANALYSIS: `你是一个专业的教育助手。根据以下题目内容，给出详细解题步骤和解析。
请以 JSON 格式返回：{ "content": "解析文本", "confidence": 0.95 }`,
};
```

### 6.3 AI 成本控制

```typescript
// AI 服务使用策略
const AI_STRATEGY = {
  // 免费用户限制
  free: {
    dailyLimit: 10,        // 每日 10 次调用
    monthlyLimit: 100,     // 每月 100 次
  },
  // 付费用户限制
  pro: {
    dailyLimit: 100,
    monthlyLimit: 2000,
  },
  // 重试策略
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
  },
  // 降级策略
  fallback: {
    enabled: true,
    fallbackToManual: true,
  },
};
```

---

## 7. 文件存储方案

### 7.1 MinIO 配置

使用 MinIO Client (multer-s3) 进行文件上传。

```typescript
// config/minio.config.ts
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

export const minioConfig = {
  s3: new S3Client({
    region: 'us-east-1',  // MinIO 不依赖 region
    endpoint: process.env.MINIO_ENDPOINT,  // 如 http://localhost:9000
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY!,
      secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true,  // MinIO 需要启用 path style
  }),
  bucket: process.env.MINIO_BUCKET || 'fixit-files',
};

// 文件命名规则
const FILE_NAMING = {
  question: (userId: string, questionId: string, index: number) =>
    `users/${userId}/questions/${questionId}/${Date.now()}-${index}`,
  avatar: (userId: string) =>
    `users/${userId}/avatar/${Date.now()}`,
};

// multer 上传中间件
export const upload = multer({
  storage: multerS3({
    s3: minioConfig.s3,
    bucket: minioConfig.bucket,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = FILE_NAMING.question(
        req.body.userId,
        req.body.questionId,
        Date.now()
      );
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 JPG/PNG/WebP 格式'));
    }
  },
});
```

### 7.2 文件服务封装

```typescript
// modules/file/file.service.ts
import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor() {
    this.s3 = new S3Client({
      region: 'us-east-1',
      endpoint: process.env.MINIO_ENDPOINT,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
    this.bucket = process.env.MINIO_BUCKET || 'fixit-files';
  }

  /**
   * 生成预签名上传 URL（直传到 MinIO）
   */
  async getUploadUrl(
    key: string,
    contentType: string = 'image/jpeg',
    expiresIn: number = 3600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * 生成预签名下载 URL
   */
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * 删除文件
   */
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3.send(command);
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteFile(key)));
  }
}
```

### 7.3 图片处理策略

| 场景 | 处理方式 |
|-----|---------|
| 上传时压缩 | 前端压缩后上传，限制最大 2MB |
| 格式支持 | JPG、PNG、WebP |
| 存储桶隔离 | 题目图片和用户头像分开存储 |
| 开发环境 | 使用 MinIO Console 管理 |

### 7.4 上传流程

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  前端    │───▶│  后端    │───▶│  MinIO   │───▶│  数据库  │
│  上传    │    │  签名    │    │  存储    │    │  保存    │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

```typescript
// 控制器示例
@Post('questions/:id/images')
@UseGuards(JwtAuthGuard)
async uploadQuestionImages(
  @Param('id') questionId: string,
  @Req() req,
  @Body() body,
) {
  // 1. 生成预签名 URL
  const key = `users/${req.user.id}/questions/${questionId}/${Date.now()}`;
  const uploadUrl = await this.fileService.getUploadUrl(
    key,
    'image/jpeg'
  );

  // 2. 返回上传 URL，前端直传到 MinIO
  return {
    uploadUrl,
    key,
  };
}
```

### 7.5 MinIO 权限配置

```json
// MinIO Policy (JSON)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowUserFullAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": [
        "arn:aws:s3:::fixit-files/users/${aws:username}/*"
      ]
    },
    {
      "Sid": "AllowListBuckets",
      "Effect": "Allow",
      "Action": "s3:ListAllMyBuckets",
      "Resource": "*"
    }
  ]
}
```

---

## 8. 部署架构

### 8.1 部署架构图

```
                              ┌─────────────────┐
                              │     CDN         │
                              │   (静态资源)     │
                              └────────┬────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
              │   Nginx   │      │   Nginx   │      │   Nginx   │
              │  (SLB)    │      │  (Web)    │      │  (API)    │
              └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
              ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
              │   Node    │      │ PostgreSQL│      │  阿里云   │
              │  (K8s)    │      │   (RDS)   │      │    OSS    │
              └───────────┘      └───────────┘      └───────────┘
```

### 8.2 Docker 部署

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/fixit
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
      - MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
      - MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
      - MINIO_BUCKET=${MINIO_BUCKET}
    depends_on:
      - postgres
      - minio
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    container_name: fixit-minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"    # S3 API
      - "9001:9001"    # Console UI
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: fixit
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
  minio_data:
```

### 8.3 环境配置

```bash
# .env.example

# 数据库
DATABASE_URL="postgresql://user:pass@localhost:5432/fixit"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="7d"

# OpenAI
OPENAI_API_KEY="sk-xxxxx"
OPENAI_MODEL="gpt-4o"

# MinIO
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_BUCKET="fixit-files"

# MinIO Console (管理员账号)
MINIO_ROOT_USER="admin"
MINIO_ROOT_PASSWORD="password123"
```

# 应用
NODE_ENV="production"
PORT=3000
```

---

## 9. 开发规范

### 9.1 Git 规范

```bash
# 分支策略
main          # 主分支 (生产环境)
develop       # 开发分支
feature/*     # 功能分支
hotfix/*      # 紧急修复分支

# 提交信息格式
<type>(<scope>): <subject>

# type 类型
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构
test:     测试相关
chore:    构建/工具相关

# 示例
feat(question): 添加题目批量导入功能
fix(auth): 修复 Token 刷新 bug
docs(readme): 更新 API 文档
```

### 9.2 代码规范

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "react/no-array-index-key": "warn"
  }
}
```

```json
// .prettierrc
{
  "semi": true,
  "tabWidth": 2,
  "printWidth": 100,
  "singleQuote": true,
  "trailingComma": "es5",
  "bracketSpacing": true
}
```

### 9.3 TypeScript 规范

```typescript
// 1. 使用接口定义对象类型
interface Question {
  id: string;
  title: string;
}

// 2. 使用类型定义联合类型/交叉类型
type QuestionStatus = 'draft' | 'published' | 'archived';

// 3. 导出所有公共类型
export * from './types';

// 4. 避免使用 any，使用 unknown 代替
function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}
```

### 9.4 API DTO 规范

```typescript
// 使用 class-validator 进行参数校验
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  content: string;

  @IsString()
  answer: string;

  @IsOptional()
  @IsString()
  analysis?: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  masteryLevel?: number;
}
```

---

## 附录

### A. 第三方服务对比

| 服务 | 方案 A | 方案 B | 推荐 |
|-----|-------|-------|------|
| AI (含 OCR) | OpenAI GPT-4o | Claude 3 Sonnet | GPT-4o (视觉能力强) |
| 对象存储 | MinIO (私有) | AWS S3 | MinIO (免费可控) |
| 数据库 | PostgreSQL | MySQL | PostgreSQL (JSON 支持) |

### B. 性能指标

| 指标 | 目标值 |
|-----|-------|
| API P99 响应时间 | < 500ms |
| 页面首屏加载 | < 2s |
| AI 识别耗时 | < 5s |
| 数据库查询 | < 100ms |

### C. 修订历史

| 版本 | 日期 | 修订人 | 修订内容 |
|-----|------|-------|---------|
| v1.0 | 2026-02-01 | 技术团队 | 初始版本 |
