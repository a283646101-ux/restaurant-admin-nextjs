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

    // Increment helpful count using RPC or direct update
    // Simple implementation: fetch, increment, update
    // Better implementation: RPC call "increment_review_helpful"
    
    // Using direct update for now (not atomic but simple)
    const { data: review, error: fetchError } = await supabaseAdmin
      .from('reviews')
      .select('helpful_count')
      .eq('id', id)
      .single()

    if (fetchError || !review) {
      throw new Error('评论不存在')
    }

    const newCount = (review.helpful_count || 0) + 1

    const { error: updateError } = await supabaseAdmin
      .from('reviews')
      .update({ helpful_count: newCount })
      .eq('id', id)

    if (updateError) throw updateError

    return successResponse({ helpful_count: newCount })
  } catch (error) {
    return errorResponse(error)
  }
}
