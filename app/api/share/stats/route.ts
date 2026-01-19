import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const { count: totalShares } = await supabaseAdmin
      .from('share_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.userId)

    const { count: rewards } = await supabaseAdmin
      .from('share_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.userId)
      .eq('coupon_issued', true)

    return successResponse({
      totalShares: totalShares || 0,
      totalRewards: rewards || 0
    })
  } catch (error) {
    return errorResponse(error)
  }
}
