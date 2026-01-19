import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { z } from 'zod'

const issueCouponSchema = z.object({
  couponId: z.string().uuid(),
  source: z.string().default('manual'),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const body = await request.json()
    const { couponId, source } = issueCouponSchema.parse(body)

    // 1. Check if coupon exists and is active
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('id', couponId)
      .single()

    if (couponError || !coupon) {
      throw new Error('优惠券不存在或已失效')
    }

    if (coupon.status !== 'active') {
      throw new Error('优惠券已停止发放')
    }

    if (coupon.total_count > 0 && coupon.used_count >= coupon.total_count) {
      throw new Error('优惠券已领完')
    }

    // 2. Issue coupon to user
    const expireTime = coupon.expire_time 
      ? new Date(coupon.expire_time).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Default 30 days

    const { data: userCoupon, error: issueError } = await supabaseAdmin
      .from('user_coupons')
      .insert({
        user_id: user.userId,
        coupon_id: couponId,
        status: 'unused',
        source: source,
        expire_at: expireTime, // Note: Schema might need expire_at if not present, checking schema...
        // Checking schema: user_coupons has expire_at TIMESTAMP WITH TIME ZONE NOT NULL
      })
      .select()
      .single()

    if (issueError) throw issueError

    return successResponse(userCoupon, '优惠券领取成功')
  } catch (error) {
    return errorResponse(error)
  }
}
