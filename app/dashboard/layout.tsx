import Link from 'next/link'
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  Users, 
  Ticket, 
  MessageSquare,
  Settings,
  LogOut
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const menuItems = [
    { icon: LayoutDashboard, label: '仪表板', href: '/dashboard' },
    { icon: UtensilsCrossed, label: '菜品管理', href: '/dashboard/dishes' },
    { icon: ShoppingCart, label: '订单管理', href: '/dashboard/orders' },
    { icon: Users, label: '用户管理', href: '/dashboard/users' },
    { icon: Ticket, label: '优惠券', href: '/dashboard/coupons' },
    { icon: MessageSquare, label: '反馈管理', href: '/dashboard/feedback' },
    { icon: Settings, label: '系统设置', href: '/dashboard/settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-10">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-primary-600">美满饭馆</h1>
          <p className="text-sm text-gray-600 mt-1">后台管理系统</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full">
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
