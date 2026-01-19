import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { z } from 'zod'

// GET - 获取订单列表
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const orderMode = searchParams.get('orderMode')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user.userId)

    if (status) {
      query = query.eq('status', status)
    }
    if (orderMode) {
      query = query.eq('order_mode', orderMode)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return successResponse({
      list: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      }
    })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST - 创建订单
const createOrderSchema = z.object({
  items: z.array(z.object({
    dishId: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().min(1),
    portionSize: z.string().optional(),
    portionName: z.string().optional()
  })),
  totalAmount: z.number(),
  orderType: z.enum(['delivery', 'pickup']),
  orderMode: z.enum(['dine_in', 'delivery']).optional(),
  tableNumber: z.string().optional(),
  address: z.any().optional(),
  couponId: z.string().optional(),
  remark: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)

    // 1. Validate Inventory (Optional: lock rows)
    for (const item of validatedData.items) {
      const { data: dish } = await supabaseAdmin
        .from('dishes')
        .select('stock, name')
        .eq('id', item.dishId)
        .single()
      
      if (!dish) throw new Error(`菜品 ${item.name} 不存在`)
      if (dish.stock < item.quantity) throw new Error(`${item.name} 库存不足`)
    }

    // 2. Validate & Apply Coupon
    let discountAmount = 0
    let finalAmount = validatedData.totalAmount
    let userCouponId = null

    if (validatedData.couponId) {
        // Here couponId refers to user_coupons.id
        const { data: userCoupon } = await supabaseAdmin
            .from('user_coupons')
            .select(`*, coupon:coupons(*)`)
            .eq('id', validatedData.couponId)
            .eq('user_id', user.userId)
            .eq('status', 'unused')
            .single()
        
        if (!userCoupon) throw new Error('优惠券无效')
        
        // Calculate discount
        const coupon = userCoupon.coupon
        if (coupon.min_amount > validatedData.totalAmount) {
            throw new Error(`未满足优惠券使用门槛 (满${coupon.min_amount}可用)`)
        }

        if (coupon.type === 'discount') {
            discountAmount = coupon.value
        } else if (coupon.type === 'percent') {
            discountAmount = validatedData.totalAmount * (1 - coupon.value / 100)
        }
        
        userCouponId = userCoupon.id
        finalAmount = Math.max(0, validatedData.totalAmount - discountAmount)
    }

    // 3. Calculate Points (1 RMB = 1 Point)
    const pointsEarned = Math.floor(finalAmount)

    // 4. Create Order Transaction
    // Note: Supabase direct client doesn't support complex transactions easily without RPC
    // We will do sequential operations and manual rollback if needed (or assume success)
    
    // 4.1 Create Order
    const orderId = Date.now().toString() + Math.random().toString().substr(2, 4)
    const { data: order, error: createError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_id: orderId,
        user_id: user.userId,
        items: validatedData.items,
        total_amount: validatedData.totalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        order_type: validatedData.orderType,
        order_mode: validatedData.orderMode,
        table_number: validatedData.tableNumber,
        address: validatedData.address,
        coupon_id: userCouponId, // user_coupon_id
        points_earned: pointsEarned,
        remark: validatedData.remark,
        status: 'paid', // Assuming paid for MVP simplification
      })
      .select()
      .single()

    if (createError) throw createError

    // 4.2 Deduct Stock
    for (const item of validatedData.items) {
       await supabaseAdmin.rpc('decrement_stock', { 
           dish_id: item.dishId, 
           amount: item.quantity 
       })
    }

    // 4.3 Consume Coupon
    if (userCouponId) {
        await supabaseAdmin
            .from('user_coupons')
            .update({ status: 'used', used_at: new Date().toISOString() })
            .eq('id', userCouponId)
    }

    // 4.4 Add Points to User
    if (pointsEarned > 0) {
        await supabaseAdmin.rpc('increment_points', { 
            user_id: user.userId, 
            amount: pointsEarned 
        })
        
        // Update total spent
        await supabaseAdmin.rpc('increment_total_spent', {
            user_id: user.userId,
            amount: finalAmount
        })
    }

    return successResponse(order, '订单创建成功')
  } catch (error) {
    return errorResponse(error)
  }
}
