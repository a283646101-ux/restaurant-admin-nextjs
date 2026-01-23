'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  Users, 
  Ticket, 
  MessageSquare,
  Settings,
  LogOut,
  MapPin,
  Share2
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs))
}

export function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    { icon: LayoutDashboard, label: '仪表板', href: '/dashboard' },
    { icon: LayoutDashboard, label: '桌台管理', href: '/dashboard/tables' }, // Reusing icon or change to something else
    { icon: UtensilsCrossed, label: '菜品管理', href: '/dashboard/dishes' },
    { icon: ShoppingCart, label: '订单管理', href: '/dashboard/orders' },
    { icon: Users, label: '用户管理', href: '/dashboard/users' },
    { icon: Ticket, label: '优惠券', href: '/dashboard/coupons' },
    { icon: MapPin, label: '地址管理', href: '/dashboard/addresses' },
    { icon: Share2, label: '分享统计', href: '/dashboard/share' },
    { icon: MessageSquare, label: '反馈管理', href: '/dashboard/feedback' },
    { icon: Settings, label: '系统设置', href: '/dashboard/settings' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 z-20 flex flex-col">
      {/* Brand */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">美满饭馆</h1>
            <p className="text-xs text-gray-500">后台管理系统</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-blue-50 text-blue-600 font-medium shadow-sm" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                  )} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={() => {
            // Add logout logic here or link to logout route
            window.location.href = '/login'
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full group"
        >
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  )
}
