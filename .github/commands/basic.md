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

### 构建生产版本
```bash
pnpm build
```
- 构建生产环境的优化版本
- 生成静态文件和服务端代码
- 构建产物位于 `.next` 目录

### 启动生产服务器
```bash
pnpm start
```
- 启动生产环境服务器
- 需要先运行 `pnpm build`
- 用于本地测试生产版本

## 代码质量

### 运行 ESLint 检查
```bash
pnpm lint
```
- 检查代码风格问题
- 自动修复可修复的问题
- 遵循 Next.js 和项目的 ESLint 配置

### 格式化代码（Prettier）
```bash
pnpm format
```
或使用 VS Code 的自动格式化功能（推荐）

**重要**：每次创建新文件后必须格式化代码

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
# 1. 运行 lint 检查
pnpm lint

# 2. 运行类型检查（可选）
pnpm tsc --noEmit

# 3. 格式化代码
# 使用 VS Code 自动格式化或手动运行 Prettier
```

### 部署前
```bash
# 1. 构建生产版本
pnpm build

# 2. 本地测试生产版本
pnpm start
```

## 注意事项

- ⚠️ 本项目使用 **pnpm**，不要使用 npm 或 yarn
- ✅ 优先使用 `pnpm` 而非 `npm`
- ✅ 提交代码前务必运行 `pnpm lint`
- ✅ 创建新文件后记得格式化代码
