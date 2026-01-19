# Next.js 后端完整实现提示词

> 将此提示词复制到其他 AI 工具（如 Cursor、Claude、ChatGPT）中，一次性生成完整的 Next.js 后端代码

---

## 项目概述

创建一个 Next.js 14 (App Router) 后端 API 系统，作为微信小程序和 Supabase 数据库之间的中间层。

**项目名称**: restaurant-admin-nextjs  
**技术栈**: Next.js 14, TypeScript, Supabase, JWT认证  
**部署平台**: Vercel  
**GitHub**: https://github.com/a283646101-ux/restaurant-admin-nextjs.git

---

## 核心需求

### 1. 架构设计

```
微信小程序 → Next.js API (Vercel) → Supabase 数据库
```

- 小程序通过 JWT token 认证
- 所有数据操作通过 Next.js API 中转
- 支持 CORS 跨域请求
- 统一错误处理和响应格式

### 2. 认证系统

**微信登录流程**:
1. 小程序调用 `wx.login()` 获取 code
2. 发送 code 到 `/api/auth/login`
3. 后端调用微信 API 换取 openid
4. 查询或创建用户
5. 生成 JWT token 返回

**JWT 配置**:
- 有效期: 7天
- 包含字段: userId, openid
- 所有需要认证的接口验证 token

### 3. 数据库结构 (Supabase)

#### users 表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  openid TEXT UNIQUE NOT NULL,
  nickname TEXT DEFAULT '新用户',
  avatar TEXT DEFAULT '',
  phone TEXT,
  points INTEGER DEFAULT 0,
  member_level TEXT DEFAULT 'bronze',
  birthday TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_time TIMESTAMP DEFAULT NOW()
);
```

#### dishes 表
```sql
CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'main', 'drink', 'combo'
  price DECIMAL(10,2) NOT NULL,
  image TEXT,
  description TEXT,
  spicy BOOLEAN DEFAULT false,
  healthy BOOLEAN DEFAULT false,
  nutrition JSONB, -- {calories, protein, carbs, fat}
  specs JSONB, -- [{size, name, price, stock, nutrition}]
  sales INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'on_sale', -- 'on_sale', 'off_sale'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### orders 表
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  user_nickname TEXT,
  items JSONB NOT NULL, -- [{dishId, name, price, quantity, portionSize, portionName}]
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  order_type TEXT NOT NULL, -- 'delivery', 'pickup'
  order_mode TEXT, -- 'dine_in', 'delivery'
  table_number TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'completed', 'cancelled'
  address JSONB, -- {name, phone, detail}
  queue_number INTEGER,
  coupon_id TEXT,
  points_earned INTEGER DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### coupons 表
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'discount', 'percent', 'free_delivery', 'birthday'
  value DECIMAL(10,2) NOT NULL,
  min_amount DECIMAL(10,2) DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'inactive'
  expire_time DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### user_coupons 表
```sql
CREATE TABLE user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  coupon_id UUID REFERENCES coupons(id),
  status TEXT DEFAULT 'unused', -- 'unused', 'used', 'expired'
  source TEXT, -- '注册赠送', '分享奖励', '生日礼包'
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### reviews 表
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID REFERENCES dishes(id),
  user_id UUID REFERENCES users(id),
  user_nickname TEXT,
  user_avatar TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  images JSONB, -- [url1, url2, ...]
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### feedback 表
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  nickname TEXT,
  type TEXT NOT NULL, -- 'suggestion', 'complaint', 'praise', 'other'
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  likes INTEGER DEFAULT 0,
  reply TEXT,
  reply_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### group_activities 表
```sql
CREATE TABLE group_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID REFERENCES dishes(id),
  dish_name TEXT NOT NULL,
  dish_image TEXT,
  original_price DECIMAL(10,2) NOT NULL,
  group_price DECIMAL(10,2) NOT NULL,
  group_size INTEGER NOT NULL CHECK (group_size >= 2 AND group_size <= 10),
  max_groups INTEGER DEFAULT 50,
  max_per_user INTEGER DEFAULT 2,
  current_groups INTEGER DEFAULT 0,
  success_groups INTEGER DEFAULT 0,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active', -- 'upcoming', 'active', 'ended'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### group_orders 表
