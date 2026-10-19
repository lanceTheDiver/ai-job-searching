# AI 求职助手

基于 Next.js 的本地求职工具：上传 PDF 简历，由 AI 推导搜索条件，搜索并排序 BOSS 直聘 / LinkedIn 岗位，分析岗位匹配度，并辅助 LinkedIn 投递与记录。

## 功能

- **简历解析**：上传 PDF 简历，解析并保存原文件（`/` 首页）
- **岗位搜索**：AI 推导可编辑的搜索条件，搜索 BOSS 直聘 / LinkedIn，AI 排序（`/job-search`）
- **岗位分析**：对单个岗位做结构化匹配分析
- **搜索历史**：本机持久化搜索记录（`/search-history`）
- **投递辅助**：LinkedIn 辅助投递与投递记录（`/applications`）

## 环境要求

- Node.js 与 [pnpm](https://pnpm.io)（禁用 npm / yarn）
- [OmniRoute](http://localhost:20128/v1)：本地 OpenAI 兼容网关，提供模型调用
- Playwright 与本机 Chrome：LinkedIn 投递自动化
- `@jackwener/opencli`：BOSS 直聘搜索

## 快速开始

```bash
pnpm install
cp .env.example .env.local
```

在 `.env.local` 中填入 `OMNIROUTE_API_KEY`，其余变量均可选，说明见 `.env.example`。

```bash
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 常用命令

```bash
pnpm lint            # ESLint 检查
pnpm format          # Prettier 格式化
pnpm format:check    # Prettier 格式校验
pnpm tsc --noEmit    # 类型检查
```

## 本地数据

简历、搜索历史、投递记录默认保存在项目下的 `.data/`（已被 Git 忽略），路径可用 `.env.example` 中的变量覆盖。

## 开发规范

项目规范与 AI 助手配置见 [AGENTS.md](AGENTS.md)，规范文档位于 `.claude/docs/`。
