'use client'

import { useEffect, useState, useCallback } from 'react'
import { Eye, CheckCircle, XCircle, Utensils, Clock, ArrowRight, Loader2 } from 'lucide-react'
import type { Order } from '@/lib/types'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [orderMode, setOrderMode] = useState('')

  const fetchOrders = useCallback(async () => {
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
  }, [status, orderMode])

  useEffect(() => {
    fetchOrders()

    // Realtime Subscription
    const channel = supabase
      .channel('realtime-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime update:', payload)
          fetchOrders() // Refresh list on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchOrders])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))

      const response = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const result = await response.json()
      if (!result.success) {
        // Revert on failure
        fetchOrders()
      }
    } catch (error) {
      console.error('Failed to update order:', error)
      fetchOrders()
    }
  }

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '待支付', color: 'text-orange-600', bg: 'bg-orange-50' },
    paid: { label: '已支付', color: 'text-blue-600', bg: 'bg-blue-50' },
    preparing: { label: '制作中', color: 'text-purple-600', bg: 'bg-purple-50' },
    completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-50' },
    cancelled: { label: '已取消', color: 'text-gray-600', bg: 'bg-gray-50' },
  }

  const orderModeMap: Record<string, string> = {
    dine_in: '堂食',
    delivery: '外卖',
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
          <p className="text-sm text-gray-500 mt-1">实时监控并处理店铺订单</p>
        </div>
        
        {/* Filters */}
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="preparing">制作中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          <select
            value={orderMode}
            onChange={(e) => setOrderMode(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部模式</option>
            <option value="dine_in">堂食</option>
            <option value="delivery">外卖</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">订单信息</th>
                <th className="px-6 py-4 font-semibold text-gray-700">用户</th>
                <th className="px-6 py-4 font-semibold text-gray-700">金额</th>
                <th className="px-6 py-4 font-semibold text-gray-700">状态</th>
                <th className="px-6 py-4 font-semibold text-gray-700 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">#{order.order_id}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {format(new Date(order.created_at), 'MM-dd HH:mm')}
                      </span>
                      <div className="flex gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                          {orderModeMap[order.order_mode]}
                        </span>
                        {order.table_number && (
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-xs">
                            {order.table_number}号桌
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-gray-700">{order.user_nickname || '匿名用户'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">¥{order.final_amount.toFixed(2)}</span>
                      <span className="text-xs text-gray-400 line-through">¥{order.total_amount.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusMap[order.status]?.bg || 'bg-gray-100'
                    } ${
                      statusMap[order.status]?.color || 'text-gray-800'
                    }`}>
                      {statusMap[order.status]?.label || order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {order.status === 'paid' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          接单
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          出餐
                        </button>
                      )}
                      <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {orders.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>暂无符合条件的订单</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
