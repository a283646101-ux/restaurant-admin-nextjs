'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, ShoppingCart, DollarSign, Loader2 } from 'lucide-react'
import { StatCard } from '@/components/admin/StatCard'
import { RevenueChart } from '@/components/admin/RevenueChart'

interface Analytics {
  todayRevenue: number
  todayOrderCount: number
  totalUsers: number
  pendingOrders: number
  chartData: { date: string; amount: number }[]
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')
      const result = await response.json()
      if (result.success) {
        setAnalytics(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 欢迎语 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">欢迎回来，店长 👋</h1>
        <p className="text-gray-500 mt-1">这里是今天的运营概况</p>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="今日营收"
          value={`¥${analytics?.todayRevenue.toFixed(2) || 0}`}
          change="+12.5%" // 暂时 Mock，后续可后端计算
          trend="up"
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="今日订单"
          value={analytics?.todayOrderCount || 0}
          change="+5"
          trend="up"
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="待处理订单"
          value={analytics?.pendingOrders || 0}
          change={analytics?.pendingOrders ? "需立即处理" : "暂无积压"}
          trend={analytics?.pendingOrders ? "down" : "neutral"}
          icon={TrendingUp}
          color="orange"
        />
        <StatCard
          title="总用户数"
          value={analytics?.totalUsers || 0}
          icon={Users}
          color="purple"
        />
      </div>

      {/* 图表与辅助区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧：营收趋势图 (占 2 列) */}
        <div className="lg:col-span-2">
          <RevenueChart data={analytics?.chartData || []} />
        </div>

        {/* 右侧：快速操作/通知 (占 1 列) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">快捷操作</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-blue-100 shadow-lg font-medium">
                处理新订单
              </button>
              <button className="w-full bg-gray-50 text-gray-700 py-3 rounded-xl hover:bg-gray-100 transition-colors font-medium border border-gray-100">
                发布新菜品
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-lg font-bold mb-2">系统通知</h3>
            <p className="text-blue-100 text-sm mb-4">
              小程序端 v2.0 即将发布，请确保所有菜品图片已更新为高清版本。
            </p>
            <button className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
