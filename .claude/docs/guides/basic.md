# 基础命令参考

本项目使用 **pnpm** 作为包管理器。

## 开发命令

### 启动开发服务器

```bash
pnpm dev
```

- 启动 Next.js 开发服务器
- 支持热重载
- 默认运行在 http://localhost:3000

## 代码质量

### 运行 ESLint 检查

```bash
pnpm lint
```

- 检查代码风格问题（只检查，不自动修复）
- 遵循 Next.js 和项目的 ESLint 配置

### 格式化代码（Prettier）

```bash
pnpm format         # 格式化全部文件
pnpm format:check   # 只校验，不修改
```

**重要**：每次创建新文件后必须运行 `pnpm format`

## 依赖管理

### 安装依赖

```bash
pnpm install
```

### 添加新依赖

```bash
# 生产依赖
pnpm add <package-name>

# 开发依赖
pnpm add -D <package-name>
```

### 更新依赖

```bash
# 更新所有依赖到最新版本
pnpm update

# 更新特定包
pnpm update <package-name>
```

## TypeScript

### 类型检查

```bash
pnpm tsc --noEmit
```

- 检查 TypeScript 类型错误
- 不生成输出文件

## 常见工作流

### 开始开发

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器
pnpm dev
```

### 提交代码前

```bash
# 1. 格式校验
pnpm format:check

# 2. lint 检查
pnpm lint

# 3. 类型检查
pnpm tsc --noEmit
```

## 注意事项

- ⚠️ 本项目使用 **pnpm**，不要使用 npm 或 yarn
- ✅ 优先使用 `pnpm` 而非 `npm`
- ✅ 提交代码前务必运行 `pnpm format:check`、`pnpm lint` 和 `pnpm tsc --noEmit`
- ✅ 创建新文件后运行 `pnpm format`
