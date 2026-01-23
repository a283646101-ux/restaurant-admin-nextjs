---
name: "restaurant-admin-expert"
description: "Expert guide for Restaurant Admin System (Next.js 14 + Supabase). Covers Orders, Dishes, Auth, Payment, and Multi-store. Invoke when working on restaurant admin features."
---

# 餐饮后台管理系统专家 (Restaurant Admin System Expert)

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

## Specialized Modules (Trigger with Hashtags)

### #RESTAURANT_ADMIN_SYSTEM
**Description:** 餐饮后台管理系统核心总纲。包含设计哲学、数据同步原则、权限模型与技术架构。这是本 Skill 的基础，默认对所有任务生效。

**餐饮后台管理系统核心心智模型**
这不是一个普通的管理面板，而是**餐厅运营大脑**。最高原则：**极致运营效率、数据绝对可靠、操作零风险、小程序实时联动**。

**核心原则速查：**
- **设计哲学**：服务于忙碌店长，一键决策，数据 Supabase 单源真理。
- **小程序联动**：菜品/订单 3秒内实时同步，版本防冲突。
- **权限控制**：后台(admin)与小程序(customer)严格隔离，RLS 必开。
- **技术架构**：Next.js 14 App Router + Supabase + Tailwind + TypeScript。
- **关键业务**：菜品多规格库存管理、订单严谨状态机、会员等级自动计算。
- **自我检查**：操作是否 < 10秒？小程序是否同步？接口失败是否有 Mock？

### #ADMIN_UI_UX
**Description:** 当任务涉及后台管理系统 UI/UX 设计、页面布局、表格交互、表单优化或运营效率时，加载本 Skill。专为餐饮后台（非用户端）优化。

**餐饮后台 UI/UX 核心心智模型**
后台不是“美观优先”，而是**运营效率第一、减少误操作、快速决策**。管理员每天处理数百订单，界面必须支持高密度信息与批量操作。

**1. 布局哲学：仪表盘优先**
- 首页 Dashboard：关键指标顶置（当日订单数、营收、热销菜 Top5、待处理订单）。
- 左侧固定导航 + 主内容区（支持多 Tab 页签，避免频繁跳转）。
- 全局搜索 + 快捷过滤器永远可见。

**2. 表格交互铁律**
- 数据表格默认分页 + 服务端排序/过滤。
- 支持多选批量操作（下架、改状态、导出）。
- 行内编辑 + 实时保存反馈，复杂编辑才弹 Modal。
- 状态用色块 + 标签（待支付橙、已完成绿、退款红）。

**3. 表单与输入优化**
- 菜品编辑：图片多图上传 + 拖拽排序，价格/库存双字段校验。
- 订单详情：时间线视图展示状态流转。
- 必填项高亮，保存按钮置底固定。

**4. 常见坑回避**
- 避免过多颜色（主色灰白 + 功能 accent）。
- 操作需二次确认（删除、批量下架）。
- 响应式必备（支持平板操作）。

每设计一个页面，问：管理员能否在 10 秒内完成核心操作？

### #ANALYTICS_SECURITY
**Description:** 当任务涉及数据统计、销量报表、用户分析、运营指标或安全审计时，加载本 Skill。

**后台统计与安全心智模型**
统计不是“堆图表”，而是**行动导向洞察 + 隐私合规**。

**1. 核心指标哲学**
- Dashboard：GMV、日订单数、复购率、Top 菜品/分类。
- 时间维度：今日/近7日/自定义范围。
- 图表优先折线 + 柱状，避免复杂 3D。

**2. 报表设计**
- 可导出 CSV/Excel。
- 钻取：点击热销菜跳转详情。
- 预测趋势（简单移动平均即可）。

**3. 安全与审计**
- 操作日志表格：谁在何时改了什么。
- 敏感数据脱敏（手机号、地址）。
- 登录加 2FA（Supabase auth 支持）。

**4. 扩展思维**
- 支持多门店（未来加 store_id 字段）。

每加一个指标，问：这个数据能直接指导运营决策吗？

### #DISH_MANAGEMENT
**Description:** 当任务涉及菜品新增/编辑、上架下架、分类管理、库存预警或热销排序时，加载本 Skill。

**菜品管理心智模型**
菜品是菜单核心，必须**易维护 + 快速迭代 + 数据准确**。

