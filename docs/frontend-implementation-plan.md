# Fixit 前端技术实现计划

> 版本：v1.0
> 作者：前端架构师
> 日期：2026-02-10
> 状态：待评审

## 1. 概述

基于前期架构评估结果，本文档详细制定前端重构的技术实现方案。整体重构预估工作量：**5-8 人天**

### 1.1 当前问题摘要

| 问题类别 | 严重程度 | 影响范围 |
|---------|---------|---------|
| 无代码分割 | P0 | 首屏加载 |
| 组件职责过重 | P1 | 5 个页面 |
| 代码重复 | P1 | 3+ 处 |
| 性能优化缺失 | P2 | 全局 |
| 状态管理薄弱 | P2 | 3 个模块 |

### 1.2 重构目标

- 首屏加载时间减少 40%+
- 组件平均行数控制在 150 行以内
- 代码重复率降至 5% 以下
- 建立可扩展的前端架构

---

## 2. 目录结构重构方案

### 2.1 当前结构

```
fixit-web/src/
├── api/                    # API 服务层
│   ├── index.ts
│   ├── auth.ts
│   ├── question.ts
│   ├── review.ts
│   ├── tag.ts
│   ├── file.ts
│   └── ai.ts
├── stores/                 # 状态管理
│   └── userStore.ts
├── components/            # 公共组件
│   └── MarkdownEditor.tsx
├── pages/                  # 页面组件
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Home.tsx
│   ├── Import/
│   ├── Questions/
│   ├── Practice/
│   └── Stats/
├── hooks/                  # (缺失)
├── utils/                  # (缺失)
├── App.tsx
└── main.tsx
```

### 2.2 目标结构

```
fixit-web/src/
├── api/                    # API 服务层
│   ├── index.ts            # Axios 实例 + 拦截器
│   ├── types.ts            # 共享类型定义
│   ├── auth.ts
│   ├── question.ts
│   ├── review.ts
│   ├── tag.ts
│   ├── file.ts
│   └── ai.ts
├── stores/                 # 状态管理
│   ├── index.ts            # Store 统一导出
│   ├── userStore.ts        # 认证状态
│   ├── questionStore.ts    # 题目相关状态
│   ├── reviewStore.ts      # 复习相关状态
│   └── commonStore.ts      # 共享状态
├── components/             # 公共组件
│   ├── Markdown/
│   │   ├── index.tsx       # MarkdownEditor
│   │   └── Preview.tsx     # MarkdownPreview
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   ├── Common/
│   │   ├── Loading.tsx
│   │   ├── Empty.tsx
│   │   └── ErrorBoundary.tsx
│   └── index.ts            # 统一导出
├── hooks/                  # 自定义 Hooks
│   ├── index.ts
│   ├── useSubjectSearch.ts
│   ├── useQuestionData.ts
│   ├── useReviewData.ts
│   ├── useDebounce.ts
│   ├── usePagination.ts
│   └── useLocalStorage.ts
├── utils/                  # 工具函数
│   ├── index.ts
│   ├── format.ts           # 日期格式化
│   ├── validation.ts       # 表单验证
│   └── constants.ts        # 常量定义
├── pages/                  # 页面组件
│   ├── index.ts            # 页面导出
│   ├── Auth/
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── Home/
│   │   ├── index.tsx
│   │   ├── Dashboard.tsx
│   │   └── QuickActions.tsx
│   ├── Import/
│   │   ├── index.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── AIAssistant.tsx
│   │   └── QuestionForm.tsx
│   ├── Questions/
│   │   ├── index.tsx
│   │   ├── QuestionTable.tsx
│   │   └── QuestionFilters.tsx
│   ├── Practice/
│   │   ├── index.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── AnswerSection.tsx
│   │   └── FilterModal.tsx
│   └── Stats/
│       ├── index.tsx
│       ├── Heatmap.tsx
│       ├── MonthlyCalendar.tsx
│       ├── MasteryDistribution.tsx
│       └── StatsCards.tsx
├── routes/                 # 路由配置
│   ├── index.ts
│   ├── routes.tsx
│   └── PrivateRoute.tsx
├── types/                  # 全局类型
│   ├── api.ts
│   ├── store.ts
│   └── component.ts
├── App.tsx
├── main.tsx
└── global.css
```

