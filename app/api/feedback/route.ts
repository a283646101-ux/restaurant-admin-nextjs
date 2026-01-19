import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createFeedbackSchema = z.object({
  type: z.enum(['suggestion', 'complaint', 'praise', 'other']),
  content: z.string().min(1).max(1000),
  isPublic: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const body = await request.json()
    const validatedData = createFeedbackSchema.parse(body)

    // Fetch user nickname for denormalization
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('nickname')
      .eq('id', user.userId)
      .single()

    const { data, error } = await supabaseAdmin
      .from('feedback')
      .insert({
        user_id: user.userId,
        nickname: userInfo?.nickname,
        type: validatedData.type,
        content: validatedData.content,
        is_public: validatedData.isPublic,
      })
      .select()
      .single()

    if (error) throw error

    return successResponse(data, '反馈提交成功')
  } catch (error) {
    return errorResponse(error)
  }
}
