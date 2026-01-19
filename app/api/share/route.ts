import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { z } from 'zod'

const shareSchema = z.object({
  shareType: z.enum(['menu', 'dish', 'group', 'order', 'invite']),
  targetId: z.string().optional(),
  platform: z.enum(['wechat', 'moments', 'copy']),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const body = await request.json()
    const validatedData = shareSchema.parse(body)

    // 1. Check daily share limit (max 3 rewards per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { count: dailyShares } = await supabaseAdmin
      .from('share_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.userId)
      .eq('coupon_issued', true)
      .gte('created_at', today.toISOString())

    let couponIssued = false
    let couponId = null

    if ((dailyShares || 0) < 3) {
      // 2. Issue reward coupon (e.g., 5 RMB off 20)
      // Find a suitable coupon template or create one
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('id')
        .eq('type', 'discount')
        .eq('status', 'active')
        .limit(1)
        .single()
      
      if (coupon) {
        // Issue coupon
        const { data: userCoupon } = await supabaseAdmin
          .from('user_coupons')
          .insert({
            user_id: user.userId,
            coupon_id: coupon.id,
            source: '分享奖励',
            status: 'unused',
            expire_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          })
          .select()
          .single()
        
        if (userCoupon) {
            couponIssued = true
            couponId = coupon.id
        }
      }
    }

    // 3. Record share
    const { data: record, error } = await supabaseAdmin
      .from('share_records')
      .insert({
        user_id: user.userId,
        share_type: validatedData.shareType,
        target_id: validatedData.targetId,
        platform: validatedData.platform,
        coupon_issued: couponIssued,
        coupon_id: couponId
      })
      .select()
      .single()

    if (error) throw error

    return successResponse({
      ...record,
      message: couponIssued ? '分享成功，获得一张优惠券！' : '分享成功'
    })
  } catch (error) {
    return errorResponse(error)
  }
}
