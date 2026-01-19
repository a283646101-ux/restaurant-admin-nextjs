import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { successResponse, errorResponse } from '@/lib/utils'
import { z } from 'zod'

const updateAddressSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(11).optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  detail: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult
    const { id } = params

    const body = await request.json()
    const validatedData = updateAddressSchema.parse(body)

    // Verify ownership
    const { data: address, error: fetchError } = await supabaseAdmin
      .from('addresses')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.userId)
      .single()

    if (fetchError || !address) {
      throw new Error('地址不存在')
    }

    // If setting as default, unset others
    if (validatedData.isDefault) {
      await supabaseAdmin
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.userId)
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update({
        name: validatedData.name,
        phone: validatedData.phone,
        province: validatedData.province,
        city: validatedData.city,
        district: validatedData.district,
        detail: validatedData.detail,
        is_default: validatedData.isDefault,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return successResponse(data, '地址更新成功')
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult
    const { id } = params

    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.userId)

    if (error) throw error

    return successResponse(null, '地址删除成功')
  } catch (error) {
    return errorResponse(error)
  }
}
