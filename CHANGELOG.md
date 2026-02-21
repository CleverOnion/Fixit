# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.1] - 2026-02-21

### Added

- **快速刷题答案隐藏** - 答案默认隐藏，按空格键或点击答案区域显示
- **键盘快捷键增强** - 空格键切换答案显示，数字键选择掌握程度，Enter提交，Escape关闭

### Changed

- 优化快速刷题交互体验，避免直接看到答案

## [1.1.0] - 2026-02-21

### Added

- **练习历史页面** - 将练习历程弹窗改造为独立页面，采用艺术感编辑风格设计
- **题目备注功能** - 支持为题目添加备注，在题库列表和练习弹窗中显示
- **练习心得笔记** - 快速刷题时可记录心得笔记

### Changed

- 练习历史支持三种状态显示：忘记、有点模糊、完全掌握
- 优化页面背景色与主题系统的一致性
- 支持浅色/深色模式自适应切换

### Fixed

- 修复深色模式下文字颜色显示问题
- 修复浅色/深色模式页面背景色不一致问题

## [1.0.0] - 2026-02-20

### Added

- Initial stable release of Fixit

### Features

- 🚀 **Quick Entry** - Support for text, images, formulas, code等多种格式
- 🤖 **AI Smart Tags** - Auto-analyze questions and generate knowledge point tags
- 📅 **Scientific Review** - Smart review reminders based on Ebbinghaus forgetting curve
- 📊 **Data Statistics** - Visualize mastery level and track learning progress
- 📤 **Export & Share** - Export beautiful PDF for printing and sharing
- 👥 **Invitation Codes** - Elegant user invitation mechanism

### Tech Stack

**Frontend**
- React 19 + TypeScript
- Vite + Ant Design 6
- Zustand + React Router v7
- Tailwind CSS

**Backend**
- NestJS 11 + TypeScript
- Prisma 5 + PostgreSQL 17
- JWT + MinIO
- OpenAI API integration

### Deployment

- Docker + Docker Compose
- Caddy reverse proxy with automatic HTTPS
