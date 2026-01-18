'use client'

import { useEffect, useState } from 'react'
import { Eye, CheckCircle, XCircle } from 'lucide-react'
import type { Order } from '@/lib/types'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [orderMode, setOrderMode] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [status, orderMode])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (orderMode) params.append('orderMode', orderMode)

      const response = await fetch(`/api/orders?${params}`)
      const result = await response.json()
      if (result.success) {
        setOrders(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const result = await response.json()
      if (result.success) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Failed to update order:', error)
    }
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
    paid: { label: '已支付', color: 'bg-blue-100 text-blue-700' },
    completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
  }

  const orderModeMap: Record<string, string> = {
    dine_in: '堂食',
    delivery: '外卖',
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">订单管理</h1>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              订单状态
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="paid">已支付</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              订单模式
            </label>
            <select
              value={orderMode}
              onChange={(e) => setOrderMode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部模式</option>
              <option value="dine_in">堂食</option>
              <option value="delivery">外卖</option>
            </select>
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  订单号: {order.order_id}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  下单时间: {format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss')}
                </p>
                <p className="text-sm text-gray-600">
                  用户: {order.user_nickname || '未知'}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    statusMap[order.status]?.color || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {statusMap[order.status]?.label || order.status}
                </span>
                {order.order_mode && (
                  <p className="text-sm text-gray-600 mt-2">
                    {orderModeMap[order.order_mode]}
                    {order.table_number && ` - 桌号: ${order.table_number}`}
                  </p>
                )}
              </div>
            </div>

            {/* 订单项 */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">订单详情</h4>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name} x {item.quantity}
                      {item.portionName && (
                        <span className="text-gray-500 ml-2">({item.portionName})</span>
                      )}
                    </span>
                    <span className="text-gray-700">¥{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 金额信息 */}
            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">原价</span>
                <span className="text-gray-700">¥{order.total_amount.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">优惠</span>
                  <span className="text-red-600">-¥{order.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold">
                <span className="text-gray-800">实付金额</span>
                <span className="text-primary-600">¥{order.final_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* 操作按钮 */}
            {order.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus(order.id, 'paid')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  确认支付
                </button>
                <button
                  onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  取消订单
                </button>
              </div>
            )}
            {order.status === 'paid' && (
              <button
                onClick={() => handleUpdateStatus(order.id, 'completed')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                完成订单
              </button>
            )}
          </div>
        ))}

        {orders.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
            暂无订单数据
          </div>
        )}
      </div>
    </div>
  )
}
