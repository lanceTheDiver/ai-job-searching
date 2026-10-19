# React 开发技巧

实现 React 功能时的最佳实践和注意事项。

## 开发原则

### 1. 识别组件边界

在实现功能之前：

- 分析 UI 结构，划分合理的组件边界
- 每个组件应该有单一职责
- 考虑组件的复用性
- 避免过度拆分或过度耦合

**示例**：

```tsx
// ✅ 好的组件边界
<UserProfile>
  <UserAvatar />
  <UserInfo />
  <UserActions />
</UserProfile>

// ❌ 避免：一个组件做太多事情
<UserEverything />
```

### 2. 优先使用组合（Composition）

- 使用组合而非继承
- 通过 props.children 和组合模式构建灵活的组件
- 利用 Context 传递深层数据（但不要滥用）

**示例**：

```tsx
// ✅ 使用组合
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>内容</CardContent>
</Card>;

// ❌ 避免：通过继承扩展
class ExtendedCard extends Card {}
```

### 3. 提取可复用的 Hooks

将复杂的逻辑提取为自定义 hooks：

- 封装可复用的状态逻辑
- 保持组件简洁
- 便于测试和维护
- 遵循 hooks 命名规范（use 开头）

**示例**：

```tsx
// ✅ 提取自定义 hook
function useUserData(userId: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return { user, loading };
}

// 在组件中使用
function UserProfile({ userId }) {
  const { user, loading } = useUserData(userId);
  // ...
}
```

### 4. 避免不必要的全局状态

- **优先使用本地状态**：组件内部用 useState
- **Props 传递**：父子组件间直接传递
- **Context**：跨层级但范围有限的共享
- **Zustand**：真正需要全局共享的状态

**决策树**：

```
需要状态?
├─ 只在一个组件内? → useState
├─ 父子组件间? → props
├─ 跨几层但范围有限? → Context
└─ 整个应用都需要? → Zustand
```

### 5. 避免不必要的 useEffect

很多情况下不需要 useEffect：

- 数据转换可以在渲染时计算
- 事件处理应该在事件处理器中
- 不要用 useEffect 同步两个状态

**示例**：

```tsx
// ❌ 不必要的 useEffect
const [count, setCount] = useState(0);
const [doubled, setDoubled] = useState(0);

useEffect(() => {
  setDoubled(count * 2);
}, [count]);

// ✅ 直接计算
const [count, setCount] = useState(0);
const doubled = count * 2;
```

**何时使用 useEffect**：

- 与外部系统同步（API 调用、订阅）
- 操作 DOM
- 设置定时器
- 副作用逻辑

### 6. 仅在必要时使用记忆化（Memoization）

不要过早优化：

- **useMemo**：昂贵的计算
- **useCallback**：传递给优化过的子组件的回调
- **React.memo**：避免不必要的重渲染

**示例**：

```tsx
// ❌ 不必要的 useMemo
const fullName = useMemo(
  () => firstName + " " + lastName,
  [firstName, lastName],
);

// ✅ 直接计算（字符串拼接很快）
const fullName = firstName + " " + lastName;

// ✅ 必要的 useMemo（复杂计算）
const sortedAndFiltered = useMemo(
  () =>
    data
      .filter((item) => item.active)
      .sort((a, b) => a.name.localeCompare(b.name)),
  [data],
);
```

## 实践检查清单

实现 React 功能时，检查以下几点：

- [ ] 组件边界清晰，职责单一
- [ ] 使用组合模式而非继承
- [ ] 复杂逻辑提取为自定义 hooks
- [ ] 状态放在合适的位置（本地 > props > Context > 全局）
- [ ] useEffect 仅用于副作用
- [ ] 仅在性能瓶颈时使用记忆化
- [ ] 组件不超过 300 行
- [ ] 类型定义清晰完整

## 常见陷阱

### ❌ 在 useEffect 中设置状态导致循环

```tsx
useEffect(() => {
  setData(processData(data)); // ❌ 无限循环
}, [data]);
```

### ❌ 过度使用 Context

```tsx
// ❌ 小范围的数据不需要 Context
<ThemeContext.Provider>
  <UserContext.Provider>
    <DataContext.Provider>
      <App />
```

### ❌ 忘记清理副作用

```tsx
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  // ❌ 忘记清理
}, []);

// ✅ 正确清理
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);
```

### ❌ 在循环中使用 hooks

```tsx
// ❌ 错误
items.map((item) => {
  const [state] = useState(); // hooks 不能在循环中
});

// ✅ 正确：为每个 item 创建组件
items.map((item) => <ItemComponent key={item.id} item={item} />);
```

## 参考资源

- [React 官方文档](https://react.dev/)
- [Hooks 规则](https://react.dev/reference/rules)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
