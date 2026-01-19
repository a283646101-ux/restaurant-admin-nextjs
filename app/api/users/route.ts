import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { z } from 'zod'

// GET - 获取用户信息
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.userId)
      .single()

    if (error) throw error

    return successResponse(data)
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH - 更新用户信息
const updateUserSchema = z.object({
  nickname: z.string().optional(),
  avatar: z.string().optional(),
  phone: z.string().optional(),
  birthday: z.string().optional(),
  goal: z.enum(['lose_weight', 'gain_muscle', 'balanced']).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(validatedData)
      .eq('id', user.userId)
      .select()
      .single()

    if (error) throw error

    return successResponse(data)
  } catch (error) {
    return errorResponse(error)
  }
}
