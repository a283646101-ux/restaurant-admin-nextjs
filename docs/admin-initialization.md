# 管理员账号初始化文档

## 概述

本文档说明如何执行管理员账号初始化迁移脚本，以及如何验证默认管理员账号是否创建成功。该迁移脚本会在数据库中创建一个默认的超级管理员账号，用于系统首次部署后的登录。

### 默认管理员账号信息·

- **邮箱**: `admin@example.com`
- **密码**: `admin123`
- **角色**: `super_admin`
- **状态**: `active`

> ⚠️ **安全提示**: 首次登录后，请立即修改默认密码以确保系统安全。

## 迁移脚本说明

迁移脚本位于 `supabase/migrations/002_seed_default_admin.sql`，主要功能包括：

1. 启用 `pgcrypto` 扩展（用于 BCrypt 密码加密）
2. 插入默认管理员账号，密码使用 BCrypt 算法加密
3. 使用 `ON CONFLICT DO NOTHING` 确保幂等性（可重复执行）

## 本地环境执行迁移

### 方法 1: 使用 Supabase CLI（推荐）

#### 前置条件

- 已安装 [Supabase CLI](https://supabase.com/docs/guides/cli)
- 已初始化本地 Supabase 项目

#### 执行步骤

1. **启动本地 Supabase 服务**

   ```bash
   supabase start
   ```

2. **应用迁移脚本**

   ```bash
   supabase db reset
   ```

   或者只应用新的迁移：

   ```bash
   supabase migration up
   ```

3. **验证迁移结果**

   查看迁移状态：

   ```bash
   supabase migration list
   ```

   应该看到 `002_seed_default_admin.sql` 已应用。

### 方法 2: 使用 PostgreSQL 客户端

#### 前置条件

- 已安装 PostgreSQL 客户端（如 `psql`）
- 已知本地数据库连接信息

#### 执行步骤

1. **连接到本地数据库**

   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres
   ```

   默认密码通常是 `postgres`。

2. **执行迁移脚本**

   ```sql
   \i supabase/migrations/002_seed_default_admin.sql
   ```

   或者直接复制粘贴脚本内容执行。

3. **退出 psql**

   ```sql
   \q
   ```

### 方法 3: 使用 Docker Compose

如果使用 Docker Compose 运行本地数据库：

1. **进入数据库容器**

   ```bash
   docker exec -it <container_name> psql -U postgres
   ```

2. **执行迁移脚本**（同方法 2）

## Supabase 生产环境执行迁移

### 方法 1: 使用 Supabase Dashboard（推荐）

#### 执行步骤

1. **登录 Supabase Dashboard**

   访问 [https://app.supabase.com](https://app.supabase.com) 并登录。

2. **选择项目**

   选择要部署的项目。

3. **打开 SQL Editor**

   在左侧菜单中点击 **SQL Editor**。

4. **创建新查询**

   点击 **New query** 按钮。

5. **复制迁移脚本内容**

   打开 `supabase/migrations/002_seed_default_admin.sql` 文件，复制全部内容。

6. **粘贴并执行**

   将脚本内容粘贴到 SQL Editor 中，点击 **Run** 按钮执行。

7. **检查执行结果**

   确认没有错误信息，显示 "Success. No rows returned"。

### 方法 2: 使用 Supabase CLI 推送迁移

#### 前置条件

- 已安装 Supabase CLI
- 已链接到 Supabase 项目

#### 执行步骤

1. **链接到 Supabase 项目**（如果尚未链接）

   ```bash
   supabase link --project-ref <your-project-ref>
   ```

   项目引用可以在 Supabase Dashboard 的项目设置中找到。

2. **推送迁移到生产环境**

   ```bash
   supabase db push
   ```

   这会将所有未应用的迁移推送到生产数据库。

3. **确认迁移状态**

   ```bash
   supabase migration list --linked
   ```

### 方法 3: 使用数据库连接字符串

#### 执行步骤

1. **获取数据库连接字符串**

   在 Supabase Dashboard 中：
   - 进入 **Settings** > **Database**
   - 复制 **Connection string** (选择 **URI** 格式)

2. **使用 psql 连接**

   ```bash
   psql "<your-connection-string>"
   ```

3. **执行迁移脚本**

   ```sql
   \i supabase/migrations/002_seed_default_admin.sql
   ```

## 验证默认管理员账号

### 方法 1: SQL 查询验证

执行以下 SQL 查询检查默认管理员账号是否存在：

```sql
SELECT 
  id, 
  email, 
  name, 
  role, 
  status, 
  created_at,
  LEFT(password_hash, 10) || '...' AS password_hash_preview
FROM admins 
WHERE email = 'admin@example.com';
```

**预期结果**:

| 字段 | 预期值 |
|------|--------|
| email | admin@example.com |
| name | 系统管理员 |
| role | super_admin |
| status | active |
| password_hash_preview | $2a$10$... 或 $2b$10$... |

### 方法 2: 检查密码哈希格式

验证密码哈希是否使用 BCrypt 格式：

```sql
SELECT 
  email,
  CASE 
    WHEN password_hash LIKE '$2a$%' THEN 'BCrypt (2a)'
    WHEN password_hash LIKE '$2b$%' THEN 'BCrypt (2b)'
    ELSE 'Unknown format'
  END AS hash_format,
  LENGTH(password_hash) AS hash_length
FROM admins 
WHERE email = 'admin@example.com';
```

**预期结果**:
- `hash_format`: BCrypt (2a) 或 BCrypt (2b)
- `hash_length`: 60

### 方法 3: 统计管理员数量

检查数据库中管理员账号的总数：

```sql
SELECT 
  COUNT(*) AS total_admins,
  COUNT(CASE WHEN email = 'admin@example.com' THEN 1 END) AS default_admin_exists
FROM admins;
```

**预期结果**:
- `default_admin_exists`: 1

### 方法 4: 登录 API 测试

使用默认凭证测试登录功能：

#### 使用 curl

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

#### 使用 Postman 或其他 API 工具

- **URL**: `POST http://localhost:3000/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "email": "admin@example.com",
    "password": "admin123"
  }
  ```

**预期响应**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "...",
      "email": "admin@example.com",
      "name": "系统管理员",
      "role": "super_admin"
    }
  }
}
```