### 2.3 目录变更清单

| 操作 | 路径 | 说明 |
|-----|------|------|
| 新增 | `hooks/` | 自定义 Hooks 目录 |
| 新增 | `utils/` | 工具函数目录 |
| 新增 | `routes/` | 路由配置目录 |
| 新增 | `types/` | 全局类型目录 |
| 新增 | `components/Markdown/` | Markdown 组件子目录 |
| 新增 | `components/Layout/` | 布局组件子目录 |
| 新增 | `components/Common/` | 通用组件子目录 |
| 重构 | `pages/Import/` | 拆分为多个子组件 |
| 重构 | `pages/Practice/` | 拆分为多个子组件 |
| 重构 | `pages/Stats/` | 拆分为多个子组件 |
| 重构 | `pages/Questions/` | 拆分为多个子组件 |
| 新增 | `api/types.ts` | 共享类型定义 |
| 新增 | `stores/questionStore.ts` | 题目状态管理 |
| 新增 | `stores/reviewStore.ts` | 复习状态管理 |
| 新增 | `stores/commonStore.ts` | 共享状态管理 |
| 新增 | `stores/index.ts` | Store 统一导出 |

---

## 3. 组件重构优先级和时间估算

### 3.1 重构优先级矩阵

| 优先级 | 组件 | 当前行数 | 目标行数 | 预估工时 | 重构内容 |
|--------|------|---------|---------|---------|---------|
| **P0** | PracticePage | 449 | 150 | 1d | 拆分为 5 个子组件 |
| **P0** | ImportPage | 494 | 150 | 1d | 拆分为 4 个子组件 |
| **P1** | StatsPage | 646 | 200 | 1d | 拆分为 5 个子组件 |
| **P1** | Questions/index | 226 | 120 | 0.5d | 抽离表格和筛选 |
| **P1** | HomePage | 223 | 150 | 0.5d | 抽离子组件 |
| **P2** | MarkdownEditor | 84 | 60 | 0.5d | 分离预览组件 |
| **P2** | LoginPage | 62 | 50 | 0.25d | 微调 |
| **P2** | RegisterPage | - | - | 0.25d | 参照 Login 调整 |

### 3.2 PracticePage 重构详细方案

**当前问题：**
- 494 行，职责过多
- 复习流程 + 筛选弹窗 + 完成页混合
- 键盘事件监听逻辑复杂

**拆分方案：**

```
pages/Practice/
├── index.tsx              # 主组件，组合子组件
├── QuestionCard.tsx       # 题目展示卡片 (~80行)
├── AnswerSection.tsx      # 答案展示区域 (~60行)
├── ReviewControls.tsx     # 复习操作按钮 (~50行)
├── FilterModal.tsx        # 筛选弹窗 (~80行)
└── CompletionScreen.tsx   # 完成页面 (~60行)
```

**重构后 index.tsx：**

```typescript
// pages/Practice/index.tsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Progress, Button } from 'antd';
import { QuestionCard } from './QuestionCard';
import { AnswerSection } from './AnswerSection';
import { ReviewControls } from './ReviewControls';
import { FilterModal } from './FilterModal';
import { CompletionScreen } from './CompletionScreen';
import { useReviewData } from '@/hooks/useReviewData';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { ReviewStatus, Question } from '@/api/types';

export default function PracticePage() {
  const navigate = useNavigate();
  const {
    questions,
    currentIndex,
    loading,
    filters,
    showAnswer,
    completed,
    fetchQuestions,
    setShowAnswer,
    handleReview,
    setFilters,
  } = useReviewData();

  // 键盘控制
  useKeyboardControls({
    showAnswer,
    onShowAnswer: setShowAnswer,
    onReview: handleReview,
    disabled: completed,
  });

  if (loading) return <LoadingSpinner />;
  if (completed) return <CompletionScreen count={questions.length} onFinish={() => navigate('/')} />;
  if (!questions[currentIndex]) return <EmptyQuestions />;

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')}>
            返回
          </Button>
          <span>复习进度 {currentIndex + 1} / {questions.length}</span>
          <Progress percent={progress} showInfo={false} style={{ width: 120 }} />
          <Button icon={<FilterOutlined />} onClick={() => setFilterModalVisible(true)}>
            筛选
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <QuestionCard question={currentQuestion} />
          <AnswerSection
            question={currentQuestion}
            show={showAnswer}
            onToggle={() => setShowAnswer(!showAnswer)}
          />
          {showAnswer && (
            <ReviewControls
              onReview={handleReview}
              submitting={submitting}
            />
          )}
        </Card>

        {!showAnswer && <KeyboardHint />}
      </main>

      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          fetchQuestions(newFilters);
        }}
        onClose={() => setFilterModalVisible(false)}
      />
    </div>
  );
}
```