```sql
CREATE TABLE group_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id TEXT UNIQUE NOT NULL,
  activity_id UUID REFERENCES group_activities(id),
  leader_id UUID REFERENCES users(id),
  leader_nickname TEXT,
  leader_avatar TEXT,
  members JSONB NOT NULL, -- [{userId, nickname, avatar, joinTime, payStatus}]
  required_size INTEGER NOT NULL,
  current_size INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed', 'expired'
  expire_time TIMESTAMP NOT NULL,
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### share_records 表
```sql
CREATE TABLE share_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  share_type TEXT NOT NULL, -- 'menu', 'dish', 'group', 'order', 'invite'
  target_id TEXT,
  platform TEXT NOT NULL, -- 'wechat', 'moments', 'copy'
  coupon_issued BOOLEAN DEFAULT false,
  coupon_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### addresses 表
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT,
  city TEXT,
  district TEXT,
  detail TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. API 路由设计

#### 认证相关 `/api/auth`

**POST /api/auth/login**
- 输入: `{ code: string }`
- 输出: `{ token: string, userInfo: object, expiresIn: number }`
- 功能: 微信登录，换取 JWT token
- 公开接口，无需认证

#### 用户相关 `/api/users`

**GET /api/users**
- 查询参数: `openid` (可选)
- 输出: 用户信息或用户列表
- 需要认证

**POST /api/users**
- 输入: 用户信息对象
- 输出: 创建或更新的用户信息
- 功能: 创建或更新用户
- 需要认证

**PATCH /api/users/:id**
- 输入: 部分用户信息
- 输出: 更新后的用户信息
- 功能: 更新用户信息
- 需要认证

#### 菜品相关 `/api/dishes`

**GET /api/dishes**
- 查询参数: `category`, `status`, `limit`, `offset`
- 输出: 菜品列表
- 公开接口

**GET /api/dishes/:id**
- 输出: 菜品详情
- 公开接口

**POST /api/dishes** (管理员)
- 输入: 菜品信息
- 输出: 创建的菜品
- 需要管理员权限

**PATCH /api/dishes/:id** (管理员)
- 输入: 部分菜品信息
- 输出: 更新后的菜品
- 需要管理员权限

**DELETE /api/dishes/:id** (管理员)
- 输出: 删除结果
- 需要管理员权限

#### 订单相关 `/api/orders`

**GET /api/orders**
- 查询参数: `userId`, `status`, `orderType`, `startDate`, `endDate`
- 输出: 订单列表
- 需要认证

**GET /api/orders/:id**
- 输出: 订单详情
- 需要认证

**POST /api/orders**
- 输入: 订单信息
- 输出: 创建的订单
- 功能: 创建订单，扣减库存，计算积分
- 需要认证

**PATCH /api/orders/:id**
- 输入: `{ status: string }`
- 输出: 更新后的订单
- 功能: 更新订单状态
- 需要认证

#### 优惠券相关 `/api/coupons`

**GET /api/coupons**
- 查询参数: `userId`, `status`
- 输出: 用户优惠券列表
- 需要认证

**POST /api/coupons/issue**
- 输入: `{ userId: string, couponId: string, source: string }`
- 输出: 发放的优惠券
- 功能: 给用户发放优惠券
- 需要认证

**POST /api/coupons/use**
- 输入: `{ userCouponId: string, orderId: string }`
- 输出: 使用结果
- 功能: 使用优惠券
- 需要认证

#### 评论相关 `/api/reviews`

**GET /api/reviews**
- 查询参数: `dishId`, `limit`, `offset`
- 输出: 评论列表
- 公开接口

**POST /api/reviews**
- 输入: 评论信息
- 输出: 创建的评论
- 需要认证

**POST /api/reviews/:id/helpful**
- 输出: 更新后的点赞数
- 功能: 点赞评论
- 需要认证

#### 反馈相关 `/api/feedback`

**GET /api/feedback**
- 查询参数: `type`, `isPublic`
- 输出: 反馈列表
- 公开接口（仅公开反馈）

**POST /api/feedback**
- 输入: 反馈信息
- 输出: 创建的反馈
- 需要认证

