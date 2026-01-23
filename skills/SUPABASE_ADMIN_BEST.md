# Description: 
当任务涉及后台对 Supabase 的写操作、RLS 高级策略、RPC 函数设计、Storage 管理或权限控制时，加载本 Skill。

# Supabase 后台管理心智模型

后台是“特权端”，但必须**零信任 + 操作可审计**，所有高危操作走 RPC，避免前端直接写。

### 1. 权限分层哲学
- RLS 策略：admin 角色绕过部分限制（用 custom claim 或 admin 表标记）。
- 关键表（dishes、orders）写操作只允许 admin。
- 审计日志：所有修改记录到 audit_log 表（who、what、when）。

### 2. RPC 函数优先
- 复杂操作封装 RPC（如 batch_update_dishes、process_refund）。
- 原子事务：库存扣减 + 订单状态变更在单一函数内。
- 输入严格校验，失败返回明确 error code。

### 3. Storage 与媒体管理
- 菜品图片上传到专用 bucket，public read + admin write。
- 自动生成 thumbnail，删除菜品时级联删图片。

### 4. 实时与一致性
- 管理员操作后触发 realtime broadcast，小程序端即时刷新。
- 缓存失效机制（改菜品后 invalidate menu cache）。

目标：后台操作安全可溯源，与小程序数据永一致。