### 3.3 ImportPage 重构详细方案

**拆分方案：**

```
pages/Import/
├── index.tsx              # 主组件
├── ImageUploader.tsx      # 图片上传区域 (~100行)
├── AIAssistant.tsx        # AI 辅助面板 (~80行)
└── QuestionForm.tsx       # 题目表单 (~120行)
```

### 3.4 StatsPage 重构详细方案

**拆分方案：**

```
pages/Stats/
├── index.tsx              # 主组件
├── Heatmap.tsx            # 热力图组件 (~80行)
├── MonthlyCalendar.tsx     # 月历组件 (~60行)
├── MasteryDistribution.tsx # 掌握程度分布 (~50行)
└── StatsCards.tsx          # 统计卡片组 (~40行)
```

---

## 4. 状态管理优化方案

### 4.1 Store 设计原则

1. **单一职责** - 每个 Store 只管理一个领域的状态
2. **扁平化** - 避免深层嵌套
3. **不可变性** - 使用 Immer 或手动创建新对象
4. **按需持久化** - 只持久化必要数据

### 4.2 Store 架构

```
┌─────────────────────────────────────────────────────────┐
│                    useUserStore                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ user: User | null                                │    │
│  │ token: string | null                              │    │
│  │ isLoggedIn: boolean                               │    │
│  └─────────────────────────────────────────────────┘    │
│  persist: true (token, user)                            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  useQuestionStore                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │ list: Question[]                                 │    │
│  │ loading: boolean                                 │    │
│  │ pagination: { page, pageSize, total }            │    │
│  │ filters: { subject, search, tag }               │    │
│  └─────────────────────────────────────────────────┘    │
│  actions: fetchList, create, update, delete              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   useReviewStore                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ pendingQuestions: Question[]                      │    │
│  │ currentIndex: number                             │    │
│  │ todayCount: number                               │    │
│  │ filters: ReviewFilterParams                      │    │
│  └─────────────────────────────────────────────────┘    │
│  actions: fetchPending, submitReview, updateFilters      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   useCommonStore                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ subjects: string[]                               │    │
│  │ tags: Tag[]                                      │    │
│  │ theme: 'light' | 'dark'                          │    │
│  │ sidebarCollapsed: boolean                         │    │
│  └─────────────────────────────────────────────────┘    │
│  actions: fetchSubjects, fetchTags, setTheme             │
└─────────────────────────────────────────────────────────┘
```

### 4.3 QuestionStore 实现

