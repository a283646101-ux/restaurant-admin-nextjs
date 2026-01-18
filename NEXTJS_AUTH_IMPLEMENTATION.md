# Next.js 后端认证实现快速指南

这是在 `restaurant-admin-nextjs` 仓库中需要实现的代码。

## 1. 安装依赖

```bash
npm install jsonwebtoken
```

## 2. 配置环境变量 (Vercel)

在 Vercel Dashboard → Settings → Environment Variables 添加：

```env
WECHAT_APPID=你的小程序AppID
WECHAT_SECRET=你的小程序AppSecret
JWT_SECRET=生成一个随机字符串
JWT_EXPIRES_IN=7d
```

## 3. 创建文件结构

```
restaurant-admin-nextjs/
├── app/
│   └── api/
│       └── auth/
│           └── login/
│               └── route.js          # 登录接口
└── lib/
    └── auth.js                        # 认证中间件
```

## 4. 实现代码

### 文件 1: `app/api/auth/login/route.js`

```javascript
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export async function POST(request) {
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
    let { data: user, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('openid', openid)
      .single()
    
    if (queryError && queryError.code !== 'PGRST116') {
      throw queryError
    }
    
    // 如果用户不存在，创建新用户
    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          openid,
          nickname: '新用户',
          avatar: '',
          points: 0,
          member_level: 'bronze',
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
      process.env.JWT_SECRET,
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
        memberLevel: user.member_level
      },
      expiresIn: 7 * 24 * 60 * 60
    })
    
  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json({ error: error.message || '登录失败' }, { status: 500 })
  }
}
```

### 文件 2: `lib/auth.js`

```javascript
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

export function verifyToken(request) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded
  } catch (error) {
    console.error('Token 验证失败:', error.message)
    return null
  }
}

export function requireAuth(request) {
  const user = verifyToken(request)
  
  if (!user) {
    return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
  }
  
  return user
}
```

### 文件 3: 更新现有 API 路由 (示例: `app/api/orders/route.js`)

```javascript
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export async function GET(request) {
  // 添加认证检查
  const authResult = requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const user = authResult
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.userId)  // 使用认证的用户ID
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  const authResult = requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  const user = authResult
  const orderData = await request.json()
  
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...orderData,
        user_id: user.userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

## 5. 生成 JWT_SECRET

在终端运行：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制输出的字符串作为 JWT_SECRET

## 6. 获取微信小程序配置

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 开发 → 开发管理 → 开发设置
3. 复制 AppID 和 AppSecret

## 7. 部署到 Vercel

```bash
git add .
git commit -m "Add authentication"
git push origin main
```

Vercel 会自动部署。

## 8. 测试

部署完成后，在小程序中测试：

1. 重新编译小程序
2. 查看控制台日志
3. 应该看到 "✅ 登录成功，token 已保存"

## 需要保护的 API 路由

以下路由需要添加 `requireAuth()`:

- ✅ `/api/orders` - 订单相关
- ✅ `/api/users` - 用户信息更新
- ✅ `/api/coupons` - 用户优惠券
- ✅ `/api/group-orders` - 拼团订单
- ❌ `/api/dishes` - 菜品列表 (公开)
- ❌ `/api/group-activities` - 拼团活动 (公开)

## 快速检查清单

- [ ] 安装 jsonwebtoken
- [ ] 配置 Vercel 环境变量
- [ ] 创建 `/api/auth/login/route.js`
- [ ] 创建 `lib/auth.js`
- [ ] 更新需要认证的 API 路由
- [ ] 部署到 Vercel
- [ ] 测试登录流程

---

**小程序端已完成，只需实现后端代码即可！**