**1. 编辑流程优化**
- 表单：分类下拉 + 多图上传 + 推荐/热销开关。
- 支持批量导入（Excel → Supabase）。
- 修改即时生效，小程序实时刷新。

**2. 库存与状态管理**
- 库存字段实时扣减（订单支付时）。
- 库存低于阈值自动预警（Dashboard 红点）。
- 下架菜品：软删除或隐藏，保留历史订单记录。

**3. 分类与排序**
- 树形分类管理（支持拖拽）。
- 排序字段 + 手动调整，首页优先展示高销量。

**4. 数据一致性**
- 价格修改记录历史版本，订单用下单时快照。

目标：管理员 1 分钟内完成单菜品上新。

### #ERROR_LOGGING_MONITOR
**Description:** 【严格专属触发】只有当用户提示中明确包含 #ERROR_LOGGING_MONITOR 时，才加载本 Skill。否则完全忽略。

**错误处理与监控心智模型**
系统必须**用户友好 + 运营可观测**。

**1. 错误处理哲学**
- 前端统一 catch + 友好 Toast（“网络开小差了，点我重试”）。
- 关键错误（支付失败、下单失败）引导至客服或重试。
- 降级方案：弱网时用本地缓存菜单。

**2. 日志埋点**
- 使用 uni.reportAnalytics 或 Supabase RPC 记录关键事件（加购、下单、支付）。
- 错误日志上传至 Supabase errors 表（含设备、版本、openid）。

**3. 监控与反馈**
- 后台 Dashboard 显示错误率 Top、崩溃统计。
- 用户反馈入口直达后台工单。
- 关键异常自动告警（未来接企业微信）。

**4. 预防思维**
- 所有异步操作加超时 + 重试。
- 灰度发布新功能。

目标：用户感知零崩溃，运营能快速定位问题。

### #MULTI_STORE_SUPPORT
**Description:** 【严格专属触发】只有当用户提示中明确包含 #MULTI_STORE_SUPPORT 时，才加载本 Skill。否则完全忽略。

**多门店架构心智模型**
从单店到多店扩展，必须**数据隔离 + 切换无缝**。

**1. 数据模型设计**
- 核心表加 store_id 字段（dishes、orders、users 可选绑定默认店）。
- stores 表：id, name, address, business_hours, logo。
- 用户默认门店（本地存储 + 可切换）。

**2. 前端切换逻辑**
- 首页顶部门店选择器（下拉或弹层）。
- 切换后刷新菜单 + 清空购物车（提示用户）。
- 订单自动带当前 store_id。

**3. 后台管理**
- 超级管理员可管理所有门店，店长只能看本店数据（RLS 严格限制）。
- 菜品支持“全局 + 门店专属”两种模式。

**4. 一致性与扩展**
- 库存按门店独立扣减。
- 报表支持按门店筛选。

目标：未来开新店只需加一条 store 记录，无需改代码。

### #ORDER_MANAGEMENT
**Description:** 当任务涉及订单列表、详情查看、状态流转、退款处理、批量操作或异常订单时，加载本 Skill。

**订单管理业务心智模型**
订单是后台核心，必须**状态机严谨 + 操作可审计 + 快速定位问题**。

**1. 状态机设计**
- 状态流：待支付 → 已支付 → 制作中 → 已出餐 → 已完成（可分支退款/取消）。
- 每状态变更记录日志 + 通知用户。

**2. 操作效率优先**
- 列表默认过滤“今日 + 未完成”，支持时间/状态/金额多维筛选。
- 批量：确认出餐、打印小票、导出 Excel。
- 详情页：订单物品列表 + 用户信息 + 时间线 + 备注编辑。

**3. 异常处理思维**
- 退款：需理由 + 二次确认，走 Supabase RPC 调用支付退款。
- 纠纷订单高亮 + 标记标签。
- 超时订单自动提醒（可设 cron）。

**4. 运营洞察**
- 订单列表支持导出报表，关联菜品销量。

每添加一个操作，问：这是否降低了管理员处理单量的压力？

### #PAYMENT_INTEGRATION
**Description:** 【严格专属触发】只有当用户提示中明确包含 #PAYMENT_INTEGRATION 时，才加载本 Skill。否则完全忽略。

**支付集成心智模型（点餐系统专属）**
支付是转化闭环，必须**零风险 + 极简流程 + 事务一致性**。

