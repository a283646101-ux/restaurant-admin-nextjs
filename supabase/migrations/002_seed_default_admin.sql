-- =====================================================
-- 管理员账号初始化迁移脚本
-- 创建默认管理员账号用于系统首次登录
-- =====================================================

-- 启用 pgcrypto 扩展（用于 BCrypt 密码加密）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 插入默认管理员账号
-- =====================================================
-- 账号信息：
--   邮箱: admin@example.com
--   密码: admin123
--   角色: super_admin
--   状态: active
-- 
-- 使用 ON CONFLICT DO NOTHING 确保幂等性
-- 如果该邮箱已存在，则跳过插入，不产生错误
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

-- =====================================================
-- 验证说明
-- =====================================================
-- 执行此脚本后，可以使用以下 SQL 查询验证默认管理员是否创建成功：
-- 
-- SELECT id, email, name, role, status, created_at 
-- FROM admins 
-- WHERE email = 'admin@example.com';
-- 
-- 登录测试：
-- 使用邮箱 admin@example.com 和密码 admin123 调用登录 API
-- 应该能够成功登录并获得 JWT token
-- =====================================================
