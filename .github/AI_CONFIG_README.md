# AI 配置说明

本项目的规则只在一处定义，各 AI 工具的配置文件仅作引用。

## 目录结构

```text
AGENTS.md                      核心规范与 Skill 触发规则
CLAUDE.md                      Claude 引用 AGENTS.md
.github/copilot-instructions.md  GitHub Copilot 引用 AGENTS.md
.claude/docs/
├── rules/                     规范：frontend.md、reviewer.md
├── guides/                    流程：basic.md、feature.md、commit.md
└── techniques/                技巧：react.md
.agents/skills/                项目级 Skill 的真实内容
.claude/skills/                指向 .agents/skills/ 的同名软链接
```

## 维护规则

- 新增或修改规则：编辑 `AGENTS.md` 或 `.claude/docs/` 下对应文件，不要在 `CLAUDE.md`、`copilot-instructions.md` 中重复定义。
- 新增规范文档：在 `.claude/docs/` 对应目录创建文件，并在 `AGENTS.md` 中用 `@路径` 引用。
- 修改 Skill：只改 `.agents/skills/<skill-name>/`，不得复制两份。
- 切换 AI 工具：保留 `AGENTS.md` 与 `.claude/docs/`，只增删对应工具的引用文件。
