-- =====================================================
-- 餐饮小程序后台管理系统 - Supabase 数据库迁移脚本
-- 从 uniCloud 迁移到 Supabase PostgreSQL
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. dishes 表（菜品表）
-- =====================================================
CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('main', 'drink', 'combo')),
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  images TEXT[], -- 支持多图片
  description TEXT,
  spicy BOOLEAN DEFAULT FALSE,
  healthy BOOLEAN DEFAULT FALSE,
  nutrition JSONB,
  specs JSONB, -- 份量规格数组
  sales INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'on_sale' CHECK (status IN ('on_sale', 'off_sale')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_dishes_category ON dishes(category);
CREATE INDEX idx_dishes_status ON dishes(status);
CREATE INDEX idx_dishes_sales ON dishes(sales DESC);

-- =====================================================
-- 2. users 表（用户/会员表）
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  openid VARCHAR(100) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  avatar TEXT,
  phone VARCHAR(20),
  points INTEGER DEFAULT 0,
  level VARCHAR(20) DEFAULT 'bronze' CHECK (level IN ('bronze', 'silver', 'gold', 'diamond')),
  birthday DATE,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  goal VARCHAR(20) CHECK (goal IN ('lose_weight', 'gain_muscle', 'balanced')),
  referral_code VARCHAR(20) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_users_openid ON users(openid);
CREATE INDEX idx_users_level ON users(level);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- =====================================================
-- 3. orders 表（订单表）
-- =====================================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_nickname VARCHAR(100),
  items JSONB NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  final_amount DECIMAL(10, 2) NOT NULL,
  order_type VARCHAR(20) CHECK (order_type IN ('delivery', 'pickup')),
  order_mode VARCHAR(20) CHECK (order_mode IN ('dine_in', 'delivery')),
  table_number VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'cancelled')),
  address JSONB,
  queue_number INTEGER,
  coupon_id UUID,
  points_earned INTEGER DEFAULT 0,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- =====================================================
-- 4. coupons 表（优惠券模板表）
-- =====================================================
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('discount', 'percent', 'free_delivery', 'birthday')),
  value DECIMAL(10, 2) NOT NULL,
  min_amount DECIMAL(10, 2) DEFAULT 0,
  total_count INTEGER NOT NULL,
  used_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  expire_time DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_coupons_status ON coupons(status);
CREATE INDEX idx_coupons_type ON coupons(type);

-- =====================================================
-- 5. user_coupons 表（用户优惠券表）
-- =====================================================
CREATE TABLE user_coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired')),
  used_at TIMESTAMP WITH TIME ZONE,
  expire_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX idx_user_coupons_status ON user_coupons(status);

-- =====================================================
-- 6. feedback 表（意见反馈表）
-- =====================================================
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nickname VARCHAR(100),
  type VARCHAR(20) CHECK (type IN ('suggestion', 'complaint', 'praise', 'other')),
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  reply TEXT,
  reply_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_is_public ON feedback(is_public);

-- =====================================================
-- 7. settings 表（系统设置表）
-- =====================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE UNIQUE INDEX idx_settings_key ON settings(key);

-- =====================================================
-- 8. queue 表（排队取号表）
-- =====================================================
CREATE TABLE queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  queue_type VARCHAR(10) NOT NULL,
  queue_number VARCHAR(10) NOT NULL,
  table_type VARCHAR(20) CHECK (table_type IN ('small', 'medium', 'large', 'vip')),
  position INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'calling', 'completed', 'cancelled', 'expired')),
  expire_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_queue_user_id ON queue(user_id);
CREATE INDEX idx_queue_status ON queue(status);
CREATE INDEX idx_queue_created_at ON queue(created_at DESC);

-- =====================================================
-- 9. reservations 表（预约表）
-- =====================================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot VARCHAR(20) NOT NULL,
  guests INTEGER NOT NULL,
  table_type VARCHAR(20) CHECK (table_type IN ('small', 'medium', 'large', 'vip')),
  table_type_name VARCHAR(50),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  remark TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_status ON reservations(status);

-- =====================================================
-- 10. addresses 表（收货地址表）
-- =====================================================
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  province VARCHAR(50),
  city VARCHAR(50),
  district VARCHAR(50),
  detail TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(is_default);

