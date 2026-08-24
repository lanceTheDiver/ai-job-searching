# 前端开发规范

## 技术栈

- **React** - 使用函数式组件
- **TypeScript** - 所有代码必须使用 TypeScript
- **Next.js** - 基于 Next.js 框架开发
- **Tailwind CSS** - 优先使用 Tailwind CSS 实用类进行样式设计
- **shadcn/ui** - UI 组件库

## 组件规范

**优先使用函数式组件**，遵循以下原则：

- 使用 **React Hooks** 管理状态和副作用
- 使用 **组合（Composition）** 而非继承
- 创建 **可复用组件**，提高代码复用性
- **避免大型组件**：单个组件不应超过 300 行代码
- 使用语义化的 HTML 标签

## 状态管理

- **优先使用本地状态**：使用 `useState`、`useReducer` 等 hooks
- **全局状态使用 Zustand**：仅在需要跨组件共享状态时使用
- 避免过度使用全局状态

## API 调用规范

**后端 API 端点**：

- 使用 **Next.js API Routes** 创建后端接口
- 位置：`app/api/` 目录
- 用途：服务器端逻辑、数据库操作、第三方 API 调用等

**前端 API 调用**：

- **所有前端 API 请求必须封装在 `lib/services/` 目录中**
- **禁止在 UI 组件中直接调用 `fetch`**
- 用途：封装对 API Routes 或外部 API 的调用
- 使用统一的 API 服务层进行请求管理
- 分离业务逻辑和 UI 逻辑

示例结构：

```
app/api/posts/route.ts        ← 后端 API 端点
lib/services/postService.ts   ← 前端调用该 API 的服务层
components/PostList.tsx        ← UI 组件使用 postService
```

## 样式规范

- 优先使用 Tailwind CSS 的实用类
- 保持组件样式简洁
- 遵循项目的设计系统

## 代码格式化

- **每次创建文件后必须运行 Prettier 格式化**
- 确保代码风格一致性
- 使用项目配置的 Prettier 规则
