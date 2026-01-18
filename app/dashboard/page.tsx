'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react'

interface Analytics {
  todayRevenue: number
  todayOrderCount: number
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
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
    return <div className="text-center py-12">加载中...</div>
  }

  const stats = [
    {
      title: '今日营收',
      value: `¥${analytics?.todayRevenue.toFixed(2) || 0}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: '今日订单',
      value: analytics?.todayOrderCount || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: '总用户数',
      value: analytics?.totalUsers || 0,
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: '待处理订单',
      value: analytics?.pendingOrders || 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">仪表板</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 总览信息 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">营收概览</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">总营收</span>
              <span className="text-2xl font-bold text-primary-600">
                ¥{analytics?.totalRevenue.toFixed(2) || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">总订单数</span>
              <span className="text-xl font-semibold text-gray-800">
                {analytics?.totalOrders || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">平均订单金额</span>
              <span className="text-xl font-semibold text-gray-800">
                ¥{analytics?.totalOrders ? (analytics.totalRevenue / analytics.totalOrders).toFixed(2) : 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">快速操作</h2>
          <div className="space-y-3">
            <button className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors">
              查看待处理订单
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors">
              添加新菜品
            </button>
            <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors">
              查看用户反馈
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
