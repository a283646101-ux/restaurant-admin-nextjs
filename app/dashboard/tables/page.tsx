'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Clock, Coffee, Loader2 } from 'lucide-react'
import { TableDetailModal } from '@/components/admin/TableDetailModal'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

interface Table {
  id: string
  code: string
  capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  current_order_id: string | null
  current_order?: {
    total_amount: number
    created_at: string
    items: any[]
  }
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables')
      const json = await res.json()
      if (json.success) {
        setTables(json.data)
      }
    } catch (err) {
      console.error(err)
      toast.error('获取桌台数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTables()

    // Realtime subscription
    const channel = supabase
      .channel('realtime-tables')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dining_tables' },
        () => {
          fetchTables()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleCreateTable = async () => {
    const code = prompt('请输入新桌号 (例如: A01)')
    if (!code) return

    const capacity = prompt('请输入座位数', '4')
    if (!capacity) return

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, capacity: parseInt(capacity) })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('创建成功')
        fetchTables()
      } else {
        toast.error(json.error || '创建失败')
      }
    } catch (err) {
      toast.error('请求失败')
    }
  }

  const handleTableClick = (table: Table) => {
    setSelectedTable(table)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">桌台管理</h1>
          <p className="text-sm text-gray-500 mt-1">实时监控桌台状态，点击桌台进行点餐或结账</p>
        </div>
        <button
          onClick={handleCreateTable}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          新增桌台
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table) => {
          const isOccupied = table.status === 'occupied'
          const duration = isOccupied && table.current_order?.created_at 
            ? formatDistanceToNow(new Date(table.current_order.created_at), { locale: zhCN, addSuffix: false })
            : null

          return (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md text-left h-32 flex flex-col justify-between group ${
                isOccupied
                  ? 'bg-red-50 border-red-200 hover:border-red-300'
                  : 'bg-white border-gray-100 hover:border-blue-300'
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <span className={`text-lg font-bold ${isOccupied ? 'text-red-700' : 'text-gray-800'}`}>
                  {table.code}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isOccupied ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {isOccupied ? '占用' : '空闲'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>{table.capacity}人桌</span>
                </div>
                
                {isOccupied && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>已用 {duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-red-600 font-bold">
                      <Coffee className="w-3 h-3" />
                      <span>¥{table.current_order?.total_amount || 0}</span>
                    </div>
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selectedTable && (
        <TableDetailModal
          table={selectedTable}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdate={() => {
            fetchTables()
            // Refresh selected table data if still open
            // In a real app, you might want to fetch single table data here
          }}
        />
      )}
    </div>
  )
}
