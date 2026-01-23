import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - 获取单桌详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
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
          items,
          remarks
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: '获取桌台详情失败' },
      { status: 500 }
    )
  }
}

// PUT - 更新桌台状态或信息
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, current_order_id } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (current_order_id !== undefined) updateData.current_order_id = current_order_id

    const { data, error } = await supabaseAdmin
      .from('dining_tables')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: '更新桌台失败' },
      { status: 500 }
    )
  }
}

// DELETE - 删除桌台
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from('dining_tables')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    return NextResponse.json(
      { error: '删除桌台失败' },
      { status: 500 }
    )
  }
}
