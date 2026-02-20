# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

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
