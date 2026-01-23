import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase' // Use admin client for better privileges

export const dynamic = 'force-dynamic'

// GET - 获取统计数据
export async function GET(request: NextRequest) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    // 1. 获取今日完成的订单 (用于计算今日营收)
    const { data: todayOrders, error: todayError } = await supabaseAdmin
      .from('orders')
      .select('final_amount')
      .gte('created_at', today.toISOString())
      .or('status.eq.paid,status.eq.completed') // 支付过都算营收

    if (todayError) throw todayError

    const todayRevenue = todayOrders?.reduce((sum, order) => sum + Number(order.final_amount), 0) || 0
    const todayOrderCount = todayOrders?.length || 0

    // 2. 获取总用户数
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) throw usersError

    // 3. 获取待处理订单 (paid, preparing)
    const { count: pendingOrders, error: pendingError } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .or('status.eq.paid,status.eq.preparing')

    if (pendingError) throw pendingError

    // 4. 获取最近7天的营收数据 (用于图表)
    const { data: recentOrders, error: recentError } = await supabaseAdmin
      .from('orders')
      .select('created_at, final_amount')
      .gte('created_at', sevenDaysAgo.toISOString())
      .or('status.eq.paid,status.eq.completed')
      .order('created_at', { ascending: true })

    if (recentError) throw recentError

    // 处理图表数据：按日期分组
    const chartDataMap = new Map<string, number>()
    
    // 初始化过去7天的数据为0
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD
      // 格式化为 MM-DD 用于前端展示
      const displayDate = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
      chartDataMap.set(displayDate, 0)
    }

    // 填充实际数据
    recentOrders?.forEach(order => {
      const d = new Date(order.created_at)
      const displayDate = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
      if (chartDataMap.has(displayDate)) {
        chartDataMap.set(displayDate, (chartDataMap.get(displayDate) || 0) + Number(order.final_amount))
      }
    })

    const chartData = Array.from(chartDataMap).map(([date, amount]) => ({
      date,
      amount
    }))

    return NextResponse.json({
      success: true,
      data: {
        todayRevenue,
        todayOrderCount,
        totalUsers: totalUsers || 0,
        pendingOrders: pendingOrders || 0,
        chartData
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