**POST /api/feedback/:id/like**
- 输出: 更新后的点赞数
- 功能: 点赞反馈
- 需要认证

**POST /api/feedback/:id/reply** (管理员)
- 输入: `{ reply: string }`
- 输出: 更新后的反馈
- 功能: 官方回复
- 需要管理员权限

#### 拼团相关 `/api/group-activities` 和 `/api/group-orders`

**GET /api/group-activities**
- 查询参数: `status`
- 输出: 拼团活动列表
- 公开接口

**GET /api/group-activities/:id**
- 输出: 拼团活动详情
- 公开接口

**GET /api/group-orders**
- 查询参数: `userId`, `activityId`, `status`
- 输出: 拼团订单列表
- 需要认证

**GET /api/group-orders/:id**
- 输出: 拼团订单详情
- 公开接口

**POST /api/group-orders**
- 输入: 拼团订单信息
- 输出: 创建的拼团订单
- 功能: 创建拼团（开团）
- 需要认证

**POST /api/group-orders/:id/join**
- 输入: 成员信息
- 输出: 更新后的拼团订单
- 功能: 加入拼团
- 需要认证

#### 分享相关 `/api/share`

**POST /api/share**
- 输入: 分享记录信息
- 输出: 创建的分享记录
- 功能: 记录分享，发放奖励
- 需要认证

**GET /api/share/stats**
- 查询参数: `userId`
- 输出: 分享统计数据
- 需要认证

#### 地址相关 `/api/addresses`

**GET /api/addresses**
- 查询参数: `userId`
- 输出: 地址列表
- 需要认证

**POST /api/addresses**
- 输入: 地址信息
- 输出: 创建的地址
- 需要认证

**PATCH /api/addresses/:id**
- 输入: 部分地址信息
- 输出: 更新后的地址
- 需要认证

**DELETE /api/addresses/:id**
- 输出: 删除结果
- 需要认证

#### 数据分析相关 `/api/analytics` (管理员)

**GET /api/analytics/dashboard**
- 输出: 仪表盘统计数据
- 需要管理员权限

**GET /api/analytics/revenue**
- 查询参数: `startDate`, `endDate`, `groupBy`
- 输出: 营收数据
- 需要管理员权限

**GET /api/analytics/dishes**
- 查询参数: `sortBy`, `limit`
- 输出: 菜品销售统计
- 需要管理员权限

**GET /api/analytics/members**
- 输出: 会员统计数据
- 需要管理员权限

### 5. 环境变量配置

```env
# 微信小程序配置
WECHAT_APPID=你的小程序AppID
WECHAT_SECRET=你的小程序AppSecret

# JWT 配置
JWT_SECRET=随机生成的32位密钥
JWT_EXPIRES_IN=7d

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://dmjhyvnlujczxcadahai.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtamh5dm5sdWpjenhjYWRhaGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MzIwMjYsImV4cCI6MjA4NDMwODAyNn0.Qtfy__Azf3sihH1msumyByP2nYEWbC1PAA6Av3yUhtU

# CORS 配置
ALLOWED_ORIGINS=*

# 管理员配置 (可选)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 6. 项目结构要求

```
restaurant-admin-nextjs/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── route.ts
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── dishes/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── orders/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── coupons/
│   │   │   ├── route.ts
│   │   │   ├── issue/
│   │   │   │   └── route.ts
│   │   │   └── use/
│   │   │       └── route.ts
│   │   ├── reviews/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── helpful/
│   │   │           └── route.ts
│   │   ├── feedback/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── like/
│   │   │       │   └── route.ts
│   │   │       └── reply/
│   │   │           └── route.ts
│   │   ├── group-activities/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── group-orders/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── join/
│   │   │           └── route.ts
│   │   ├── share/
│   │   │   ├── route.ts
│   │   │   └── stats/
│   │   │       └── route.ts
│   │   ├── addresses/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── analytics/
│   │       ├── dashboard/
│   │       │   └── route.ts
│   │       ├── revenue/
│   │       │   └── route.ts
│   │       ├── dishes/
│   │       │   └── route.ts
│   │       └── members/
│   │           └── route.ts
│   └── layout.tsx
├── lib/
│   ├── auth.ts          # JWT 认证中间件
│   ├── supabase.ts      # Supabase 客户端
│   ├── wechat.ts        # 微信 API 调用
│   └── utils.ts         # 工具函数
├── middleware.ts        # CORS 中间件
├── types/
│   └── index.ts         # TypeScript 类型定义
├── .env.local
├── .env.example
├── package.json
├── tsconfig.json
└── next.config.js
```

### 7. 代码规范要求

#### TypeScript 类型定义
- 所有 API 路由使用 TypeScript
- 定义完整的类型接口
- 使用 Zod 进行请求验证

#### 错误处理
- 统一错误响应格式
- 详细的错误日志
- 友好的错误提示

#### 响应格式
```typescript
// 成功响应
{
  success: true,
  data: any,
  message?: string
}

