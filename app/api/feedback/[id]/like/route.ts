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
    
    const { id } = params

    const { data: feedback, error: fetchError } = await supabaseAdmin
      .from('feedback')
      .select('likes')
      .eq('id', id)
      .single()

    if (fetchError || !feedback) {
      throw new Error('反馈不存在')
    }

    const newLikes = (feedback.likes || 0) + 1

    const { error: updateError } = await supabaseAdmin
      .from('feedback')
      .update({ likes: newLikes })
      .eq('id', id)

    if (updateError) throw updateError

    return successResponse({ likes: newLikes })
  } catch (error) {
    return errorResponse(error)
  }
}
