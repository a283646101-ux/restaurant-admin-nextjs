## 专属触发 Skill（新增 - 严格#调用模式）

这些 Skill 设计为**极度专属**，只有当用户提示中明确出现 `#SKILL_NAME` 时才会激活。

13. **#PAYMENT_INTEGRATION**  
    用途：微信支付/支付宝对接、支付回调、安全验证

14. **#USER_AUTH_MANAGEMENT**  
    用途：用户登录、微信授权、权限角色、隐私合规

15. **#MULTI_STORE_SUPPORT**  
    用途：多门店架构、门店切换、数据隔离

16. **#SEARCH_RECOMMENDATION**  
    用途：菜品搜索、个性化推荐、热销排序

17. **#ERROR_LOGGING_MONITOR**  
    用途：错误处理、日志埋点、异常监控、用户反馈

使用方式（必须严格遵守）：
- 在 Agent 提示中写： “#PAYMENT_INTEGRATION 帮我设计支付流程”
- 多个时： “#PAYMENT_INTEGRATION #USER_AUTH_MANAGEMENT 一起优化登录后支付”
- 不写#就不会触发，确保 Token 不浪费。