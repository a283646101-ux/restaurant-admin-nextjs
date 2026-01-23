import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// POST - 加菜/开台
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, items, orderId } = body
    
    // 获取桌台信息
    const { data: table } = await supabaseAdmin
      .from('dining_tables')
      .select('*')
      .eq('id', params.id)
      .single()
      
    if (!table) throw new Error('桌台不存在')

    // Action: open (开台/加菜)
    if (action === 'update_order') {
      let currentOrder = null
      
      // 1. 如果有 active order，更新它
      if (table.current_order_id) {
        // 获取现有订单
        const { data: existingOrder } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', table.current_order_id)
          .single()
          
        if (existingOrder) {
          // 合并 items
          const newItems = [...existingOrder.items, ...items]
          
          // 重新计算总价
          const totalAmount = newItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
          
          const { data: updated, error } = await supabaseAdmin
            .from('orders')
            .update({
              items: newItems,
              total_amount: totalAmount,
              final_amount: totalAmount, // 简化的逻辑，未考虑折扣
              updated_at: new Date().toISOString()
            })
            .eq('id', table.current_order_id)
            .select()
            .single()
            
          if (error) throw error
          currentOrder = updated
        }
      } 
      // 2. 如果没有 active order，创建新订单
      else {
        // 计算总价
        const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
        
        const orderId = `DINEIN-${Date.now().toString().slice(-6)}`
        
        const { data: newOrder, error } = await supabaseAdmin
          .from('orders')
          .insert({
            order_id: orderId,
            status: 'pending', // 待支付
            order_mode: 'dine_in',
            table_number: table.code,
            dining_table_id: table.id,
            items: items,
            total_amount: totalAmount,
            final_amount: totalAmount,
            discount_amount: 0,
            pay_status: 'unpaid'
          })
          .select()
          .single()
          
        if (error) throw error
        currentOrder = newOrder
        
        // 更新桌台状态为占用
        await supabaseAdmin
          .from('dining_tables')
          .update({
            status: 'occupied',
            current_order_id: newOrder.id
          })
          .eq('id', table.id)
      }
      
      return NextResponse.json({ success: true, data: currentOrder })
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 })

  } catch (error) {
    console.error('Table order error:', error)
    return NextResponse.json(
      { error: '操作失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// PUT - 结账/清台
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action } = body
    
    // 获取桌台信息
    const { data: table } = await supabaseAdmin
      .from('dining_tables')
      .select('*')
      .eq('id', params.id)
      .single()
      
    if (!table) throw new Error('桌台不存在')

    if (action === 'checkout') {
      if (!table.current_order_id) {
        throw new Error('当前没有进行中的订单')
      }

      // 1. 更新订单状态为已完成/已支付
      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'completed',
          pay_status: 'paid',
          pay_time: new Date().toISOString()
        })
        .eq('id', table.current_order_id)
        
      if (orderError) throw orderError

      // 2. 释放桌台
      const { error: tableError } = await supabaseAdmin
        .from('dining_tables')
        .update({
          status: 'cleaning', // 设为清理中，需要服务员手动设为空闲，或者直接设为 available
          current_order_id: null
        })
        .eq('id', table.id)
        
      if (tableError) throw tableError
      
      return NextResponse.json({ success: true, message: '结账成功' })
    }
    
    if (action === 'clear') {
        // 强制清台
        await supabaseAdmin
        .from('dining_tables')
        .update({
          status: 'available',
          current_order_id: null
        })
        .eq('id', table.id)
        
        return NextResponse.json({ success: true, message: '清台成功' })
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 })

  } catch (error) {
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    )
  }
}