-- =====================================================
-- 11. group_activities 表（拼团活动表）
-- =====================================================
CREATE TABLE group_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  dish_name VARCHAR(100) NOT NULL,
  dish_image TEXT,
  original_price DECIMAL(10, 2) NOT NULL,
  group_price DECIMAL(10, 2) NOT NULL,
  group_size INTEGER NOT NULL CHECK (group_size BETWEEN 2 AND 10),
  max_groups INTEGER NOT NULL,
  max_per_user INTEGER NOT NULL,
  current_groups INTEGER DEFAULT 0,
  success_groups INTEGER DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_group_activities_dish_id ON group_activities(dish_id);
CREATE INDEX idx_group_activities_status ON group_activities(status);
CREATE INDEX idx_group_activities_start_time ON group_activities(start_time);

-- =====================================================
-- 12. group_orders 表（拼团订单表）
-- =====================================================
CREATE TABLE group_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id VARCHAR(50) UNIQUE NOT NULL,
  activity_id UUID NOT NULL REFERENCES group_activities(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leader_nickname VARCHAR(100),
  leader_avatar TEXT,
  members JSONB NOT NULL,
  required_size INTEGER NOT NULL,
  current_size INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'expired')),
  expire_time TIMESTAMP WITH TIME ZONE NOT NULL,
  share_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_group_orders_group_id ON group_orders(group_id);
CREATE INDEX idx_group_orders_activity_id ON group_orders(activity_id);
CREATE INDEX idx_group_orders_leader_id ON group_orders(leader_id);
CREATE INDEX idx_group_orders_status ON group_orders(status);

-- =====================================================
-- 13. share_records 表（分享记录表）
-- =====================================================
CREATE TABLE share_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_type VARCHAR(20) NOT NULL CHECK (share_type IN ('menu', 'dish', 'group', 'order', 'invite')),
  target_id VARCHAR(100),
  platform VARCHAR(20) CHECK (platform IN ('wechat', 'moments', 'copy')),
  coupon_issued BOOLEAN DEFAULT FALSE,
  coupon_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_share_records_user_id ON share_records(user_id);
CREATE INDEX idx_share_records_share_type ON share_records(share_type);
CREATE INDEX idx_share_records_created_at ON share_records(created_at DESC);

-- =====================================================
-- 14. invite_records 表（邀请记录表）
-- =====================================================
CREATE TABLE invite_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inviter_nickname VARCHAR(100),
  invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_nickname VARCHAR(100),
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'first_order', 'rewarded')),
  inviter_reward JSONB,
  invitee_reward JSONB,
  first_order_bonus BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_invite_records_inviter_id ON invite_records(inviter_id);
CREATE INDEX idx_invite_records_invitee_id ON invite_records(invitee_id);
CREATE UNIQUE INDEX idx_invite_records_invitee_unique ON invite_records(invitee_id);

-- =====================================================
-- 15. reviews 表（菜品评价表）
-- =====================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (LENGTH(comment) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dish_id, user_id) -- 同一用户对同一菜品只能有一条评价
);

-- 创建索引
CREATE INDEX idx_reviews_dish_id ON reviews(dish_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- =====================================================
-- 16. admins 表（管理员表）
-- =====================================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'staff')),
  avatar TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE UNIQUE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_role ON admins(role);

-- =====================================================
-- 触发器：自动更新 updated_at 字段
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加 updated_at 触发器
CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON dishes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_coupons_updated_at BEFORE UPDATE ON user_coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_queue_updated_at BEFORE UPDATE ON queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_activities_updated_at BEFORE UPDATE ON group_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_orders_updated_at BEFORE UPDATE ON group_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invite_records_updated_at BEFORE UPDATE ON invite_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) 策略
-- =====================================================

-- 启用 RLS
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 管理员可以访问所有数据
CREATE POLICY "Admins can do everything" ON dishes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON coupons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON user_coupons FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON feedback FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON queue FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON reservations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON addresses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON group_activities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON group_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON share_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON invite_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON reviews FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can do everything" ON admins FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 完成
-- =====================================================
COMMENT ON DATABASE postgres IS '餐饮小程序后台管理系统数据库';