```typescript
// stores/questionStore.ts
import { create } from 'zustand';
import { questionApi, Question, QuestionListParams } from '@/api/question';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

interface QuestionState {
  // 状态
  list: Question[];
  loading: boolean;
  pagination: Pagination;
  filters: Omit<QuestionListParams, 'page' | 'pageSize'>;
  currentQuestion: Question | null;

  // Actions
  fetchList: (params?: QuestionListParams) => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  create: (data: CreateQuestionParams) => Promise<Question>;
  update: (id: string, data: UpdateQuestionParams) => Promise<void>;
  delete: (id: string) => Promise<void>;
  setFilters: (filters: QuestionState['filters']) => void;
  setPage: (page: number) => void;
}

export const useQuestionStore = create<QuestionState>((set, get) => ({
  list: [],
  loading: false,
  pagination: { page: 1, pageSize: 10, total: 0 },
  filters: {},
  currentQuestion: null,

  fetchList: async (params) => {
    const { filters, pagination } = get();
    set({ loading: true });

    try {
      const res = await questionApi.list({
        ...filters,
        page: params?.page ?? pagination.page,
        pageSize: params?.pageSize ?? pagination.pageSize,
      });

      set({
        list: res.data.data,
        pagination: {
          page: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
        },
      });
    } finally {
      set({ loading: false });
    }
  },

  fetchDetail: async (id) => {
    set({ loading: true });
    try {
      const res = await questionApi.get(id);
      set({ currentQuestion: res.data });
    } finally {
      set({ loading: false });
    }
  },

  create: async (data) => {
    const res = await questionApi.create(data);
    set((state) => ({
      list: [res.data, ...state.list],
    }));
    return res.data;
  },

  update: async (id, data) => {
    const res = await questionApi.update(id, data);
    set((state) => ({
      list: state.list.map((q) => (q.id === id ? res.data : q)),
      currentQuestion: state.currentQuestion?.id === id ? res.data : state.currentQuestion,
    }));
  },

  delete: async (id) => {
    await questionApi.delete(id);
    set((state) => ({
      list: state.list.filter((q) => q.id !== id),
    }));
  },

  setFilters: (filters) => {
    set({ filters });
    get().fetchList({ ...filters, page: 1 });
  },

  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page },
    }));
    get().fetchList({ ...get().filters, page });
  },
}));
```

### 4.4 共享 Hook 实现

```typescript
// hooks/useSubjectSearch.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { questionApi } from '@/api/question';

interface UseSubjectSearchOptions {
  debounceMs?: number;
  onError?: (error: unknown) => void;
}

export function useSubjectSearch(options: UseSubjectSearchOptions = {}) {
  const { debounceMs = 300, onError } = options;

  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (value: string) => {
    // 清除之前的定时器
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 设置新的定时器
    timerRef.current = setTimeout(async () => {
      if (!value.trim()) {
        setOptions([]);
        return;
      }

      setLoading(true);
      try {
        const res = await questionApi.getSubjects(value);
        setOptions(res.data);
      } catch (error) {
        onError?.(error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [debounceMs, onError]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { options, loading, search };
}
```

---

## 5. 性能优化策略

### 5.1 代码分割 (Code Splitting)

**当前状态：** 无代码分割，所有页面同步加载

**优化方案：** 使用 React.lazy + Suspense

```typescript
// routes/routes.tsx
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Loading from '@/components/Common/Loading';

// 懒加载页面组件
const HomePage = lazy(() => import('@/pages/Home'));
const QuestionsPage = lazy(() => import('@/pages/Questions'));
const PracticePage = lazy(() => import('@/pages/Practice'));
const ImportPage = lazy(() => import('@/pages/Import'));
const StatsPage = lazy(() => import('@/pages/Stats'));
const LoginPage = lazy(() => import('@/pages/Auth/Login'));
const RegisterPage = lazy(() => import('@/pages/Auth/Register'));
const EditQuestionPage = lazy(() => import('@/pages/Questions/Edit'));

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    ),
  },
  // ... 其他路由
];

// 路由配置导出
export const routeConfig = [
  { path: '/', component: HomePage, roles: ['user'] },
  { path: '/questions', component: QuestionsPage, roles: ['user'] },
  { path: '/questions/:id', component: EditQuestionPage, roles: ['user'] },
  { path: '/practice', component: PracticePage, roles: ['user'] },
  { path: '/import', component: ImportPage, roles: ['user'] },
  { path: '/stats', component: StatsPage, roles: ['user'] },
  { path: '/login', component: LoginPage, roles: ['guest'] },
  { path: '/register', component: RegisterPage, roles: ['guest'] },
];

// App.tsx 应用
import { useRoutes } from 'react-router-dom';
import { Suspense } from 'react';

function AppRoutes() {
  const element = useRoutes(routes);
  return <Suspense fallback={<Loading />}>{element}</Suspense>;
}

export default function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ConfigProvider>
  );
}
```

### 5.2 数据缓存策略

**方案：** 使用 TanStack Query (React Query)

```typescript
// hooks/useQuestionData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionApi } from '@/api/question';
import { QuestionListParams } from '@/api/types';

export function useQuestions(params?: QuestionListParams) {
  return useQuery({
    queryKey: ['questions', params],
    queryFn: () => questionApi.list(params).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5分钟内不重新请求
    gcTime: 30 * 60 * 1000,   // 30分钟后清理缓存
  });
}

export function useQuestion(id: string) {
  return useQuery({
    queryKey: ['question', id],
    queryFn: () => questionApi.get(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionParams) => questionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}
```

