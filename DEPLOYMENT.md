# 部署指南

本文档详细说明如何将餐饮后台管理系统部署到生产环境。

## 前置准备

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/)
2. 注册/登录账号
3. 点击 "New Project" 创建新项目
4. 记录以下信息：
   - Project URL
   - Anon Key
   - Service Role Key

### 2. 初始化数据库

1. 在 Supabase 控制台，进入 SQL Editor
2. 复制 `supabase/migrations/001_initial_schema.sql` 的内容
3. 粘贴并执行 SQL 语句
4. 确认所有表创建成功

### 3. 创建管理员账号

在 SQL Editor 中执行：

```sql
INSERT INTO admins (email, password_hash, name, role, status)
VALUES (
  'your-email@example.com',
  'your-password',  -- 生产环境请使用 bcrypt 加密
  '超级管理员',
  'super_admin',
  'active'
);
```

## 部署到 Vercel（推荐）

### 步骤 1: 准备代码

```bash
# 确保代码已提交到 Git
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 步骤 2: 导入到 Vercel

1. 访问 [Vercel](https://vercel.com/)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 选择 `restaurant-admin-nextjs` 目录作为根目录

### 步骤 3: 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 步骤 4: 部署

点击 "Deploy" 按钮，等待部署完成。

### 步骤 5: 配置自定义域名（可选）

1. 在 Vercel 项目设置中，进入 "Domains"
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录

## 部署到其他平台

### Netlify

1. 在 Netlify 中导入项目
2. 构建命令: `npm run build`
3. 发布目录: `.next`
4. 配置环境变量（同 Vercel）

### 自托管（VPS/云服务器）

#### 使用 PM2

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "restaurant-admin" -- start

# 设置开机自启
pm2 startup
pm2 save
```

#### 使用 Docker

创建 `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

构建和运行：

```bash
docker build -t restaurant-admin .
docker run -p 3000:3000 --env-file .env.local restaurant-admin
```

#### 使用 Nginx 反向代理

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase 项目 URL | ✅ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 匿名密钥 | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 服务角色密钥 | ✅ |
| NEXT_PUBLIC_APP_URL | 应用访问地址 | ✅ |

## 生产环境优化

### 1. 启用 HTTPS

- Vercel/Netlify 自动提供 HTTPS
- 自托管需要配置 SSL 证书（推荐使用 Let's Encrypt）

### 2. 配置 CDN

- 使用 Vercel Edge Network（自动）
- 或配置 Cloudflare CDN

### 3. 数据库优化

```sql
-- 创建必要的索引（已在迁移文件中）
-- 定期清理过期数据
-- 配置数据库备份
```

### 4. 监控和日志

- 使用 Vercel Analytics
- 配置 Sentry 错误追踪
- 设置 Supabase 日志监控

### 5. 性能优化

- 启用 Next.js 图片优化
- 配置缓存策略
- 使用 ISR（增量静态再生成）

## 安全建议

### 1. 密码加密

更新登录 API 使用 bcrypt：

```typescript
import bcrypt from 'bcryptjs'

// 注册时加密
const hashedPassword = await bcrypt.hash(password, 10)

// 登录时验证
const isValid = await bcrypt.compare(password, admin.password_hash)
```

### 2. JWT 认证

实现 JWT token 认证：

```typescript
import jwt from 'jsonwebtoken'

// 生成 token
const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET!, {
  expiresIn: '7d'
})

// 验证 token
const decoded = jwt.verify(token, process.env.JWT_SECRET!)
```

### 3. CORS 配置

在 `next.config.js` 中配置：

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'your-domain.com' },
        ],
      },
    ]
  },
}
```

### 4. Rate Limiting

使用中间件限制 API 请求频率。

### 5. 环境变量保护

- 不要将 `.env.local` 提交到 Git
- 使用平台的环境变量管理功能
- 定期轮换密钥

## 备份策略

### 数据库备份

Supabase 提供自动备份，也可以手动备份：

```bash
# 使用 pg_dump
pg_dump -h your-db-host -U postgres -d your-db > backup.sql
```

### 代码备份

- 使用 Git 版本控制
- 定期推送到远程仓库
- 创建发布标签

## 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查环境变量是否正确
   - 确认 Supabase 项目状态
   - 检查网络连接

2. **API 请求失败**
   - 查看浏览器控制台错误
   - 检查 API 路由是否正确
   - 验证请求参数

3. **部署失败**
   - 检查构建日志
   - 确认依赖安装成功
   - 验证 Node.js 版本

### 日志查看

```bash
# Vercel
vercel logs

# PM2
pm2 logs restaurant-admin

# Docker
docker logs container-id
```

## 更新部署

### Vercel

推送代码到 GitHub，Vercel 会自动部署。

### 自托管

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
npm install

# 重新构建
npm run build

# 重启应用
pm2 restart restaurant-admin
```

## 回滚

### Vercel

在 Vercel 控制台中选择之前的部署版本，点击 "Promote to Production"。

### 自托管

```bash
# 回退到上一个版本
git reset --hard HEAD~1

# 重新构建和重启
npm run build
pm2 restart restaurant-admin
```

## 联系支持

如遇到部署问题，请联系开发者获取支持。
