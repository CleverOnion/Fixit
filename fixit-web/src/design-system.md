# Fixit 设计系统规范 v2.0

## 静谧之境 | Silent Zenith

> "在深邃中寻找秩序，于静谧处生长智慧"

---

## 1. 设计哲学

### 1.1 核心理念

Fixit 的设计语言建立在"静谧之境"主题之上，追求深邃、克制、高级感的视觉体验。

| 支柱 | 定义 | 实践方式 |
|------|------|----------|
| **静谧 (Silence)** | 深邃、不扰、沉浸 | 纯黑背景、隐藏冗余、聚焦内容 |
| **秩序 (Order)** | 结构清晰、逻辑可循 | 网格系统、视觉层级、节奏韵律 |
| **生长 (Growth)** | 从错误中生长智慧 | 暖色点缀、成长隐喻、希望感 |

### 1.2 设计灵感

- **Linear**: 工具级精致，键盘驱动的效率美学
- **Notion**: 无限可能中的简洁
- **Raycast**: 轻量入口，快速触达
- **Vercel**: 深色美学的高级演绎

### 1.3 设计原则

1. **内容优先**: 界面为内容服务，克制用色
2. **沉浸体验**: 深色背景营造专注氛围
3. **精致细节**: 1px 的差异决定高级感的成败
4. **自然交互**: 符合直觉，减少认知负担

---

## 2. 色彩系统

### 2.1 主色调 - Deep Dark + Coral

```
背景色系
├── #0a0a0a  ████████████████  Deep (页面主背景)
├── #141414  ████████████      Input (输入框背景)
├── #1a1a1a  ███████████       Card (卡片背景)
└── #1f1f1f  ██████████        Surface (悬浮背景)

边框色系
├── #2a2a2a  ████████  Border Subtle (细微边框)
├── #3a3a3a  ██████    Border Default (默认边框)
└── #4a4a4a  █████     Border Focus (聚焦边框)

文字色系
├── #ededed  ████████████████  Text Primary (主要文字)
├── #8a8a8a  ████████████       Text Secondary (次要文字)
├── #525252  ██████████         Text Placeholder (占位文字)
└── #171717  ████████████████   Text Inverse (反色文字)

点缀色系 (Coral - 成长与希望)
├── #ff6b6b  ████████████  Accent (品牌点缀)
├── #ff8585  ██████████    Accent Hover (悬浮)
└── rgba(255, 107, 107, 0.15)  ██  Accent Dim (柔和背景)
```

### 2.2 功能色

```
成功  #10B981  ───  完成、正确、掌握
警告  #F59E0B  ───  待处理、模糊、提醒
错误  #EF4444  ───  删除、危险、错误
```

### 2.3 复习状态色

```
未学习  #4a4a4a  ──  Level 0-1: 灰色，尚未接触
模糊    #F59E0B  ──  Level 2-3: 琥珀色，需要巩固
熟悉    #10B981  ──  Level 4: 绿色，形成记忆
精通    #ff6b6b  ██  Level 5: 珊瑚色，深度内化
```

### 2.4 色彩使用规范

```css
/* 页面背景 */
.bg-page {
  background: #0a0a0a;
}

/* 卡片 */
.card {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
}

/* 输入框 */
.input {
  background: #141414;
  border: 1px solid #2a2a2a;
}

.input:focus {
  border-color: #ff6b6b;
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.15);
}

/* 主要文字 */
.text-primary {
  color: #ededed;
}

.text-secondary {
  color: #8a8a8a;
}

/* 按钮 */
.btn-primary {
  background: linear-gradient(135deg, #ff6b6b 0%, #e54d2e 100%);
}
```

---

## 3. 字体系统

### 3.1 字体族

```
字体配置
├── Display:  "Georgia", "Times New Roman", serif (Logo)
├── Body:     "Inter", -apple-system, BlinkMacSystemFont, sans-serif
└── Mono:     "JetBrains Mono", "Fira Code", monospace (代码)
```

### 3.2 字号层级

```
基础字号: 16px (1rem)

├── Display   48px / 3rem    ──  Hero、大标题
├── H1        32px / 2rem    ──  页面主标题
├── H2        24px / 1.5rem  ──  卡片标题、区块标题
├── H3        20px / 1.25rem ──  列表项标题
├── Body L    18px / 1.125rem ──  强调正文
├── Body      16px / 1rem    ──  标准正文
├── Body S    14px / 0.875rem ──  辅助说明
└── Caption   12px / 0.75rem ──  标签、日期
```

