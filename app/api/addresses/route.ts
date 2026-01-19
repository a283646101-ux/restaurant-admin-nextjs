import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// GET - 获取地址列表
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', user.userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return successResponse(data)
  } catch (error) {
    return errorResponse(error)
  }
}

// POST - 创建地址
const addressSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(11),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  detail: z.string().min(1),
  isDefault: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const body = await request.json()
    const validatedData = addressSchema.parse(body)

    // If default, unset other defaults
    if (validatedData.isDefault) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.userId)
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert({
        user_id: user.userId,
        name: validatedData.name,
        phone: validatedData.phone,
        province: validatedData.province,
        city: validatedData.city,
        district: validatedData.district,
        detail: validatedData.detail,
        is_default: validatedData.isDefault || false,
      })
      .select()
      .single()

    if (error) throw error

    return successResponse(data, '地址添加成功')
  } catch (error) {
    return errorResponse(error)
  }
}
