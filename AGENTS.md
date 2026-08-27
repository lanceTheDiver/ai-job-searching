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

## 项目级 Skill

项目级 Skill 的真实内容统一存放在 `.agents/skills/`，`.claude/skills/` 中保留同名软链接，供支持 Claude Skill 目录约定的工具发现。不得复制两份 Skill 内容；修改 Skill 时只修改 `.agents/skills/<skill-name>/` 中的源文件。

`@路径` 是供支持该语法的工具使用的引用。对于不支持自动展开 `@路径` 的 AI（包括 Codex），触发 Skill 后必须从项目根目录解析软链接，并在执行相关任务、修改文件或运行实现命令前，完整读取对应的 `SKILL.md`。不得只读取 frontmatter、摘要或部分章节。

### 通用触发规则

- 用户使用 `$skill-name`、直接点名 Skill，或明确要求“使用某个 Skill”时，必须使用对应 Skill。
- 即使用户没有点名，只要任务与下方描述明确匹配，也必须自动触发对应 Skill。
- 只启用完成任务所需的最小 Skill 集合，不得因为任务涉及前端就默认加载全部设计 Skill。
- 同时触发多个 Skill 时，必须先说明使用顺序；重构类任务先执行审计 Skill，再执行具体视觉方向 Skill。
- 使用 Skill 前，必须用一句话告知用户正在使用哪个 Skill 以及原因。
- Skill 与用户明确要求冲突时，以用户要求为准；Skill 与本文件其他强制规则冲突时，以本文件规则为准。
- Skill 文件缺失、软链接失效或内容无法读取时，必须简短说明，并使用最接近的项目规范继续完成任务。

### Skill 触发映射

#### 视觉方向与反模板化

@.claude/skills/design-taste-frontend/SKILL.md

触发场景：新建或重做 Landing Page、营销页、作品集、品牌页、编辑型页面，或用户要求界面更有设计感、更独特、避免模板感。该 Skill 不适用于数据表格、复杂 Dashboard 或多步骤产品工作流，除非任务同时包含独立的营销页面。

#### 高端视觉与动效

@.claude/skills/high-end-visual-design/SKILL.md

触发场景：用户明确要求高端、奢华、精品、顶级代理商、Awwwards、Apple/Linear 级质感、电影感或高质量动效。不得仅因为“优化一下 UI”就自动触发。

#### 极简编辑风格

@.claude/skills/minimalist-ui/SKILL.md

触发场景：用户明确要求极简、克制、编辑感、文档感、暖色单色、扁平 Bento、低阴影、无渐变或 muted pastel 视觉方向。

#### 现有项目重设计

@.claude/skills/redesign-existing-projects/SKILL.md

触发场景：用户要求重设计、改版、美化、升级、优化或现代化现有页面/项目，并要求保留现有功能。必须先审计当前实现，再进行针对性修改；不得默认推倒重写。

### 多 Skill 组合顺序

当现有页面重设计同时指定视觉方向时，按以下顺序执行：

1. `redesign-existing-projects`：扫描现有代码、审计问题、确认需要保留的功能和约束。
2. `design-taste-frontend`：确定页面受众、设计语言和整体视觉策略（仅限其适用页面类型）。
3. `high-end-visual-design` 或 `minimalist-ui`：根据用户指定方向选择其中一个细化视觉，不得在没有明确理由时同时使用两者。
4. 按 `.claude/docs/` 中的前端、React、Feature 和审查规范完成实现与验证。

## 规范文档

以下规范文件继续存放在 `.claude/docs/`，不得为了适配其他 AI 工具而移动或复制。

`@路径` 是供支持该语法的工具使用的引用。对于不支持自动展开 `@路径` 的 AI（包括 Codex），在开始开发、审查或执行命令前，必须从项目根目录主动打开并完整读取与当前任务相关的文件；若任务同时涉及多个类别，则必须读取全部相关文件。读取后应将其中的规则视为 `AGENTS.md` 的组成部分并严格遵循。

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