### 3.3 字重规范

| 场景 | 字重 | 说明 |
|------|------|------|
| Logo | 600 (Semibold) | 衬线体，优雅 |
| 页面标题 | 500 (Medium) | 清晰但不沉重 |
| 正文内容 | 400 (Regular) | 最佳可读性 |
| 辅助文字 | 400 (Regular) | 保持一致性 |

---

## 4. 间距系统

### 4.1 基础间距单位

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
}
```

### 4.2 页面布局间距

```
页面容器
├── 页面外边距: 24px (左右)
├── 内容区最大宽度: 400px (登录/注册)
├── 卡片内边距: 24px
├── 输入框高度: 48px
└── 按钮高度: 48px
```

---

## 5. 圆角与阴影

### 5.1 圆角系统

```
圆角层级
├── --radius-sm:   6px   ──  标签、小按钮
├── --radius-md:  10px   ──  输入框、主要按钮
├── --radius-lg:  14px   ──  卡片
└── --radius-xl:  20px   ──  大卡片、装饰元素
```

### 5.2 阴影系统

```
阴影层级
├── --shadow-xs:   0 1px 2px rgba(0, 0, 0, 0.2)
├── --shadow-sm:   0 2px 8px rgba(0, 0, 0, 0.2)
├── --shadow-md:   0 4px 16px rgba(0, 0, 0, 0.25)
├── --shadow-lg:   0 8px 32px rgba(0, 0, 0, 0.3)
├── --shadow-glow: 0 0 40px rgba(255, 107, 107, 0.15)
└── --shadow-focus: 0 0 0 4px rgba(255, 107, 107, 0.15)
```

---

## 6. 登录/注册页视觉规范

### 6.1 设计理念

**大气、沉稳、信任感**

登录/注册页面是用户进入 Fixit 的第一印象，需要传达：
- 专业的工具感
- 深邃的沉浸氛围
- 精致的设计细节
- 可信赖的品牌形象

### 6.2 布局结构

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│          ┌─────────────────────────────────┐       │
│          │                                 │       │
│          │          [Fixit Logo]           │       │
│          │                                 │       │
│          ├─────────────────────────────────┤       │
│          │                                 │       │
│          │       欢迎回来                   │       │
│          │    继续你的错题管理之旅          │       │
│          │                                 │       │
│          ├─────────────────────────────────┤       │
│          │                                 │       │
│          │    [邮箱图标] [────────────]    │       │
│          │    [密码图标] [────────────]    │       │
│          │                                 │       │
│          │       [忘记密码？]              │       │
│          │                                 │       │
│          │      [      登录      ]        │       │
│          │                                 │       │
│          ├─────────────────────────────────┤       │
│          │                                 │       │
│          │   还没有账号？ [立即注册]        │       │
│          │                                 │       │
│          └─────────────────────────────────┘       │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 6.3 设计规范详情

#### 6.3.1 页面容器

```css
.page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  overflow: hidden;
}
```

#### 6.3.2 背景装饰

```css
/* 顶部光晕 */
.glowOrb {
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(
    ellipse 70% 50% at 50% 0%,
    rgba(255, 107, 107, 0.08) 0%,
    transparent 60%
  );
  pointer-events: none;
}

/* 底部光晕 */
.glowOrb2 {
  position: absolute;
  bottom: -200px;
  right: -200px;
  width: 500px;
  height: 500px;
  background: radial-gradient(
    ellipse 60% 40% at 50% 100%,
    rgba(99, 102, 241, 0.05) 0%,
    transparent 60%
  );
  pointer-events: none;
}
```

#### 6.3.3 卡片容器

```css
.container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: 0 24px;
}
```

#### 6.3.4 Logo 区域

```css
.logoSection {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.logoIcon {
  width: 40px;
  height: 40px;
}

.logoIcon svg {
  width: 100%;
  height: 100%;
}

.logoText {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 28px;
  font-weight: 600;
  color: #ededed;
  letter-spacing: -0.02em;
}
```

#### 6.3.5 标题区域

```css
.header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 32px;
  font-weight: 500;
  color: #ededed;
  margin: 0 0 8px 0;
  letter-spacing: -0.01em;
}

.subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: #8a8a8a;
  margin: 0;
}
```

#### 6.3.6 输入框

```css
.inputWrapper {
  position: relative;
  height: 48px;
}

.inputIcon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #525252;
  font-size: 16px;
  transition: color 0.2s ease;
  z-index: 1;
}

.input {
  width: 100%;
  height: 100%;
  padding: 0 14px 0 44px;
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  color: #ededed;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  outline: none;
  transition: all 0.2s ease;
}

.input::placeholder {
  color: #525252;
}

.input:hover {
  border-color: #3a3a3a;
}

.input:focus {
  border-color: #ff6b6b;
  background: #1a1a1a;
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.15);
}

.input:focus ~ .inputIcon {
  color: #ff6b6b;
}
```

#### 6.3.7 按钮

```css
.submitBtn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #ff6b6b 0%, #e54d2e 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submitBtn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.35);
}

.submitBtn:active:not(:disabled) {
  transform: translateY(0);
}

.submitBtn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
```

#### 6.3.8 链接

```css
.link {
  color: #ff6b6b;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.link:hover {
  color: #ff8585;
}

.link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 1px;
  background: #ff6b6b;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.2s ease;
}

.link:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

### 6.4 动效设计

#### 6.4.1 页面加载动效

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 错落加载 */
.logoSection {
  animation: fadeInUp 0.6s ease-out 0.1s both;
}

.header {
  animation: fadeInUp 0.6s ease-out 0.2s both;
}

.form {
  animation: fadeInUp 0.6s ease-out 0.3s both;
}

