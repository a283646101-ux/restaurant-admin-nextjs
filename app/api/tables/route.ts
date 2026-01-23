import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - 获取所有桌台
export async function GET(request: NextRequest) {
  try {
    const { data: tables, error } = await supabaseAdmin
      .from('dining_tables')
      .select(`
        *,
        current_order:orders!current_order_id (
          id,
          order_id,
          status,
          total_amount,
          final_amount,
          created_at,
          items
        )
      `)
      .order('code', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: tables,
    })
  } catch (error) {
    console.error('Get tables error:', error)
    return NextResponse.json(
      { error: '获取桌台列表失败' },
      { status: 500 }
    )
  }
}

// POST - 创建新桌台
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, capacity } = body

    // 检查桌号是否存在
    const { data: existing } = await supabaseAdmin
      .from('dining_tables')
      .select('id')
      .eq('code', code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: '桌号已存在' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('dining_tables')
      .insert({
        code,
        capacity: capacity || 4,
        status: 'available'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Create table error:', error)
    return NextResponse.json(
      { error: '创建桌台失败' },
      { status: 500 }
    )
  }
}
