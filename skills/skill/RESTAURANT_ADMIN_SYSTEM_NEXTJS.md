# Description: 
当任务涉及餐饮后台管理系统（RestaurantAdmin）的架构设计、页面开发、业务逻辑实现、数据操作、权限控制或与小程序联动时，加载本 Skill。适用于 Next.js 14 App Router + React 18 + TypeScript + Supabase 项目。

# 餐饮后台管理系统核心心智模型

这不是一个普通的管理面板，而是**餐厅运营大脑** —— 店长每天在这里监控营收、处理订单、调整菜单。最高原则：**极致运营效率、数据绝对可靠、操作零风险、小程序实时联动**。

### 🎯 设计哲学
- 后台服务于“忙碌的餐厅管理者”，优先解决痛点：快速定位问题、批量处理、一键决策。
- 每一次交互都要节省时间：少跳转、少加载、少确认。
- 数据以 Supabase 为单源真理，所有修改必须即时同步到小程序端。
- 视觉风格：专业现代，主色蓝（#409EFF），Tailwind 驱动的干净布局，大圆角、Lucide 图标、暖色点缀（继承小程序暖红作为 accent）。

### 🔗 与小程序数据共享原则
- **单源真理**：Supabase PostgreSQL 是唯一权威，所有读写均通过它
- **实时同步**：菜品上/下架、库存变更、新订单，必须 3 秒内小程序可见（Supabase Realtime 订阅）
- **版本防冲突**：关键表必带 updated_at + 乐观锁，防止多人同时编辑
- **事务保障**：库存扣减、订单完成、积分计算等操作使用 Supabase RPC 或事务

### 🔐 权限控制思维
- 后台角色严格隔离：admin（后台） vs customer（小程序）
- 所有页面/API 必须 JWT 鉴权 + admin 角色校验
- Supabase RLS 必开：admin 可写 dishes/orders/users，普通用户只读
- Next.js Middleware 做路由守卫，动态隐藏无权菜单
- 每项关键操作记录审计日志（who、when、what）

### ⚡ 实时同步策略
- Supabase Realtime 订阅 dishes、orders、coupons 变化
- 管理员修改菜品 → broadcast → 小程序 watch 刷新菜单/库存
- 新订单 → 后台列表实时 push + 声音/红点提醒
- 库存低于阈值 → Dashboard 实时预警

### 🛠 技术架构要点
- **Next.js 14 App Router**：优先 Server Components（数据获取）、Client Components 只用于交互
- **React 18 + TypeScript**：全 TS，接口严格定义（zod 校验可选）
- **Tailwind CSS**：utility-first，响应式布局（desktop 优先，适配 1366+）
- **Recharts**：图表统一封装 <ChartWrapper>，支持 responsive + tooltip
- **Lucide React**：统一图标风格，语义化命名
- **API 层**：Next.js Server Actions 或 Route Handlers，所有请求服务端执行（避免暴露 Supabase key）
- **Supabase Client**：仅在 Server Components / Actions 使用 auth + RLS
- **Mock 降级**：开发时 API 失败自动 fallback 本地 mock（保持页面可预览）

### 📋 关键业务规则
#### 菜品管理（含份量规格）🔥
- 每道菜支持多 specs（large/medium/small），独立 price/stock/nutrition
- 上架条件：至少一个 spec stock > 0 且 status = 'on_sale'
- 更新库存：单独修改 specs[].stock → 自动 recalculate 总 stock
- 库存为 0 的 spec 自动禁用，小程序实时不可选
- 每次编辑菜品，问：小程序用户现在还能正常点这道菜吗？

#### 订单管理
- 状态机：pending → paid → preparing → completed / cancelled
- 状态变更必须合法（不可逆转关键状态）
- 完成订单 → 自动累加用户积分 + 重新计算会员等级 + 更新菜品销量
- 堂食显示 tableNumber，外卖显示地址 + 预计时间
- 每次更新状态，问：用户小程序订单页是否已同步？

#### 会员等级计算
- 基于 totalSpent 自动升级：0-999 bronze → 1000-4999 silver → 5000-9999 gold → 10000+ diamond
- 手动调整积分必须填写 reason → 记录日志
- 等级变更后自动刷新可用优惠券

#### 优惠券发放
- 支持模板创建 + 批量发放（按等级 / 全部 / 指定用户）
- 发放后立即写入用户券表，小程序实时可见
- 使用统计实时计算领取率、使用率、ROI

### ⚡ 性能优化指南
- **列表分页**：Server Components + infinite scroll 或 pagination（每页 20-50）
- **搜索/筛选**：debounce 300ms，服务端过滤
- **图片**：Supabase Storage signed URL + next/image lazy loading
- **图表**：Recharts 只在客户端 hydrate，数据服务端预取
- **缓存**：Next.js revalidatePath / revalidateTag，低频数据 stale-while-revalidate
- **Skeleton**：加载状态必用 UI skeleton
- 每次渲染大列表，问：首屏是否 < 2s？是否服务端渲染？

### 💻 代码规范
- **页面结构**：app/admin/.../page.tsx（Server），交互组件 'use client'
- **组件拆分**：通用 Table、Form、ChartWrapper、Modal 抽到 components/
- **命名**：PascalCase 组件，kebab-case 文件夹，语义化变量（dishSpecs）
- **Server Actions**：统一 actions/ 目录，所有 mutate 操作放这里
- **错误处理**：try/catch + toast（sonner 或 custom），返回 user-friendly message
- **日志**：关键操作 server-side log 到 Supabase audit_log
- **Toast**：成功绿、警告橙、错误红，统一 ui/toast

### ✅ 关键检验问题（自我检查清单）
每次完成页面/功能，必问：
1. 店长能否在 10 秒内完成核心操作（如处理一笔订单）？
2. 修改数据后小程序是否 3 秒内同步？
3. 接口失败时是否有 Mock 降级 + 友好提示？
4. 是否记录了操作日志和审计轨迹？
5. 列表超过 100 条时是否流畅（分页 + SSR）？
6. 弱网场景下页面是否仍可查看？

### ⚠️ 常见陷阱（务必避免）
- 在 Client Component 直接用 Supabase client（暴露 key）→ 用 Server Actions 替代
- 前端计算金额/库存 → 所有关键计算服务端验证
- 无分页直接查询全表 → 性能崩塌
- 修改菜品后未 invalidate cache → 小程序显示旧数据
- 操作无二次确认 → 误删热销菜或批量错误
- Recharts 未处理 empty data → 图表崩溃
- Mock 数据结构与真实不一致 → 上线样式错乱
- 忽略 TypeScript 类型 → 运行时错误频发

遵循本 Skill，你的 RestaurantAdmin 将成为一个**高效、现代、安全**的餐厅运营中枢，与小程序完美联动，让管理者决策更快、更准、更安心。

每次开发新功能，先问：“这是否真正减轻了店长的日常负担？”