# Fixit API 技术实现计划

## 1. API 优化建议

### 1.1 响应格式统一化

**当前问题**：各端点响应格式不统一

| 端点 | 当前格式 | 建议格式 |
|------|---------|---------|
| `GET /questions` | `{data, total, page, totalPages}` | `{success, data, meta}` |
| `GET /questions/subjects` | `['数学', '物理']` | `{success, data: [...]}` |
| `POST /reviews` | `{message, data}` | `{success, data, message}` |

**实现方案**：

```typescript
// src/common/dto/api-response.dto.ts
export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
  message?: string;
}

// src/common/interceptors/success.interceptor.ts
@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
      })),
    );
  }
}
```

**工作量**：2 小时

---

### 1.2 输入验证增强

**当前问题**：无输入长度限制

**实现方案**：

```typescript
// src/modules/question/dto/question.dto.ts
export class CreateQuestionDto {
  @IsString()
  @MaxLength(50000)  // 50KB
  content: string;

  @IsString()
  @MaxLength(20000)
  answer: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  analysis?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images?: string[];
}
```

**工作量**：1 小时

---

### 1.3 速率限制

**当前问题**：无速率限制，可被暴力破解

**实现方案**：

```bash
# 安装依赖
npm install @nestjs/throttler
```

```typescript
// src/main.ts
import { ThrottlerModule } from '@nestjs/throttler';

app.useGlobalGuards(
  new ThrottlerModule.Guard({
    ttl: 60000,  // 60秒
    limit: 10,   // 每次限制10次请求
  }),
);
```

**配置细粒度控制**：

```typescript
// src/modules/auth/auth.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,  // 登录/注册：每秒3次
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,  // 普通请求：每分钟100次
      },
    ]),
  ],
})
export class AuthModule {}
```

**工作量**：2 小时

---

## 2. 数据库查询优化

### 2.1 N+1 查询修复

**当前问题**：`question.service.ts:17-25` 循环内查询标签

```typescript
// BEFORE
for (const tagName of dto.tags) {
  const tag = await this.prisma.tag.findFirst({ where: { name: tagName, userId } });
}

// AFTER
const tags = await prisma.tag.findMany({
  where: {
    name: { in: dto.tags },
    userId,
  },
});
```

**工作量**：1 小时

---

### 2.2 添加缺失索引

**当前索引**：
```prisma
@@index([userId, subject])
@@index([userId, masteryLevel])
@@index([nextReviewAt])
@@index([questionId, createdAt])
@@index([userId, createdAt])
```

**建议新增**：

```prisma
// questions 表
@@index([userId, nextReviewAt])      // 待复习查询
@@index([userId, subject, masteryLevel])  // 复合筛选

// review_logs 表
@@index([status, createdAt])        // 统计查询

// tags 表
@@index([userId, category])
```

**迁移文件**：

```typescript
// prisma/migrations/xxxxx_add_missing_indexes/migration.sql
CREATE INDEX "idx_questions_user_review" ON "questions" ("userId", "nextReviewAt");
CREATE INDEX "idx_questions_user_subject_level" ON "questions" ("userId", "subject", "masteryLevel");
CREATE INDEX "idx_review_logs_status_date" ON "review_logs" ("status", "createdAt");
```

**工作量**：1 小时（含测试）

---

### 2.3 统计查询优化

**当前问题**：`getStreakData()` 全表扫描计算连续天数

**优化方案 1：定时任务预计算**

```typescript
// src/modules/review/services/streak-calculator.service.ts
@Injectable()
export class StreakCalculatorService {
  async calculateAndCache(userId: string): Promise<StreakData> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 只查询需要的字段
    const reviewDates = await prisma.reviewLog.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: subDays(today, 365) },
      },
    });

    // 计算连续天数...
    const streak = this.computeStreak(reviewDates);

    // 缓存到 Redis
    await this.redis.setex(
      `streak:${userId}`,
      3600,  // 1小时过期
      JSON.stringify(streak),
    );

    return streak;
  }
}
```

**优化方案 2：物化视图/预聚合表**

```prisma
// prisma/schema.prisma
model UserStats {
  id        String   @id @default(uuid())
  userId    String   @unique
  streak    Int      @default(0)
  totalReviews Int   @default(0)
  lastReviewDate DateTime?
  updatedAt DateTime @updatedAt
}
```

