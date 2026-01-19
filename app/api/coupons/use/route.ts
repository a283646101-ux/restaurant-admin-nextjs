import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { z } from 'zod'

const useCouponSchema = z.object({
  userCouponId: z.string().uuid(),
  orderId: z.string().optional(), // Can be linked later
})

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const body = await request.json()
    const { userCouponId } = useCouponSchema.parse(body)

    // 1. Verify ownership and status
    const { data: userCoupon, error: fetchError } = await supabaseAdmin
      .from('user_coupons')
      .select('*')
      .eq('id', userCouponId)
      .eq('user_id', user.userId)
      .single()

    if (fetchError || !userCoupon) {
      throw new Error('优惠券不存在')
    }

    if (userCoupon.status !== 'unused') {
      throw new Error('优惠券已使用或已过期')
    }

    if (new Date(userCoupon.expire_at) < new Date()) {
      // Auto expire
      await supabaseAdmin
        .from('user_coupons')
        .update({ status: 'expired' })
        .eq('id', userCouponId)
      throw new Error('优惠券已过期')
    }

    // 2. Mark as used
    const { data: updatedCoupon, error: updateError } = await supabaseAdmin
      .from('user_coupons')
      .update({
        status: 'used',
        used_at: new Date().toISOString()
      })
      .eq('id', userCouponId)
      .select()
      .single()

    if (updateError) throw updateError

    // 3. Update coupon stats (optional, best effort)
    await supabaseAdmin.rpc('increment_coupon_used_count', { coupon_id: userCoupon.coupon_id })

    return successResponse(updatedCoupon, '优惠券使用成功')
  } catch (error) {
    return errorResponse(error)
  }
}
