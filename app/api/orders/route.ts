import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

// GET - 获取订单列表
export async function GET(request: NextRequest) {
  try {
    // 认证检查
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
      .eq('user_id', user.userId) // 仅获取当前用户的订单

    // 筛选条件
    if (status) {
      query = query.eq('status', status)
    }
    if (orderMode) {
      query = query.eq('order_mode', orderMode)
    }

    // 分页和排序
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { error: '获取订单列表失败' },
      { status: 500 }
    )
  }
}

// POST - 创建订单
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  const user = authResult

  try {
    const orderData = await request.json()

    // 自动关联当前用户ID
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        ...orderData,
        user_id: user.userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
        success: true,
        data
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
        { error: '创建订单失败' }, 
        { status: 500 }
    )
  }
}
