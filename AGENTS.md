<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 项目指南

## 语言偏好

**始终使用中文回复**。本项目的所有对话、代码注释、文档和解释都应该使用中文。

## 技术栈与核心原则

- **语言**: TypeScript (所有代码必须使用 TypeScript)
- **框架**: Next.js (App Router)
- **UI**: React 函数式组件 + Tailwind CSS + shadcn/ui
- **状态**: 优先本地状态 (useState/useReducer)，全局用 Zustand
- **包管理**: pnpm (禁用 npm/yarn)

## 项目结构

- `app/` - Next.js App Router 页面和 API Routes
- `components/` - React 组件
- `lib/` - 工具函数和服务层
- `lib/services/` - API 调用封装（禁止在组件中直接 fetch）

## 规范文档

### 前端开发规范
@.claude/docs/rules/frontend.md

### 代码审查规范
@.claude/docs/rules/reviewer.md

### 基础命令参考
@.claude/docs/guides/basic.md

### Feature 开发流程
@.claude/docs/guides/feature.md

### React 开发技巧
@.claude/docs/techniques/react.md
