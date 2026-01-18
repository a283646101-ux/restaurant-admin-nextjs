# 快速开始指南

本指南将帮助你在 5 分钟内启动餐饮后台管理系统。

## 📋 前置要求

- Node.js 18+ 
- npm 或 yarn
- Supabase 账号（免费）

## 🚀 快速启动

### 1. 创建 Supabase 项目

1. 访问 https://supabase.com/
2. 点击 "Start your project"
3. 创建新项目，记录以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. 初始化数据库

1. 在 Supabase 控制台，点击左侧 "SQL Editor"
2. 点击 "New query"
3. 复制 `supabase/migrations/001_initial_schema.sql` 的全部内容
4. 粘贴并点击 "Run" 执行
5. 确认所有表创建成功（应该看到 16 个表）

### 3. 创建管理员账号

在 SQL Editor 中执行：

```sql
INSERT INTO admins (email, password_hash, name, role, status)
VALUES (
  'admin@example.com',
  'admin123',
  '超级管理员',
  'super_admin',
  'active'
);
```

### 4. 安装项目

```bash
# 进入项目目录
cd restaurant-admin-nextjs

# 安装依赖
npm install
```

### 5. 配置环境变量

创建 `.env.local` 文件：

```bash
# 复制示例文件
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的 Supabase 信息：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. 启动开发服务器

```bash
npm run dev
```

### 7. 访问系统

打开浏览器访问 http://localhost:3000

**登录信息：**
- 邮箱: `admin@example.com`
- 密码: `admin123`

## ✅ 验证安装

登录后，你应该能看到：

1. ✅ 仪表板页面显示统计数据
2. ✅ 左侧菜单可以切换不同页面
3. ✅ 菜品管理、订单管理、用户管理等功能正常

## 📊 添加测试数据（可选）

### 添加测试菜品

在 SQL Editor 中执行：

```sql
INSERT INTO dishes (name, category, price, description, spicy, healthy, stock, sales, status)
VALUES 
  ('麻辣香锅', 'main', 38.00, '精选多种食材，麻辣鲜香', true, false, 100, 156, 'on_sale'),
  ('清蒸鲈鱼', 'main', 68.00, '新鲜鲈鱼，清蒸保持原味', false, true, 50, 89, 'on_sale'),
  ('鲜榨橙汁', 'drink', 18.00, '新鲜橙子现榨，维C丰富', false, true, 300, 145, 'on_sale');
```

### 添加测试用户

```sql
INSERT INTO users (openid, nickname, phone, points, level, total_orders, total_spent)
VALUES 
  ('wx_test_001', '测试用户1', '13800138000', 500, 'gold', 10, 500.00),
  ('wx_test_002', '测试用户2', '13800138001', 200, 'silver', 5, 200.00);
```

### 添加测试订单

```sql
INSERT INTO orders (
  order_id, user_id, user_nickname, items, 
  total_amount, discount_amount, final_amount, 
  status, order_mode
)
SELECT 
  'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || '001',
  id,
  nickname,
  '[{"dishId":"1","name":"麻辣香锅","price":38,"quantity":2}]'::jsonb,
  76.00,
  0,
  76.00,
  'pending',
  'delivery'
FROM users 
WHERE openid = 'wx_test_001'
LIMIT 1;
```

## 🎯 下一步

现在你可以：

1. **探索功能**: 浏览各个管理页面
2. **添加数据**: 通过界面或 SQL 添加更多数据
3. **自定义**: 根据需求修改代码
4. **部署**: 参考 [DEPLOYMENT.md](./DEPLOYMENT.md) 部署到生产环境

## 🐛 常见问题

### 问题 1: 数据库连接失败

**错误信息**: "Failed to fetch..."

**解决方案**:
1. 检查 `.env.local` 中的 Supabase URL 和 Key 是否正确
2. 确认 Supabase 项目状态正常
3. 检查网络连接

### 问题 2: 登录失败

**错误信息**: "邮箱或密码错误"

**解决方案**:
1. 确认已在数据库中创建管理员账号
2. 检查邮箱和密码是否正确
3. 查看浏览器控制台的错误信息

### 问题 3: 页面显示空白

**解决方案**:
1. 打开浏览器开发者工具查看错误
2. 确认 API 请求是否成功
3. 检查数据库表是否创建成功

### 问题 4: npm install 失败

**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

## 📚 更多资源

- [完整文档](./README.md)
- [部署指南](./DEPLOYMENT.md)
- [API 文档](./README.md#api-接口文档)
- [Supabase 文档](https://supabase.com/docs)
- [Next.js 文档](https://nextjs.org/docs)

## 💡 提示

1. **开发环境**: 使用 `npm run dev` 启动开发服务器，支持热重载
2. **生产构建**: 使用 `npm run build` 构建生产版本
3. **代码格式**: 使用 `npm run lint` 检查代码规范
4. **数据备份**: 定期备份 Supabase 数据库

## 🆘 获取帮助

如果遇到问题：

1. 查看 [常见问题](#-常见问题) 部分
2. 检查浏览器控制台的错误信息
3. 查看 Supabase 控制台的日志
4. 联系开发者获取支持

---

**恭喜！** 🎉 你已经成功启动了餐饮后台管理系统！