### 5.3 组件渲染优化

**方案：** React.memo + useMemo + useCallback

```typescript
// components/Common/QuestionCard.tsx
import { memo, useMemo } from 'react';
import { Card, Tag, Button } from 'antd';
import { MarkdownPreview } from '@/components/Markdown';
import { Question } from '@/api/types';
import { Link } from 'react-router-dom';

interface QuestionCardProps {
  question: Question;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

// 使用 memo 避免不必要的重渲染
export const QuestionCard = memo(function QuestionCard({
  question,
  onDelete,
  showActions = true,
}: QuestionCardProps) {
  // 使用 useMemo 缓存计算结果
  const masteryTag = useMemo(() => {
    const colors = ['default', 'default', 'green', 'blue', 'purple', 'gold'];
    const labels = ['未学', '初学', '熟悉', '掌握', '精通', '专家'];
    return {
      color: colors[question.masteryLevel] || 'default',
      label: labels[question.masteryLevel] || '未知',
    };
  }, [question.masteryLevel]);

  return (
    <Card size="small">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Tag color={masteryTag.color}>{masteryTag.label}</Tag>
          <Tag color="blue">{question.subject}</Tag>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Link to={`/questions/${question.id}`}>
              <Button type="link" size="small">编辑</Button>
            </Link>
            {onDelete && (
              <Popconfirm
                title="确定删除这道题目吗？"
                onConfirm={() => onDelete(question.id)}
              >
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            )}
          </div>
        )}
      </div>
      <MarkdownPreview content={question.content} />
    </Card>
  );
});

// 表格列使用 memo
export const columns = [
  {
    title: '学科',
    dataIndex: 'subject',
    key: 'subject',
    width: 100,
    render: (subject: string) => <Tag color="blue">{subject}</Tag>,
  },
  {
    title: '题目内容',
    dataIndex: 'content',
    key: 'content',
    ellipsis: true,
    render: (content: string) => (
      <div className="max-w-xs">
        <MarkdownPreview content={content} />
      </div>
    ),
  },
  // ...
];
```

### 5.4 图片懒加载

```typescript
// components/Common/ImagePreview.tsx
import { lazy, Suspense, useState } from 'react';

interface ImagePreviewProps {
  src: string;
  alt?: string;
}

// 使用原生 lazy loading
function LazyImage({ src, alt }: ImagePreviewProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="bg-gray-100 flex items-center justify-center h-24">
        <span className="text-gray-400">图片加载失败</span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="bg-gray-100 flex items-center justify-center h-24">
          <span className="text-gray-400">加载中...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}
```

### 5.5 预加载策略

```typescript
// utils/preload.ts
// 预加载下一页可能用到的资源

const preloadPage = (path: string) => {
  switch (path) {
    case '/practice':
      import('@/pages/Practice');
      import('@/api/review');
      break;
    case '/stats':
      import('@/pages/Stats');
      break;
    // ...
  }
};

// 在路由切换时预加载
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function usePagePreload() {
  const location = useLocation();

  useEffect(() => {
    // 预加载当前页面的资源
    preloadPage(location.pathname);
  }, [location.pathname]);
}
```

---

## 6. API 层优化

### 6.1 统一类型定义

```typescript
// api/types.ts

// 通用类型
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Question 相关
export interface Question {
  id: string;
  content: string;
  answer: string;
  analysis?: string;
  images: string[];
  subject: string;
  masteryLevel: number;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ tag: { id: string; name: string } }>;
}

export interface CreateQuestionParams {
  content: string;
  answer: string;
  analysis?: string;
  images?: string[];
  subject: string;
  tags?: string[];
}

export interface UpdateQuestionParams {
  content?: string;
  answer?: string;
  analysis?: string;
  images?: string[];
  subject?: string;
  masteryLevel?: number;
}

export interface QuestionListParams extends PaginationParams {
  subject?: string;
  tag?: string;
  masteryLevel?: number;
  search?: string;
}

export interface QuestionListResponse {
  data: Question[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// User 相关
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

// Review 相关
export type ReviewStatus = 'FORGOTTEN' | 'FUZZY' | 'MASTERED';

export interface ReviewStats {
  totalQuestions: number;
  dueToday: number;
  thisWeekReviews: number;
  masteryDistribution: Array<{
    level: number;
    count: number;
  }>;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string | null;
  totalDays: number;
}

// Tag 相关
export interface Tag {
  id: string;
  name: string;
  category: string;
  color: string;
  createdAt: string;
}
```

