'use client'

import { Search, Bell, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()

  // Simple map for page titles
  const getPageTitle = (path: string) => {
    if (path === '/dashboard') return '仪表板'
    if (path.includes('/dashboard/dishes')) return '菜品管理'
    if (path.includes('/dashboard/orders')) return '订单管理'
    if (path.includes('/dashboard/users')) return '用户管理'
    if (path.includes('/dashboard/coupons')) return '优惠券管理'
    if (path.includes('/dashboard/addresses')) return '地址管理'
    if (path.includes('/dashboard/share')) return '分享统计'
    if (path.includes('/dashboard/feedback')) return '反馈管理'
    if (path.includes('/dashboard/settings')) return '系统设置'
    return '后台管理'
  }

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
      {/* Page Title / Breadcrumb */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">{getPageTitle(pathname)}</h2>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="搜索..." 
            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all w-64"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-800">管理员</p>
            <p className="text-xs text-gray-500">Super Admin</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border border-blue-200">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  )
}
