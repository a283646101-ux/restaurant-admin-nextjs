// 数据库类型定义

export interface Dish {
  id: string
  name: string
  category: 'main' | 'drink' | 'combo'
  price: number
  image?: string
  images?: string[]
  description?: string
  spicy: boolean
  healthy: boolean
  nutrition?: Nutrition
  specs?: DishSpec[]
  sales: number
  stock: number
  status: 'on_sale' | 'off_sale'
  created_at: string
  updated_at: string
}

export interface Nutrition {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface DishSpec {
  name: string
  price: number
  size?: string
  stock?: number
  nutrition?: Nutrition
}

export interface User {
  id: string
  openid: string
  nickname?: string
  avatar?: string
  phone?: string
  points: number
  level: 'bronze' | 'silver' | 'gold' | 'diamond'
  birthday?: string
  total_orders: number
  total_spent: number
  goal?: 'lose_weight' | 'gain_muscle' | 'balanced'
  referral_code?: string
  created_at: string
  last_login_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_id: string
  user_id: string
  user_nickname?: string
  items: OrderItem[]
  total_amount: number
  discount_amount: number
  final_amount: number
  order_type?: 'delivery' | 'pickup'
  order_mode?: 'dine_in' | 'delivery'
  table_number?: string
  status: 'pending' | 'paid' | 'completed' | 'cancelled'
  address?: Address
  queue_number?: number
  coupon_id?: string
  points_earned: number
  remark?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  dishId: string
  name: string
  price: number
  quantity: number
  image?: string
  portionSize?: string
  portionName?: string
}

export interface Address {
  name: string
  phone: string
  detail: string
}

export interface Coupon {
  id: string
  name: string
  type: 'discount' | 'percent' | 'free_delivery' | 'birthday'
  value: number
  min_amount: number
  total_count: number
  used_count: number
  status: 'active' | 'inactive'
  expire_time?: string
  created_at: string
  updated_at: string
}

export interface Feedback {
  id: string
  user_id: string
  nickname?: string
  type: 'suggestion' | 'complaint' | 'praise' | 'other'
  content: string
  is_public: boolean
  likes: number
  reply?: string
  reply_time?: string
  created_at: string
  updated_at: string
}

export interface GroupActivity {
  id: string
  dish_id: string
  dish_name: string
  dish_image?: string
  original_price: number
  group_price: number
  group_size: number
  max_groups: number
  max_per_user: number
  current_groups: number
  success_groups: number
  start_time: string
  end_time: string
  status: 'upcoming' | 'active' | 'ended'
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  dish_id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'staff'
  avatar?: string
  status: 'active' | 'inactive'
  last_login_at?: string
  created_at: string
  updated_at: string
}
