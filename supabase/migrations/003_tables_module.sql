-- 1. Create dining_tables table
CREATE TABLE IF NOT EXISTS dining_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'A01', 'B02'
  capacity INTEGER DEFAULT 4,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning')),
  current_order_id UUID REFERENCES orders(id), -- Link to active order
  x_position INTEGER DEFAULT 0, -- For visual layout (optional)
  y_position INTEGER DEFAULT 0, -- For visual layout (optional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert new admin account
-- Password '12345678' hashed using pgcrypto's crypt function with Blowfish (bf)
-- Note: pgcrypto extension must be enabled (CREATE EXTENSION IF NOT EXISTS pgcrypto;)
INSERT INTO admins (email, password_hash, name, role, status)
VALUES (
  '2836461019@qq.com',
  crypt('12345678', gen_salt('bf')),
  '餐厅经理',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- 3. Enable RLS for dining_tables
ALTER TABLE dining_tables ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for dining_tables
CREATE POLICY "Admins can do everything on dining_tables" 
  ON dining_tables 
  FOR ALL 
  TO service_role, authenticated 
  USING (true) 
  WITH CHECK (true);

-- 5. Add 'dining_table_id' to orders table if not exists (for reverse lookup consistency)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'dining_table_id') THEN
    ALTER TABLE orders ADD COLUMN dining_table_id UUID REFERENCES dining_tables(id);
  END IF;
END $$;
