import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult
    const { id } = params // group_order id (UUID)

    // 1. Fetch group order
    const { data: groupOrder, error: fetchError } = await supabaseAdmin
      .from('group_orders')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !groupOrder) {
      throw new Error('拼团订单不存在')
    }

    if (groupOrder.status !== 'pending') {
      throw new Error('拼团已结束或已失效')
    }

    if (new Date(groupOrder.expire_time) < new Date()) {
      throw new Error('拼团已过期')
    }

    if (groupOrder.current_size >= groupOrder.required_size) {
      throw new Error('拼团已满员')
    }

    // 2. Check if user already joined
    const members = groupOrder.members as any[]
    if (members.some(m => m.userId === user.userId)) {
      throw new Error('您已参与该拼团')
    }

    // 3. Add member
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('nickname, avatar')
      .eq('id', user.userId)
      .single()

    const newMember = {
      userId: user.userId,
      nickname: userInfo?.nickname,
      avatar: userInfo?.avatar,
      joinTime: new Date().toISOString(),
      payStatus: 'paid'
    }

    const updatedMembers = [...members, newMember]
    const newSize = groupOrder.current_size + 1
    let newStatus = 'pending'
    
    if (newSize >= groupOrder.required_size) {
        newStatus = 'success'
        // Trigger success logic (create orders for all members, etc.) - Simplified here
        await supabaseAdmin.rpc('increment_activity_success_groups', { activity_id: groupOrder.activity_id })
    }

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('group_orders')
      .update({
        members: updatedMembers,
        current_size: newSize,
        status: newStatus
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return successResponse(updatedOrder, '参团成功')
  } catch (error) {
    return errorResponse(error)
  }
}