.footer {
  animation: fadeIn 0.6s ease-out 0.5s both;
}
```

#### 6.4.2 加载状态

```css
.loadingState {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

### 6.5 响应式设计

```css
@media (max-width: 480px) {
  .container {
    padding: 0 20px;
  }

  .title {
    font-size: 28px;
  }

  .logoText {
    font-size: 24px;
  }

  .input {
    font-size: 16px; /* 避免 iOS 自动缩放 */
  }
}
```

### 6.6 无障碍设计

```css
/* 聚焦轮廓 */
.input:focus-visible {
  outline: 2px solid #ff6b6b;
  outline-offset: 2px;
}

.submitBtn:focus-visible {
  outline: 2px solid #ff6b6b;
  outline-offset: 2px;
}

.link:focus-visible {
  outline: 2px solid #ff6b6b;
  outline-offset: 2px;
}

/* 减少动效 */
@media (prefers-reduced-motion: reduce) {
  .page *,
  .page *::before,
  .page *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. 组件规范

### 7.1 按钮变体

| 类型 | 背景 | 边框 | 文字颜色 | 使用场景 |
|------|------|------|----------|----------|
| Primary | 渐变 Coral | 无 | 白色 | 主要操作 |
| Secondary | 透明 | 1px #3a3a3a | #ededed | 次要操作 |
| Ghost | 透明 | 无 | #ededed | 文字链接 |
| Danger | #EF4444 | 无 | 白色 | 删除操作 |

### 7.2 输入框变体

| 类型 | 背景 | 边框 | 圆角 | 使用场景 |
|------|------|------|------|----------|
| Default | #141414 | 1px #2a2a2a | 10px | 常规输入 |
| Focus | #1a1a1a | 1px #ff6b6b | 10px | 聚焦状态 |
| Error | #1a1a1a | 1px #EF4444 | 10px | 错误状态 |

### 7.3 卡片变体

| 类型 | 背景 | 边框 | 圆角 | 阴影 |
|------|------|------|------|------|
| Default | #1a1a1a | 1px #2a2a2a | 14px | 无 |
| Hover | #1a1a1a | 1px #3a3a3a | 14px | --shadow-md |
| Elevated | #1a1f1a | 1px #2a2a2a | 14px | --shadow-lg |

---

## 8. 设计令牌完整清单

```css
:root {
  /* ========================================
     Design Tokens - Fixit Design System v2.0
     "静谧之境" - Silent Zenith Theme
     深色主题高级感设计
     ======================================== */

  /* Background Colors */
  --fi-bg-deep: #0a0a0a;
  --fi-bg-input: #141414;
  --fi-bg-card: #1a1a1a;
  --fi-bg-surface: #1f1f1f;

  /* Border Colors */
  --fi-border-subtle: #2a2a2a;
  --fi-border-default: #3a3a3a;
  --fi-border-strong: #4a4a4a;

  /* Text Colors */
  --fi-text-primary: #ededed;
  --fi-text-secondary: #8a8a8a;
  --fi-text-placeholder: #525252;
  --fi-text-inverse: #171717;

  /* Accent Colors - Coral */
  --fi-accent: #ff6b6b;
  --fi-accent-hover: #ff8585;
  --fi-accent-dim: rgba(255, 107, 107, 0.15);
  --fi-accent-gradient: linear-gradient(135deg, #ff6b6b 0%, #e54d2e 100%);

  /* Functional Colors */
  --fi-success: #10B981;
  --fi-warning: #F59E0B;
  --fi-error: #EF4444;

  /* Status Colors */
  --fi-status-learning: #4a4a4a;
  --fi-status-fuzzy: #F59E0B;
  --fi-status-familiar: #10B981;
  --fi-status-mastered: #ff6b6b;

  /* Border Radius */
  --fi-radius-sm: 6px;
  --fi-radius-md: 10px;
  --fi-radius-lg: 14px;
  --fi-radius-xl: 20px;

  /* Shadows */
  --fi-shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
  --fi-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --fi-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.25);
  --fi-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3);
  --fi-shadow-glow: 0 0 40px rgba(255, 107, 107, 0.15);
  --fi-shadow-focus: 0 0 0 4px rgba(255, 107, 107, 0.15);

  /* Typography */
  --fi-font-display: 'Georgia', 'Times New Roman', serif;
  --fi-font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --fi-font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --fi-size-display: 48px;
  --fi-size-h1: 32px;
  --fi-size-h2: 24px;
  --fi-size-h3: 20px;
  --fi-size-body-l: 18px;
  --fi-size-body: 16px;
  --fi-size-body-s: 14px;
  --fi-size-caption: 12px;

  /* Spacing (4px baseline) */
  --fi-space-1: 4px;
  --fi-space-2: 8px;
  --fi-space-3: 12px;
  --fi-space-4: 16px;
  --fi-space-5: 20px;
  --fi-space-6: 24px;
  --fi-space-8: 32px;
  --fi-space-10: 40px;
  --fi-space-12: 48px;

  /* Transitions */
  --fi-transition-fast: 150ms ease;
  --fi-transition-base: 200ms ease;
  --fi-transition-slow: 300ms ease;
}
```

---

## 9. 实施检查清单

### 新页面开发

- [ ] 使用设计令牌颜色
- [ ] 使用规范字号
- [ ] 使用规范间距
- [ ] 响应式布局适配
- [ ] 加载状态处理
- [ ] 空状态处理
- [ ] 无障碍支持

### 代码审查

- [ ] 无硬编码颜色
- [ ] 无硬编码字号
- [ ] 组件样式与规范一致
- [ ] 交互反馈符合规范
- [ ] 动效时长符合标准
- [ ] 无障碍访问支持

---

## 10. 附录

### 10.1 Logo 规范

```svg
<svg viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="8" fill="url(#logo-gradient)" />
  <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  <defs>
    <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
      <stop stopColor="#ff6b6b" />
      <stop offset="1" stopColor="#e54d2e" />
    </linearGradient>
  </defs>
</svg>
```

### 10.2 图标使用

使用 Ant Design Icons，尺寸规范：

| 场景 | 尺寸 |
|------|------|
| 输入框图标 | 16px |
| 按钮图标 | 16px |
| 导航图标 | 20px |
| 页面标题图标 | 24px |

### 10.3 动画时长参考

| 动效类型 | 时长 | 缓动 |
|----------|------|------|
| 颜色变化 | 150ms | ease |
| 位移变化 | 200ms | ease |
| 透明度变化 | 200ms | ease |
| 页面加载 | 600ms | ease-out |
| 加载旋转 | 800ms | linear |

---

**版本**: 2.0
**最后更新**: 2026-02-10
**审核**: 高级视觉设计师

---

> "静谧不是沉默，而是在深邃中听见成长的声音。"
> Silence is not silence, but hearing the sound of growth in the depths.
