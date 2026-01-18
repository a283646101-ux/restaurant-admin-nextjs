import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: '缺少微信登录 code' }, { status: 400 })
    }
    
    // 1. 调用微信 API 换取 openid
    const wxResponse = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?` +
      `appid=${process.env.WECHAT_APPID}&` +
      `secret=${process.env.WECHAT_SECRET}&` +
      `js_code=${code}&` +
      `grant_type=authorization_code`
    )
    
    const wxData = await wxResponse.json()
    
    if (wxData.errcode) {
      console.error('微信登录失败:', wxData)
      return NextResponse.json(
        { error: `微信登录失败: ${wxData.errmsg}` },
        { status: 400 }
      )
    }
    
    const { openid } = wxData
    
    // 2. 查询或创建用户
    let { data: user, error: queryError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single()
    
    if (queryError && queryError.code !== 'PGRST116') {
      throw queryError
    }
    
    // 如果用户不存在，创建新用户
    if (!user) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          openid,
          nickname: '新用户',
          avatar: '',
          points: 0,
          level: 'bronze',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) throw createError
      user = newUser
    }
    
    // 3. 生成 JWT token
    const token = jwt.sign(
      { userId: user.id, openid: user.openid },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )
    
    // 4. 返回结果
    return NextResponse.json({
      token,
      userInfo: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        points: user.points,
        memberLevel: user.level
      },
      expiresIn: 7 * 24 * 60 * 60
    })
    
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json({ error: (error as Error).message || '登录失败' }, { status: 500 })
  }
}
