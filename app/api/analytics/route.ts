import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    // 获取今日订单统计
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayOrders, error: todayError } = await supabase
      .from('orders')
      .select('final_amount')
      .gte('created_at', today.toISOString())
      .eq('status', 'completed')

    if (todayError) throw todayError

    const todayRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.final_amount), 0) || 0
    const todayOrderCount = todayOrders?.length || 0

    // 获取总用户数
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) throw usersError

    // 获取总订单数
    const { count: totalOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    if (ordersError) throw ordersError

    // 获取总营收
    const { data: allOrders, error: revenueError } = await supabase
      .from('orders')
      .select('final_amount')
      .eq('status', 'completed')

    if (revenueError) throw revenueError

    const totalRevenue = allOrders?.reduce((sum, order) => sum + Number(order.final_amount), 0) || 0

    // 获取待处理订单数
    const { count: pendingOrders, error: pendingError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (pendingError) throw pendingError

    return NextResponse.json({
      success: true,
      data: {
        todayRevenue,
        todayOrderCount,
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        pendingOrders: pendingOrders || 0,
      },
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: '获取统计数据失败' },
      { status: 500 }
    )
  }
}