## 常见问题和故障排除

### 问题 1: pgcrypto 扩展未安装

**症状**:
```
ERROR: function gen_salt(unknown) does not exist
```

**原因**: 数据库中未启用 `pgcrypto` 扩展。

**解决方案**:

1. **手动启用扩展**（需要数据库管理员权限）:

   ```sql
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

2. **在 Supabase Dashboard 中启用**:
   - 进入 **Database** > **Extensions**
   - 搜索 `pgcrypto`
   - 点击启用

3. **检查权限**: 确保数据库用户有创建扩展的权限。

### 问题 2: 密码验证失败

**症状**: 迁移脚本执行成功，但使用默认密码登录失败。

**可能原因**:

1. **BCrypt 算法版本不匹配**
2. **登录 API 密码验证逻辑错误**
3. **密码哈希生成错误**

**排查步骤**:

1. **检查密码哈希格式**:

   ```sql
   SELECT email, password_hash 
   FROM admins 
   WHERE email = 'admin@example.com';
   ```

   确认 `password_hash` 以 `$2a$` 或 `$2b$` 开头。

2. **手动验证密码**:

   ```sql
   SELECT 
     email,
     password_hash = crypt('admin123', password_hash) AS password_matches
   FROM admins 
   WHERE email = 'admin@example.com';
   ```

   `password_matches` 应该返回 `true`。

3. **检查登录 API 日志**: 查看应用服务器日志，确认密码验证逻辑是否正确执行。

4. **重新生成密码哈希**:

   如果密码哈希有问题，可以手动更新：

   ```sql
   UPDATE admins 
   SET password_hash = crypt('admin123', gen_salt('bf'))
   WHERE email = 'admin@example.com';
   ```

### 问题 3: 邮箱冲突错误

**症状**:
```
ERROR: duplicate key value violates unique constraint "admins_email_key"
```

**原因**: 数据库中已存在 `admin@example.com` 邮箱的管理员账号。

**解决方案**:

这是正常行为，迁移脚本使用了 `ON CONFLICT DO NOTHING` 来处理这种情况。如果看到此错误，说明：

1. **脚本未使用 ON CONFLICT 子句**: 检查脚本内容是否完整。
2. **已有账号**: 默认管理员已存在，无需重复创建。

**验证现有账号**:

```sql
SELECT id, email, name, role, status 
FROM admins 
WHERE email = 'admin@example.com';
```

如果需要重置密码：

```sql
UPDATE admins 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@example.com';
```

### 问题 4: 迁移脚本执行无响应

**症状**: 执行迁移脚本时长时间无响应。

**可能原因**:

1. **数据库连接问题**
2. **表锁定**
3. **资源不足**

**解决方案**:

1. **检查数据库连接**:

   ```bash
   psql -h <host> -U <user> -d <database> -c "SELECT 1;"
   ```

2. **检查表锁定**:

   ```sql
   SELECT * FROM pg_locks WHERE relation = 'admins'::regclass;
   ```

3. **检查数据库资源**: 在 Supabase Dashboard 中查看数据库性能指标。

4. **重启数据库连接**: 断开并重新连接数据库。

### 问题 5: 权限不足

**症状**:
```
ERROR: permission denied for table admins
```

**原因**: 当前数据库用户没有插入 `admins` 表的权限。

**解决方案**:

1. **使用管理员账号**: 确保使用具有足够权限的数据库用户（如 `postgres`）。

2. **授予权限**（需要超级用户）:

   ```sql
   GRANT INSERT ON admins TO <your_user>;
   ```

3. **在 Supabase 中**: 使用 Dashboard 的 SQL Editor 执行，它会使用具有完整权限的用户。

### 问题 6: 迁移脚本重复执行导致数据不一致

**症状**: 担心多次执行脚本会创建重复数据。

**解决方案**:

迁移脚本已使用 `ON CONFLICT (email) DO NOTHING` 确保幂等性：

- **首次执行**: 插入默认管理员账号
- **后续执行**: 检测到邮箱冲突，跳过插入，不产生错误

**验证幂等性**:

```sql
-- 执行多次后检查记录数
SELECT COUNT(*) 
FROM admins 
WHERE email = 'admin@example.com';
```

应该始终返回 `1`。

## 安全建议

1. **立即修改默认密码**: 首次登录后，立即修改 `admin@example.com` 的密码。

2. **创建个人管理员账号**: 为每个管理员创建独立账号，避免共享默认账号。

3. **禁用或删除默认账号**: 在生产环境中，考虑禁用或删除默认管理员账号：

   ```sql
   -- 禁用账号
   UPDATE admins 
   SET status = 'inactive' 
   WHERE email = 'admin@example.com';

   -- 或删除账号（谨慎操作）
   DELETE FROM admins 
   WHERE email = 'admin@example.com';
   ```

4. **启用多因素认证**: 如果系统支持，为管理员账号启用 MFA。

5. **定期审计**: 定期检查管理员账号列表，删除不再使用的账号。

## 附录

### 完整迁移脚本

```sql
-- =====================================================
-- 管理员账号初始化迁移脚本
-- 创建默认管理员账号用于系统首次登录
-- =====================================================

-- 启用 pgcrypto 扩展（用于 BCrypt 密码加密）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 插入默认管理员账号
-- =====================================================
INSERT INTO admins (
  email,
  password_hash,
  name,
  role,
  status,
  created_at
) VALUES (
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  '系统管理员',
  'super_admin',
  'active',
  NOW()
)
ON CONFLICT (email) DO NOTHING;
```

### 相关资源

- [Supabase CLI 文档](https://supabase.com/docs/guides/cli)
- [PostgreSQL pgcrypto 扩展](https://www.postgresql.org/docs/current/pgcrypto.html)
- [BCrypt 算法说明](https://en.wikipedia.org/wiki/Bcrypt)
- [Supabase 迁移指南](https://supabase.com/docs/guides/database/migrations)

## 联系支持

如果遇到本文档未涵盖的问题，请联系技术支持团队或查阅项目文档。