**工作量**：4 小时

---

## 3. 缓存策略建议

### 3.1 缓存架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Redis Cache                            │
├─────────────────────────────────────────────────────────────┤
│  Tier 1: 热点数据 (TTL: 1h)                                 │
│    - 用户会话                                                │
│    - 复习统计                                                │
│    - 今日待复习数量                                          │
├─────────────────────────────────────────────────────────────┤
│  Tier 2: 配置数据 (TTL: 24h)                                │
│    - 学科列表                                                │
│    - 标签分类                                                │
│    - 系统配置                                                │
├─────────────────────────────────────────────────────────────┤
│  Tier 3: 慢变数据 (TTL: 7d)                                 │
│    - 用户偏好设置                                           │
│    - 学习热力图                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Redis 实现

```typescript
// src/common/cache/cache.service.ts
@Injectable()
export class CacheService {
  constructor(
    private redis: RedisService,
    private config: ConfigService,
  ) {}

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 3600,
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    const value = await factory();
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    return value;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 3.3 应用场景

**场景 1：复习统计缓存**

```typescript
// src/modules/review/review.service.ts
async getReviewStats(userId: string): Promise<ReviewStatsDto> {
  return this.cacheService.getOrSet(
    `stats:${userId}`,
    async () => this.computeStats(userId),
    300,  // 5分钟缓存
  );
}

// 复习提交后失效
async submitReview(userId: string, dto: SubmitReviewDto) {
  const result = await this.computeReview(userId, dto);
  await this.cacheService.invalidatePattern(`stats:${userId}*`);
  return result;
}
```

**场景 2：学科/标签列表缓存**

```typescript
async getSubjects(userId: string): Promise<string[]> {
  return this.cacheService.getOrSet(
    `subjects:${userId}`,
    () => this.prisma.question.findMany({
      where: { userId },
      select: { subject: true },
      distinct: ['subject'],
    }).then(r => r.map(s => s.subject)),
    3600,  // 1小时
  );
}
```

### 3.4 缓存配置

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  volumes:
    - redis_data:/data
```

**工作量**：6 小时

---

## 4. 安全增强

### 4.1 JWT 密钥验证

```typescript
// src/modules/auth/auth.module.ts
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || (() => {
        const secret = generateSecureSecret();
        console.warn('WARNING: Using generated JWT secret. Set JWT_SECRET in production!');
        return secret;
      })(),
      signOptions: { expiresIn: '7d' },
    }),
  ],
})
export class AuthModule {}
```

### 4.2 文件上传私有化

```typescript
// src/modules/file/file.service.ts
async uploadImage(file: MulterFile, userId: string): Promise<{ url: string; key: string }> {
  const key = `questions/${userId}/${uuidv4()}${ext}`;

  await this.s3Client.send(new PutObjectCommand({
    Bucket: this.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private',  // 私有
  }));

  // 返回预签名 URL（1小时有效）
  const url = await this.getSignedUrl(key);

  return { url, key };
}

async getSignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
  return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
}
```

**工作量**：3 小时

---

## 5. 实施优先级

| 优先级 | 任务 | 工作量 | 依赖 |
|-------|------|--------|------|
| P0 | JWT 密钥验证 | 0.5h | 无 |
| P0 | 文件上传私有化 | 2h | 无 |
| P0 | 速率限制 | 2h | 无 |
| P1 | N+1 查询修复 | 1h | 无 |
| P1 | 输入验证增强 | 1h | 无 |
| P1 | 统一响应格式 | 2h | 无 |
| P1 | 添加缺失索引 | 1h | Prisma |
| P2 | Redis 缓存层 | 6h | Redis |
| P2 | 统计查询优化 | 4h | 缓存层 |

**总工作量**：约 20 小时

---

## 6. 验收标准

- [ ] 所有 API 端点响应格式统一
- [ ] 无 N+1 查询问题
- [ ] 速率限制生效
- [ ] 文件上传返回预签名 URL
- [ ] 复习统计查询 < 100ms
- [ ] 输入长度验证生效
- [ ] JWT 密钥必须从环境变量读取
