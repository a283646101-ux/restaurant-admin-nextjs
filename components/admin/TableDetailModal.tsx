'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Minus, Trash2, CreditCard, Search, Utensils } from 'lucide-react'
import type { Dish, Order } from '@/lib/types'
import { toast } from 'sonner'

interface TableDetailModalProps {
  table: any
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function TableDetailModal({ table, isOpen, onClose, onUpdate }: TableDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'order' | 'add_dish'>('order')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [category, setCategory] = useState('')
  const [selectedDishes, setSelectedDishes] = useState<{ dish: Dish; quantity: number }[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Fetch dishes for "Add Dish" tab
  useEffect(() => {
    if (isOpen && activeTab === 'add_dish' && dishes.length === 0) {
      // Internal function to fetch dishes
      const loadDishes = async () => {
        setLoading(true)
        try {
          const params = new URLSearchParams()
          params.append('status', 'on_sale')
          if (category) params.append('category', category)
          
          const res = await fetch(`/api/dishes?${params}`)
          const json = await res.json()
          if (json.success) setDishes(json.data)
        } catch (err) {
          console.error(err)
        } finally {
          setLoading(false)
        }
      }
      loadDishes()
    }
  }, [isOpen, activeTab, category, dishes.length]) // Added dependencies

  // Reset selected dishes when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDishes([])
      setActiveTab('order')
    }
  }, [isOpen])

      // Remove fetchDishes since it's now inside useEffect
  // const fetchDishes = async () => { ... }

  const handleSelectDish = (dish: Dish) => {
    setSelectedDishes(prev => {
      const existing = prev.find(p => p.dish.id === dish.id)
      if (existing) {
        return prev.map(p => p.dish.id === dish.id ? { ...p, quantity: p.quantity + 1 } : p)
      }
      return [...prev, { dish, quantity: 1 }]
    })
  }

  const handleUpdateQuantity = (dishId: string, delta: number) => {
    setSelectedDishes(prev => {
      return prev.map(p => {
        if (p.dish.id === dishId) {
          const newQty = p.quantity + delta
          return newQty > 0 ? { ...p, quantity: newQty } : p
        }
        return p
      })
    })
  }

  const handleRemoveSelected = (dishId: string) => {
    setSelectedDishes(prev => prev.filter(p => p.dish.id !== dishId))
  }

  const handleSubmitOrder = async () => {
    if (selectedDishes.length === 0) return
    setProcessing(true)
    try {
      const items = selectedDishes.map(sd => ({
        dishId: sd.dish.id,
        name: sd.dish.name,
        price: Number(sd.dish.price),
        quantity: sd.quantity,
        image: sd.dish.image
      }))

      const res = await fetch(`/api/tables/${table.id}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_order',
          items: items
        })
      })
      
      const json = await res.json()
      if (json.success) {
        toast.success('下单成功')
        setSelectedDishes([])
        setActiveTab('order')
        onUpdate()
      } else {
        toast.error(json.error || '下单失败')
      }
    } catch (err) {
      toast.error('请求失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleCheckout = async () => {
    if (!confirm(`确定要对 ${table.code} 号桌进行结账吗？总金额: ¥${table.current_order?.final_amount || 0}`)) return
    
    setProcessing(true)
    try {
      const res = await fetch(`/api/tables/${table.id}/order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' })
      })
      
      const json = await res.json()
      if (json.success) {
        toast.success('结账成功，桌台已释放')
        onUpdate()
        onClose()
      } else {
        toast.error(json.error || '结账失败')
      }
    } catch (err) {
      toast.error('请求失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleClearTable = async () => {
    if (!confirm('确定要强制清台吗？这将清除当前订单状态。')) return
    
    setProcessing(true)
    try {
      const res = await fetch(`/api/tables/${table.id}/order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      })
      
      const json = await res.json()
      if (json.success) {
        toast.success('清台成功')
        onUpdate()
        onClose()
      } else {
        toast.error(json.error || '清台失败')
      }
    } catch (err) {
      toast.error('请求失败')
    } finally {
      setProcessing(false)
    }
  }

  if (!isOpen || !table) return null

  const currentOrderItems = table.current_order?.items || []
  const totalAmount = table.current_order?.final_amount || 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{table.code} 号桌</h2>
            <p className="text-sm text-gray-500 mt-1">
              {table.status === 'available' ? '空闲中' : `订单号: ${table.current_order?.order_id || '---'}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('order')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'order' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            当前订单 ({currentOrderItems.length})
          </button>
          <button
            onClick={() => setActiveTab('add_dish')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === 'add_dish' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            加菜 / 开台
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'order' && (
            <div className="space-y-6">
              {currentOrderItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Utensils className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p>当前暂无菜品，请先去“加菜”</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentOrderItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">¥{item.price}</p>
                        </div>
                      </div>
                      <div className="font-semibold text-gray-700">x {item.quantity}</div>
                    </div>
                  ))}
                  
                  <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                    <span className="text-gray-600">合计金额</span>
                    <span className="text-3xl font-bold text-gray-900">¥{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'add_dish' && (
            <div className="h-full flex flex-col">
              {/* Category Filter */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {['', 'main', 'drink', 'combo'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                      category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat === '' ? '全部' : cat === 'main' ? '主食' : cat === 'drink' ? '饮品' : '套餐'}
                  </button>
                ))}
              </div>

              {/* Dish List */}
              <div className="flex-1 overflow-y-auto min-h-[300px] grid grid-cols-2 gap-4 mb-6">
                {loading ? (
                  <div className="col-span-2 text-center py-8">加载中...</div>
                ) : (
                  dishes.map(dish => (
                    <button
                      key={dish.id}
                      onClick={() => handleSelectDish(dish)}
                      className="text-left p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all flex flex-col gap-2"
                    >
                      {dish.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={dish.image} alt={dish.name} className="w-full h-24 object-cover rounded-lg" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 truncate">{dish.name}</p>
                        <p className="text-blue-600 font-semibold">¥{Number(dish.price)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Selected Items Summary */}
              {selectedDishes.length > 0 && (
                <div className="border-t border-gray-100 pt-4 bg-blue-50 -mx-6 px-6 py-4 mt-auto">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">已选菜品 ({selectedDishes.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                    {selectedDishes.map((sd, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg">
                        <span className="text-sm text-gray-800">{sd.dish.name}</span>
                        <div className="flex items-center gap-3">
                          <button onClick={() => handleUpdateQuantity(sd.dish.id, -1)} className="p-1 hover:bg-gray-100 rounded">
                            <Minus className="w-4 h-4 text-gray-500" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{sd.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(sd.dish.id, 1)} className="p-1 hover:bg-gray-100 rounded">
                            <Plus className="w-4 h-4 text-gray-500" />
                          </button>
                          <button onClick={() => handleRemoveSelected(sd.dish.id)} className="ml-2 text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={processing}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200"
                  >
                    {processing ? '提交中...' : `确认下单 (¥${selectedDishes.reduce((sum, sd) => sum + Number(sd.dish.price) * sd.quantity, 0)})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions (Only for Order Tab) */}
        {activeTab === 'order' && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
             {table.status !== 'available' ? (
                <>
                  <button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100 font-bold"
                  >
                    <CreditCard className="w-5 h-5" />
                    结账 (¥{totalAmount.toFixed(2)})
                  </button>
                  <button
                    onClick={handleClearTable}
                    disabled={processing}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    清台
                  </button>
                </>
             ) : (
               <div className="w-full text-center text-gray-500 py-2">
                 当前为空闲桌台，请切换到“加菜/开台”下单
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  )
}