### 6.2 统一错误处理

```typescript
// api/error.ts
import { message } from 'antd';

// 判断是否为 Axios 错误
function isAxiosError(error: unknown): error is AxiosError<{ message?: string }> {
  return (error as AxiosError)?.isAxiosError === true;
}

// 提取错误消息
export function extractErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || error.message || '请求失败';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误，请重试';
}

// 统一的错误处理函数
export function handleApiError(error: unknown, fallbackMessage?: string): void {
  const messageText = extractErrorMessage(error);
  message.error(fallbackMessage || messageText);
  console.error('API Error:', error);
}

// 错误边界处理
export function createErrorHandler(componentName: string) {
  return (error: unknown, errorInfo: ErrorInfo) => {
    console.error(`Error in ${componentName}:`, error, errorInfo);
    message.error('操作失败，请重试');
  };
}
```

### 6.3 Axios 拦截器优化

```typescript
// api/index.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const { response } = error;

    // 401 未授权 - 清除 token 并跳转登录
    if (response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user-storage'); // Zustand persist key

      // 使用 window.location 避免在拦截器中使用 react-router hook
      if (!window.location.pathname.includes('/login')) {
        window.sessionStorage.setItem('redirectUrl', window.location.pathname);
        window.location.href = '/login';
      }
    }

    // 其他错误 - 显示错误消息
    const errorMessage = response?.data?.message || error.message || '请求失败';
    message.error(errorMessage);

    return Promise.reject(error);
  }
);

export default api;
```

---

## 7. 实现时间线

### 7.1 Sprint 规划

| Sprint | 任务 | 产出 | 工时 |
|--------|------|------|------|
| **Sprint 1** | 目录结构 + 公共 Hooks | 新目录结构、Hook | 2d |
| **Sprint 2** | PracticePage 重构 | 5 个子组件 | 1d |
| **Sprint 3** | ImportPage 重构 | 4 个子组件 | 1d |
| **Sprint 4** | StatsPage 重构 | 5 个子组件 | 1d |
| **Sprint 5** | Store 重构 + React Query | 4 个 Store | 1.5d |
| **Sprint 6** | 代码分割 + 性能优化 | Lazy loading | 1d |
| **Sprint 7** | 收尾 + 测试 | 完整重构 | 0.5d |

### 7.2 验收标准

- [ ] 所有页面组件平均行数 < 150 行
- [ ] 首屏加载时间减少 40%+
- [ ] 代码重复率 < 5%
- [ ] 所有 API 调用有错误处理
- [ ] TypeScript 无编译错误
- [ ] ESLint 无警告

### 7.3 风险与对策

| 风险 | 可能性 | 影响 | 对策 |
|------|--------|------|------|
| 重构引入新 Bug | 中 | 高 | 单元测试 + E2E 测试 |
| 开发时间超出预期 | 中 | 中 | 预留 20% buffer |
| 性能提升不明显 | 低 | 中 | 持续监控 Core Web Vitals |

---

## 8. 附录

### 8.1 新增依赖

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0"
  }
}
```

### 8.2 推荐的 ESLint 配置

```javascript
// .eslintrc.cjs
module.exports = {
  rules: {
    // 强制使用函数式组件
    'react/function-component-definition': [
      2,
      { namedComponents: 'arrow-function' },
    ],
    // 强制组件使用 memo
    'react.memo': 'warn',
    // 强制 hooks 使用 use 前缀
    'hooks/naming': 'error',
  },
};
```

### 8.3 参考资料

- [React 19 文档](https://react.dev)
- [Zustand 文档](https://zustand-demo.pmnd.rs)
- [TanStack Query 文档](https://tanstack.com/query/latest)
- [Vite 性能优化指南](https://vitejs.dev/guide/performance)