**1. 支付流程哲学**
- 只在订单创建成功后发起支付（先写 Supabase orders，再调用微信支付）。
- 使用微信小程序支付 API（wx.requestPayment），服务端用云函数/RPC 统一下单。
- 支付成功回调必走服务端验证（防篡改）。

**2. 安全铁律**
- 所有金额服务端计算并校验（前端只展示）。
- 订单状态机：paid 只有支付回调成功才更新。
- 支持退款走 RPC（二次确认 + 理由记录）。

**3. 用户体验优化**
- 支付按钮防重点击 + 超时自动查询订单状态。
- 失败页：重试 + 联系客服入口。
- 支持多种支付方式切换（默认微信）。

**4. 后台联动**
- 支付成功实时推送至后台订单列表。
- 对账报表：支付渠道统计 + 失败率监控。

每设计支付相关，问：是否还有单点失败会导致用户钱扣了菜没上？

### #SEARCH_RECOMMENDATION
**Description:** 【严格专属触发】只有当用户提示中明确包含 #SEARCH_RECOMMENDATION 时，才加载本 Skill。否则完全忽略。

**搜索与推荐心智模型**
搜索不是“模糊匹配”，而是**提升下单率 + 个性化**。

**1. 搜索功能哲学**
- 全局搜索支持菜名/分类/标签，实时高亮匹配。
- 无结果时智能推荐相似或热销菜。
- 支持语音搜索（微信原生）。

**2. 推荐策略**
- 首页：热销 Top + 猜你喜欢（基于历史订单简单规则）。
- 菜品详情：相关推荐（同分类高销）。
- 未来可接 Supabase Edge Function 做简单协同过滤。

**3. 性能优化**
- 搜索用 Supabase full-text search 或 RPC。
- 推荐数据预计算缓存（每日更新）。

**4. 运营控制**
- 后台可手动置顶推荐位。
- A/B 测试支持（不同用户看到不同推荐）。

目标：搜索命中率 > 80%，推荐点击转化 > 20%。

### #SUPABASE_ADMIN_BEST
**Description:** 当任务涉及后台对 Supabase 的写操作、RLS 高级策略、RPC 函数设计、Storage 管理或权限控制时，加载本 Skill。

**Supabase 后台管理心智模型**
后台是“特权端”，但必须**零信任 + 操作可审计**，所有高危操作走 RPC，避免前端直接写。

**1. 权限分层哲学**
- RLS 策略：admin 角色绕过部分限制（用 custom claim 或 admin 表标记）。
- 关键表（dishes、orders）写操作只允许 admin。
- 审计日志：所有修改记录到 audit_log 表（who、what、when）。

**2. RPC 函数优先**
- 复杂操作封装 RPC（如 batch_update_dishes、process_refund）。
- 原子事务：库存扣减 + 订单状态变更在单一函数内。
- 输入严格校验，失败返回明确 error code。

**3. Storage 与媒体管理**
- 菜品图片上传到专用 bucket，public read + admin write。
- 自动生成 thumbnail，删除菜品时级联删图片。

**4. 实时与一致性**
- 管理员操作后触发 realtime broadcast，小程序端即时刷新。
- 缓存失效机制（改菜品后 invalidate menu cache）。

目标：后台操作安全可溯源，与小程序数据永一致。

### #USER_AUTH_MANAGEMENT
**Description:** 【严格专属触发】只有当用户提示中明确包含 #USER_AUTH_MANAGEMENT 时，才加载本 Skill。否则完全忽略。

**用户认证与权限心智模型**
用户体系必须**微信原生 + 隐私最小化 + 角色清晰**。

**1. 登录流程哲学**
- 微信一键登录（uni.login + wx.getUserInfo → Supabase auth.signInWithOAuth 或自定义 JWT）。
- 未登录允许浏览/加购，支付/下单强制登录。
- openid 作为唯一标识，关联 Supabase users 表。

**2. 权限角色设计**
- 角色：customer（默认）、admin（后台专用）、staff（可选门店员工）。
- Supabase RLS + custom claims 实现角色判断。
- 后台登录加额外验证（手机号/密码或邀请码）。

**3. 隐私与数据管理**
- 只收集必要信息（openid、昵称、头像、收餐地址）。
- 地址支持多次保存 + 默认选择。
- 符合 GDPR/中国个保法：可查看/删除个人数据入口。

**4. 体验优化**
- 静默登录 + 授权弹窗最小化。
- 登出后购物车本地保留，重新登录自动合并。

目标：登录摩擦 < 3秒，权限零越界。
