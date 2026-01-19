import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { z } from 'zod'

const createReviewSchema = z.object({
  dishId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  content: z.string().max(500),
  images: z.array(z.string().url()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const body = await request.json()
    const validatedData = createReviewSchema.parse(body)

    // Fetch user info for denormalization (optional but good for performance)
    const { data: userInfo } = await supabaseAdmin
      .from('users')
      .select('nickname, avatar')
      .eq('id', user.userId)
      .single()

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        user_id: user.userId,
        dish_id: validatedData.dishId,
        rating: validatedData.rating,
        content: validatedData.content,
        images: validatedData.images,
        user_nickname: userInfo?.nickname,
        user_avatar: userInfo?.avatar
      })
      .select()
      .single()

    if (error) {
        // Check for unique constraint violation (one review per dish per user)
        if (error.code === '23505') {
            throw new Error('您已经评价过该菜品')
        }
        throw error
    }

    return successResponse(data, '评价成功')
  } catch (error) {
    return errorResponse(error)
  }
}