// 错误响应
{
  success: false,
  error: string,
  code?: string
}
```

#### 认证中间件
```typescript
// lib/auth.ts
export function verifyToken(request: Request): DecodedToken | null
export function requireAuth(request: Request): DecodedToken | NextResponse
export function requireAdmin(request: Request): DecodedToken | NextResponse
```

#### Supabase 客户端
```typescript
// lib/supabase.ts
export const supabase = createClient(url, key)
export async function query<T>(table: string, options?: QueryOptions): Promise<T[]>
export async function insert<T>(table: string, data: T): Promise<T>
export async function update<T>(table: string, id: string, data: Partial<T>): Promise<T>
export async function remove(table: string, id: string): Promise<void>
```

### 8. 特殊业务逻辑

#### 订单创建流程
1. 验证用户认证
2. 验证菜品库存
3. 计算订单金额
4. 应用优惠券（如有）
5. 扣减库存
6. 创建订单记录
7. 计算并增加用户积分
8. 返回订单信息

#### 拼团逻辑
1. 创建拼团：检查活动有效性，创建拼团订单
2. 加入拼团：检查拼团状态，添加成员，检查是否成团
3. 成团处理：更新状态，创建实际订单，扣减库存
4. 过期处理：定时任务检查过期拼团，退款处理

#### 积分系统
- 消费1元 = 1积分
- 积分等级：bronze(0-999), silver(1000-4999), gold(5000+)
- 积分可用于兑换优惠券

#### 分享奖励
- 每日最多3次分享奖励
- 每次分享奖励：满20减5元优惠券
- 记录分享行为用于数据分析

### 9. 性能优化要求

- 使用 Supabase 的索引优化查询
- 实现分页查询，避免一次性加载大量数据
- 使用 Next.js 的缓存机制
- 图片使用 CDN 加速
- API 响应时间控制在 500ms 以内

### 10. 安全要求

- 所有用户输入进行验证和清理
- SQL 注入防护（Supabase 自动处理）
- XSS 防护
- CSRF 防护
- 敏感信息加密存储
- API 限流（防止滥用）

---

## 实现要求

请根据以上需求，生成完整的 Next.js 后端代码，包括：

1. ✅ 所有 API 路由文件（TypeScript）
2. ✅ 认证中间件和工具函数
3. ✅ Supabase 客户端封装
4. ✅ 微信 API 调用封装
5. ✅ TypeScript 类型定义
6. ✅ CORS 中间件
7. ✅ 环境变量示例文件
8. ✅ package.json 依赖配置
9. ✅ README.md 部署文档
10. ✅ 错误处理和日志记录

**代码质量要求**:
- 代码清晰易读，有适当注释
- 遵循 Next.js 14 最佳实践
- 完整的错误处理
- 类型安全（TypeScript）
- 可直接部署到 Vercel

**输出格式**:
- 每个文件单独输出
- 包含完整的文件路径
- 包含必要的注释说明

---

## 补充说明

1. **微信 API 调用**: 使用 `https://api.weixin.qq.com/sns/jscode2session` 换取 openid
2. **JWT 生成**: 使用 `jsonwebtoken` 库
3. **Supabase 客户端**: 使用 `@supabase/supabase-js`
4. **请求验证**: 使用 `zod` 库
5. **日期处理**: 使用 `date-fns` 库

开始生成代码！
