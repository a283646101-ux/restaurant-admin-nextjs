import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, email, password } = body
    
    // 场景 1: 微信小程序登录 (带 code)
    if (code) {
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
        { userId: user.id, openid: user.openid, role: 'user' },
        process.env.JWT_SECRET!,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
      )
      
      return NextResponse.json({
        token,
        userInfo: {
          id: user.id,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar,
          points: user.points,
          memberLevel: user.level,
          role: 'user'
        },
        expiresIn: 7 * 24 * 60 * 60
      })
    } 
    
    // 场景 2: 后台管理系统登录 (带 email 和 password)
    else if (email && password) {
      // 1. 查询管理员用户
      // 假设有一个 admins 表，或者 users 表中有 role 字段
      // 这里我们先尝试查询 admins 表
      let { data: admin, error: queryError } = await supabaseAdmin
        .from('admins')
        .select('*')
        .eq('email', email)
        .single()

      if (queryError || !admin) {
        // 如果 admins 表没有，尝试从 users 表查询 (兼容易用性)
         return NextResponse.json(
          { error: '账号或密码错误' }, 
          { status: 401 }
        )
      }

      // 2. 验证密码
      // 兼容多种可能的密码字段名
      const dbPassword = admin.password || admin.password_hash || admin.pwd || admin.password_str

      // 调试日志：打印详细的字段信息（用于 Vercel 后台排查）
      console.log('Admin login attempt details:', { 
        inputEmail: email, 
        dbEmail: admin.email,
        adminId: admin.id,
        hasDbPassword: !!dbPassword,
        availableKeys: Object.keys(admin),
        status: admin.status
      })

      if (!dbPassword) {
         console.error('Login failed: No password field found in database record', { email })
         return NextResponse.json(
          { error: '账号配置错误：未找到密码字段' }, 
          { status: 401 }
        )
      }

      // 验证 BCrypt 哈希
      const isPasswordValid = await bcrypt.compare(password, dbPassword)
      
      console.log('Password validation result:', { isPasswordValid })

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: '账号或密码错误' }, 
          { status: 401 }
        )
      }

      // 3. 生成 JWT token
      // 确保 process.env.JWT_SECRET 存在
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET not configured')
        return NextResponse.json(
          { error: '服务器配置错误：JWT_SECRET 未设置' },
          { status: 500 }
        )
      }

      const token = jwt.sign(
        { userId: admin.id, email: admin.email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      )

      return NextResponse.json({
        token,
        userInfo: {
          id: admin.id,
          email: admin.email,
          role: 'admin',
          nickname: admin.nickname || admin.name || '管理员'
        }
      })
    }
    
    // 既没有 code 也没有 email/password
    else {
      return NextResponse.json(
        { error: '缺少登录凭证' },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json({ error: (error as Error).message || '登录失败' }, { status: 500 })
  }
}
