# GitHub Copilot 配置

**重要：请始终遵循 AGENTS.md 中的项目规范**

本文件是 GitHub Copilot 的配置文件，核心规则定义在项目根目录的 [AGENTS.md](../AGENTS.md) 中。

## 规则来源

所有项目规范、代码风格、语言偏好等规则统一定义在项目根目录的 `AGENTS.md` 文件中，请在工作时严格遵守该文件中的所有指南。

### 核心要求（来自 AGENTS.md）

1. **语言偏好**：所有对话、注释、文档必须使用中文
2. **技术栈**：Next.js + TypeScript + Tailwind CSS + shadcn/ui
3. **样式规范**：优先使用 Tailwind CSS 实用类

详细规范已模块化，分为：
- **前端规范**：[rules/frontend.md](rules/frontend.md)
- **审查规范**：[rules/reviewer.md](rules/reviewer.md)
- **命令参考**：[commands/basic.md](commands/basic.md)
- **开发流程**：[commands/feature.md](commands/feature.md)
- **开发技巧**：[skills/react.md](skills/react.md)

## 配置说明

这个文件只是一个引用层，真正的规则在 `AGENTS.md` 中维护。这样做的好处是：
- 规则集中管理，避免重复
- 方便后续切换或同时使用多个 AI 工具
- 团队成员只需维护一份核心规范

---

**Note**: 如需修改项目规范，请直接编辑项目根目录的 `AGENTS.md` 文件。
