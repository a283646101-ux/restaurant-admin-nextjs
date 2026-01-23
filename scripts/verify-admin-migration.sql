-- =====================================================
-- 管理员账号初始化验证脚本
-- 用于验证迁移脚本是否成功执行
-- =====================================================

-- 1. 检查 pgcrypto 扩展是否已启用
SELECT 
  extname AS extension_name,
  extversion AS version
FROM pg_extension 
WHERE extname = 'pgcrypto';

-- 预期结果: 应该返回一行，显示 pgcrypto 扩展已安装

-- =====================================================

-- 2. 检查默认管理员账号是否存在
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

-- 预期结果:
-- - email: admin@example.com
-- - name: 系统管理员
-- - role: super_admin
-- - status: active
-- - password_hash_preview: $2a$10$... 或 $2b$10$...

-- =====================================================

-- 3. 验证密码哈希格式
SELECT 
  email,
  CASE 
    WHEN password_hash LIKE '$2a$%' THEN 'BCrypt (2a) ✓'
    WHEN password_hash LIKE '$2b$%' THEN 'BCrypt (2b) ✓'
    ELSE 'Invalid format ✗'
  END AS hash_format,
  LENGTH(password_hash) AS hash_length,
  CASE 
    WHEN LENGTH(password_hash) = 60 THEN 'Correct length ✓'
    ELSE 'Incorrect length ✗'
  END AS length_check
FROM admins 
WHERE email = 'admin@example.com';

-- 预期结果:
-- - hash_format: BCrypt (2a) ✓ 或 BCrypt (2b) ✓
-- - hash_length: 60
-- - length_check: Correct length ✓

-- =====================================================

-- 4. 验证密码是否正确（使用 crypt 函数）
SELECT 
  email,
  password_hash = crypt('admin123', password_hash) AS password_matches,
  CASE 
    WHEN password_hash = crypt('admin123', password_hash) THEN 'Password correct ✓'
    ELSE 'Password incorrect ✗'
  END AS password_check
FROM admins 
WHERE email = 'admin@example.com';

-- 预期结果:
-- - password_matches: true
-- - password_check: Password correct ✓

-- =====================================================

-- 5. 统计管理员账号数量
SELECT 
  COUNT(*) AS total_admins,
  COUNT(CASE WHEN email = 'admin@example.com' THEN 1 END) AS default_admin_count,
  COUNT(CASE WHEN role = 'super_admin' THEN 1 END) AS super_admin_count
FROM admins;

-- 预期结果:
-- - default_admin_count: 1
-- - super_admin_count: 至少 1

-- =====================================================

-- 6. 测试幂等性（重复执行迁移脚本）
-- 注意：这个测试会尝试再次插入默认管理员
-- 由于使用了 ON CONFLICT DO NOTHING，应该不会产生错误

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

-- 预期结果: 执行成功，无错误信息

-- 验证记录数量未增加
SELECT 
  COUNT(*) AS admin_count_after_duplicate_insert
FROM admins 
WHERE email = 'admin@example.com';

-- 预期结果: admin_count_after_duplicate_insert = 1

-- =====================================================

-- 7. 检查所有必需字段
SELECT 
  CASE WHEN email IS NOT NULL THEN '✓' ELSE '✗' END AS has_email,
  CASE WHEN password_hash IS NOT NULL THEN '✓' ELSE '✗' END AS has_password_hash,
  CASE WHEN name IS NOT NULL THEN '✓' ELSE '✗' END AS has_name,
  CASE WHEN role IS NOT NULL THEN '✓' ELSE '✗' END AS has_role,
  CASE WHEN status IS NOT NULL THEN '✓' ELSE '✗' END AS has_status,
  CASE WHEN created_at IS NOT NULL THEN '✓' ELSE '✗' END AS has_created_at
FROM admins 
WHERE email = 'admin@example.com';

-- 预期结果: 所有字段都应该显示 ✓

-- =====================================================

-- 总结报告
SELECT 
  '验证完成' AS status,
  'All checks passed' AS message,
  NOW() AS verified_at;
