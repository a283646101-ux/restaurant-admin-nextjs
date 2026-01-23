import { Sidebar } from '@/components/admin/Sidebar'
import { Header } from '@/components/admin/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 侧边栏 (Fixed) */}
      <Sidebar />

      {/* 右侧主区域 */}
      <div className="ml-64 min-h-screen flex flex-col">
        {/* 顶部导航栏 (Sticky) */}
        <Header />

        {/* 页面内容区 */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
