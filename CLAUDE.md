# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fixit is a mistake management web application helping students convert wrong answers into mastered knowledge points. It features low-friction problem entry, AI-powered tagging, and Ebbinghaus-based review scheduling.

## Tech Stack

**Frontend (fixit-web)**: React 19, TypeScript, Vite, Ant Design 6, Zustand (state), React Router, Tailwind CSS
**Backend (fixit-api)**: NestJS 11, TypeScript, Prisma 5 (PostgreSQL), JWT auth, MinIO (file storage)
**Infrastructure**: Docker (PostgreSQL 15, MinIO), npm workspaces

## Commands

### Frontend
```bash
cd fixit-web
npm run dev          # Dev server at http://localhost:5173
npm run build        # TypeScript check + production build
npm run lint         # Run ESLint
```

### Backend
```bash
cd fixit-api
npm run start:dev    # Hot reload server (http://localhost:3000)
npm run test         # Run Vitest in watch mode
npm run test:run     # Run tests once (CI mode)
npm run format       # Prettier formatting
npm run lint         # ESLint with auto-fix
```

### Infrastructure
```bash
docker-compose up -d              # Start PostgreSQL (:5433) and MinIO (:9000/9001)
npx prisma migrate dev            # Run database migrations
npx prisma studio                 # Open database GUI
```

## Architecture

### Backend Modules (fixit-api/src/modules/)
- `auth/` - JWT authentication, register/login endpoints
- `question/` - Question CRUD, review scheduling
- `tag/` - Tag management (SYSTEM/CUSTOM types)
- `file/` - MinIO file upload/download
- `ai/` - OpenAI GPT-4o integration for auto-tagging

### Frontend Structure (fixit-web/src/)
- `api/` - Domain service files (auth.ts, question.ts, etc.)
- `stores/` - Zustand stores with localStorage persistence
- `pages/` - Route components (Login, Register, Home, Questions, Import)
- `components/` - Reusable components (MarkdownEditor.tsx)

### Database Schema
- `users` - Accounts with email, password, nickname, avatar
- `questions` - Content, answer, analysis, subject, mastery level, tags
- `tags` - SYSTEM/CUSTOM labels
- `question_tags` - Many-to-many relation
- `review_logs` - Review history with FORGOTTEN/FUZZY/MASTERED statuses

## Key Patterns

- **State**: Zustand with persistence middleware (localStorage)
- **Auth**: JWT stored in localStorage, PrivateRoute component for protected pages
- **API**: Service layer pattern with separate files per domain
- **Validation**: DTOs with class-validator on backend
- **Database**: Prisma ORM with cascading deletes enabled

## Access Points (when running)

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | - |
| Backend | http://localhost:3000 | - |
| MinIO Console | http://localhost:9001 | admin / password123 |
| PostgreSQL | localhost:5433 | fixit / fixit |

## Configuration

- Backend environment: `fixit-api/.env` (DB, JWT, MinIO, AI API keys)
- Frontend environment: `fixit-web/.env` (API base URL)
- Vite proxy config: `fixit-web/vite.config.ts` (proxies /api to localhost:3000)

## Version Management (IMPORTANT)

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

### Commit Message Format

```
<type>: <description>

[optional body]
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Note: Attribution disabled globally via ~/.claude/settings.json.
