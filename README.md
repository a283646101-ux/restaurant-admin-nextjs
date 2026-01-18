# 餐饮小程序后台管理系统

基于 Next.js 14 + Supabase 构建的现代化餐饮后台管理系统。

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **UI 框架**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **图标**: Lucide React
- **图表**: Recharts

## 功能特性

### 已实现功能

- ✅ 管理员登录认证
- ✅ 仪表板数据统计
- ✅ 菜品管理（CRUD）
- ✅ 订单管理
- ✅ 用户管理
- ✅ 数据分析

### 待实现功能

- ⏳ 优惠券管理
- ⏳ 反馈管理
- ⏳ 系统设置
- ⏳ 拼团活动管理
- ⏳ 数据可视化图表
- ⏳ 文件上传功能

## 项目结构

```
restaurant-admin-nextjs/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes (Serverless 函数)
│   │   ├── auth/            # 认证相关 API
│   │   ├── dishes/          # 菜品相关 API
│   │   ├── orders/          # 订单相关 API
│   │   ├── users/           # 用户相关 API
│   │   └── analytics/       # 统计分析 API
│   ├── dashboard/           # 管理后台页面
│   │   ├── dishes/          # 菜品管理页
│   │   ├── orders/          # 订单管理页
│   │   └── ...
│   ├── login/               # 登录页
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页（重定向到登录）
│   └── globals.css          # 全局样式
├── lib/                     # 工具库
│   ├── supabase.ts          # Supabase 客户端配置
│   └── types.ts             # TypeScript 类型定义
├── supabase/                # Supabase 配置
│   └── migrations/          # 数据库迁移文件
│       └── 001_initial_schema.sql
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 快速开始

### 1. 安装依赖

```bash
cd restaurant-admin-nextjs
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`，并填入你的 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. 初始化数据库

在 Supabase 控制台中执行 `supabase/migrations/001_initial_schema.sql` 文件中的 SQL 语句。

### 4. 创建管理员账号

在 Supabase 控制台中，向 `admins` 表插入一条记录：

```sql
INSERT INTO admins (email, password_hash, name, role, status)
VALUES (
  'admin@example.com',
  'admin123',  -- 实际应该使用 bcrypt 加密
  '管理员',
  'super_admin',
  'active'
);
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 6. 登录系统

- 邮箱: `admin@example.com`
- 密码: `admin123`

## API 接口文档

### 认证 API

#### POST /api/auth/login
登录接口

**请求体:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**响应:**
```json
{
  "success": true,
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "管理员",
    "role": "super_admin"
  }
}
```

### 菜品 API

#### GET /api/dishes
获取菜品列表

**查询参数:**
- `category`: 分类筛选 (main/drink/combo)
- `status`: 状态筛选 (on_sale/off_sale)
- `page`: 页码 (默认 1)
- `limit`: 每页数量 (默认 20)

#### POST /api/dishes
创建菜品

#### GET /api/dishes/[id]
获取单个菜品详情

#### PUT /api/dishes/[id]
更新菜品

#### DELETE /api/dishes/[id]
删除菜品

### 订单 API

#### GET /api/orders
获取订单列表

**查询参数:**
- `status`: 状态筛选 (pending/paid/completed/cancelled)
- `orderMode`: 订单模式 (dine_in/delivery)
- `page`: 页码
- `limit`: 每页数量

#### GET /api/orders/[id]
获取单个订单详情

#### PUT /api/orders/[id]
更新订单状态

### 用户 API

#### GET /api/users
获取用户列表

**查询参数:**
- `level`: 会员等级筛选 (bronze/silver/gold/diamond)
- `page`: 页码
- `limit`: 每页数量

### 统计 API

#### GET /api/analytics
获取统计数据

**响应:**
```json
{
  "success": true,
  "data": {
    "todayRevenue": 1234.56,
    "todayOrderCount": 45,
    "totalUsers": 1000,
    "totalOrders": 5000,
    "totalRevenue": 123456.78,
    "pendingOrders": 10
  }
}
```

## 数据库架构

详见 `supabase/migrations/001_initial_schema.sql`

主要数据表：
- `dishes` - 菜品表
- `users` - 用户表
- `orders` - 订单表
- `coupons` - 优惠券表
- `feedback` - 反馈表
- `group_activities` - 拼团活动表
- `group_orders` - 拼团订单表
- `reviews` - 评价表
- `admins` - 管理员表

## 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 自托管部署

```bash
npm run build
npm start
```

## 开发指南

### 添加新页面

1. 在 `app/dashboard/` 下创建新目录
2. 创建 `page.tsx` 文件
3. 在 `app/dashboard/layout.tsx` 中添加菜单项

### 添加新 API

1. 在 `app/api/` 下创建新目录
2. 创建 `route.ts` 文件
3. 实现 GET/POST/PUT/DELETE 方法

### 添加新类型

在 `lib/types.ts` 中添加 TypeScript 类型定义

## 注意事项

1. **密码加密**: 当前示例中密码未加密，生产环境请使用 bcrypt
2. **权限控制**: 需要实现更细粒度的权限控制
3. **文件上传**: 需要集成 Supabase Storage 或其他云存储服务
4. **错误处理**: 需要完善错误处理和日志记录
5. **数据验证**: 需要添加输入数据验证

## 许可证

MIT

## 联系方式

如需定制开发，请联系开发者。
