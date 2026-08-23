# AI 配置说明

本项目采用模块化的 AI 配置结构，方便在不同 AI 工具之间切换。

## 目录结构

```
social-media-agent/
├── AGENTS.md                      ← 📋 核心规范（使用 @ 引用模块）
│
├── CLAUDE.md                      ← 🔗 Claude 引用配置
│
└── .github/
    ├── copilot-instructions.md    ← 🔗 GitHub Copilot 引用配置
    ├── rules/                     ← 📁 开发规范文档
    │   ├── frontend.md            （前端开发规范）
    │   └── reviewer.md            （代码审查规范）
    ├── commands/                  ← 📁 命令和工作流程
    │   ├── basic.md               （基础命令参考）
    │   └── feature.md             （Feature 开发流程）
    ├── skills/                    ← 📁 开发技巧和最佳实践
    │   └── react.md               （React 开发技巧）
    └── AI_CONFIG_README.md        （本文档）
```

## 设计原则

### 单一来源原则（Single Source of Truth）

所有项目规范、代码风格、语言偏好等**核心规则**都定义在 `AGENTS.md` 中，其他配置文件只是引用它。

### 目录分类

- **rules/** - "做什么"和"为什么"（规范、标准、原则）
- **commands/** - "怎么做"（命令、流程、步骤）
- **skills/** - "如何做得更好"（技巧、最佳实践、优化）

## 好处

1. **集中管理**：规则只需在一个地方维护
2. **易于切换**：切换 AI 工具时只需修改引用文件
3. **避免冲突**：不会出现多个文件规则不一致的情况
4. **简化协作**：团队成员只需关注 `AGENTS.md`
5. **清晰分类**：规范和命令分离，职责明确

## 使用指南

### 修改规则

✅ **正确做法**：编辑 `AGENTS.md` 或对应的模块文件
```bash
# 修改核心规范（添加/移除模块引用）
vim AGENTS.md

# 修改具体规范
vim .github/rules/frontend.md

# 修改命令流程
vim .github/commands/feature.md
```

❌ **错误做法**：在引用文件中重复定义规则
```bash
# 不要这样做
vim CLAUDE.md                             # ❌ 不要在这里写业务规则
vim .github/copilot-instructions.md      # ❌ 不要在这里写业务规则
```

### 切换 AI 工具

如果将来要：
- 完全切换到 Claude → 删除 `.github/copilot-instructions.md`
- 完全切换到 Copilot → 删除 `CLAUDE.md`
- 同时使用两者 → 保持当前结构

**关键**：无论用哪个工具，`AGENTS.md` 和模块化规范都保持不变！

## 当前规则概览

目前项目规范已模块化，分为以下文档：

### AGENTS.md（主入口）
- ✅ 语言偏好：所有对话使用中文
- 🔗 引用各个模块化规范文档

### 规范文档（.github/rules/）

**frontend.md**（前端规范）
- ✅ 技术栈：React + TypeScript + Next.js + Tailwind CSS + shadcn/ui
- ✅ 组件规范：函数式组件、Hooks、不超过 300 行
- ✅ 状态管理：本地状态优先，全局用 Zustand
- ✅ API 调用：后端用 API Routes，前端封装在 src/services/
- ✅ 代码格式化：创建文件后运行 Prettier

**reviewer.md**（审查规范）
- ✅ 审查重点：Bug、安全、重复、类型、架构、性能
- ✅ 审查原则：仅报告、不修改、标注严重程度

### 命令和流程（.github/commands/）

**basic.md**（基础命令）
- ✅ 开发命令：dev, build, start
- ✅ 代码质量：lint, format, 类型检查
- ✅ 依赖管理：使用 pnpm
- ✅ 常见工作流程参考

**feature.md**（开发流程）
- ✅ 完整的 11 步 feature 开发流程
- ✅ 从需求理解到代码审查
- ✅ 最佳实践和常见陷阱

### 开发技巧（.github/skills/）

**react.md**（React 技巧）
- ✅ 识别组件边界
- ✅ 优先使用组合而非继承
- ✅ 提取可复用的自定义 hooks
- ✅ 避免不必要的全局状态
- ✅ 避免不必要的 useEffect
- ✅ 合理使用记忆化（useMemo, useCallback, React.memo）
- ✅ 常见陷阱和代码示例

## 扩展建议

随着项目发展，可以继续添加：


### 技巧模块（.github/skills/）
- `typescript.md` - TypeScript 高级技巧
- `tailwind.md` - Tailwind CSS 最佳实践
- `nextjs.md` - Next.js 特定技巧
- `performance.md` - 性能优化技巧
- `accessibility.md` - 无障碍开发
### 规范模块（.github/rules/）
- `backend.md` - 后端开发规范
- `testing.md` - 测试规范
- `security.md` - 安全最佳实践
- `documentation.md` - 文档编写标准

### 命令模块（.github/commands/） 或 skills/
- `git.md` - Git 工作流程
- `deployment.md` - 部署流程
- `troubleshooting.md` - 问题排查步骤
- `refactor.md` - 重构流程

添加新模块时：
1. 在对应目录（rules/ 或 commands/）创建新的 .md 文件
2. 在 `AGENTS.md` 中添加引用
3. 保持模块独立，易于维护

记住：**一次定义，处处生效**！
