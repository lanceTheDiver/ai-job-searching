# Git 提交与推送规范

本项目遵循 [Conventional Commits 1.0.0](https://www.conventionalcommits.org/zh-hans/v1.0.0/) 规范。所有新提交都必须使用统一、可读、可自动解析的提交信息。

## 提交信息格式

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

- `type` 必填，使用下方允许的英文小写类型。
- `scope` 可选，使用英文小写名词描述主要影响范围。
- `description` 必填，默认使用简洁英文祈使句，不加句号，不超过 72 个字符。
- 简单提交只写标题；只有需要解释原因、实现取舍或迁移方式时才添加正文。
- 正文与 footer 必须分别与上一部分空一行。

## 允许的 type

| type       | 使用场景                         | 示例                                      |
| ---------- | -------------------------------- | ----------------------------------------- |
| `feat`     | 新增用户可感知的功能             | `feat(jobs): add structured job analysis` |
| `fix`      | 修复错误或不正确行为             | `fix(api): handle invalid model output`   |
| `docs`     | 只修改文档或规范                 | `docs(git): add commit workflow`          |
| `style`    | 只调整格式，不改变行为           | `style(ui): format analyzer components`   |
| `refactor` | 重构代码但不新增功能、不修复缺陷 | `refactor(ai): isolate response parsing`  |
| `perf`     | 性能优化                         | `perf(ui): reduce client bundle size`     |
| `test`     | 新增或修改测试                   | `test(schema): cover invalid job input`   |
| `build`    | 构建系统或生产依赖变化           | `build(deps): upgrade Next.js`            |
| `ci`       | CI/CD 配置与脚本                 | `ci(github): add typecheck workflow`      |
| `chore`    | 其他维护任务                     | `chore(repo): update ignore rules`        |
| `revert`   | 撤销先前提交                     | `revert: remove automatic job import`     |

`feat` 对应语义化版本的 MINOR，`fix` 对应 PATCH；任何带破坏性变更标记的提交对应 MAJOR。

## 推荐的 scope

优先从下列范围中选择；确有必要时可以增加新的、语义明确的英文小写 scope。

- `jobs`：职位分析、职位数据和投递逻辑
- `resume`：简历内容、版本和优化逻辑
- `ai`：模型调用、Prompt、Structured Outputs
- `api`：Route Handler 和接口行为
- `schema`：Zod Schema 和共享类型
- `ui`：跨页面组件、样式和交互
- `deps`：依赖和锁文件
- `config`：项目配置、环境变量模板
- `git`：提交、分支和仓库工作流
- `docs`：项目文档

如果一次提交影响多个范围，选择最主要的一个；若改动彼此独立，应拆分为多个原子提交。

## 破坏性变更

破坏性变更必须在 type/scope 后添加 `!`，并在 footer 中说明迁移影响：

```text
feat(api)!: change job analysis response shape

BREAKING CHANGE: clients must read the analysis from the data field.
```

`BREAKING CHANGE` 必须保持英文大写。

## 自动提交触发规则

当用户要求提交时，按用户使用的措辞确定授权范围：

- “生成 commit 内容”或“生成提交信息”：只分析差异并返回建议的提交信息，不执行 `git add`、`git commit` 或 `git push`。
- “提交”或“commit”：生成符合本规范的提交信息，并执行暂存和 `git commit`；不得自动 push。
- “提交并推送”“commit and push”或明确同时要求 push：完成提交后推送当前分支。
- 用户只说“push”：只推送当前已有提交，不得把未提交改动自动加入新提交。

不得把普通“提交”解释为“提交并推送”。`git push` 会修改远端状态，必须由用户在当前请求中明确授权。

## 自动提交工作流

收到提交请求后，必须依次执行：

1. 读取本文件，并检查 `git status --short`、完整 diff、已暂存 diff、当前分支和最近提交。
2. 区分本次任务改动、用户已有改动和无关文件；不得覆盖、撤销或夹带无关改动。
3. 检查敏感信息，包括 `.env*`、API key、token、凭据、私钥和个人数据；发现风险时停止提交并报告。
4. 判断改动是否应拆分为多个原子提交；可以安全拆分时按逻辑范围分别提交，无法判断时先询问用户。
5. 按改动风险运行必要检查，默认至少执行 `pnpm format:check`、`pnpm lint` 和 `pnpm tsc --noEmit`。纯文档修改可以只运行相关格式检查。
6. 根据实际 diff 自动选择 type、scope 和 description，不根据聊天中的预期或未落地内容编写提交信息。
7. 使用明确文件路径进行暂存，优先 `git add <path...>`；除非已确认所有未提交内容都属于本次提交，否则不得使用 `git add .` 或 `git add -A`。
8. 执行提交后检查 `git status --short` 和最新提交，确认提交内容与预期一致。
9. 只有用户明确要求推送时，才执行推送流程。

## 自动推送工作流

用户明确要求提交并推送时：

1. 确认当前分支名、远端仓库和 upstream 状态。
2. 已配置 upstream 时执行 `git push`。
3. 未配置 upstream、但 `origin` 和当前分支明确时，执行 `git push -u origin <current-branch>`。
4. 推送后报告远端、分支和提交 SHA。

以下操作即使在推送请求中也不得自动执行，除非用户逐项明确要求：

- `git push --force` 或 `git push --force-with-lease`
- 修改远端 URL
- 删除远端分支或 tag
- 绕过分支保护
- `git commit --amend`、rebase 或改写历史

如果远端拒绝推送，不得通过 force push 绕过；应报告拒绝原因并等待用户决定。

## 提交前阻断条件

出现以下任一情况时停止自动提交或推送：

- 检查失败，且失败与本次改动相关
- diff 中存在疑似密钥、凭据或不应提交的 `.env.local`
- 工作树包含无法安全归属的混合改动
- 当前处于 detached HEAD、merge/rebase 冲突或其他不稳定 Git 状态
- 提交结果为空
- 推送目标不明确或当前分支没有合适的远端

停止后必须说明具体阻断原因、已完成的步骤和用户可以选择的下一步。

## 示例

```text
feat(ui): redesign job analysis workspace
```

```text
fix(ai): validate structured model output with Zod
```

```text
docs(git): document conventional commit workflow
```

```text
build(deps): add Prettier formatting commands
```
