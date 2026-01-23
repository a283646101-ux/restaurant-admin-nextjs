# Description: 
【严格专属触发】只有当用户提示中明确包含 #USER_AUTH_MANAGEMENT 时，才加载本 Skill。否则完全忽略。

# 用户认证与权限心智模型

用户体系必须**微信原生 + 隐私最小化 + 角色清晰**。

### 1. 登录流程哲学
- 微信一键登录（uni.login + wx.getUserInfo → Supabase auth.signInWithOAuth 或自定义 JWT）。
- 未登录允许浏览/加购，支付/下单强制登录。
- openid 作为唯一标识，关联 Supabase users 表。

### 2. 权限角色设计
- 角色：customer（默认）、admin（后台专用）、staff（可选门店员工）。
- Supabase RLS + custom claims 实现角色判断。
- 后台登录加额外验证（手机号/密码或邀请码）。

### 3. 隐私与数据管理
- 只收集必要信息（openid、昵称、头像、收餐地址）。
- 地址支持多次保存 + 默认选择。
- 符合 GDPR/中国个保法：可查看/删除个人数据入口。

### 4. 体验优化
- 静默登录 + 授权弹窗最小化。
- 登出后购物车本地保留，重新登录自动合并。

目标：登录摩擦 < 3秒，权限零越界。