'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit, Trash2, X, Upload, Minus, AlertTriangle, Loader2, Image as ImageIcon } from 'lucide-react'
import type { Dish, DishSpec, Nutrition } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  
  // 添加/编辑表单状态
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    category: string
    price: string
    stock: string
    description: string
    image: string
    status: string
    spicy: boolean
    healthy: boolean
    specs: DishSpec[]
    nutrition: Nutrition
  }>({
    name: '',
    category: 'main',
    price: '',
    stock: '',
    description: '',
    image: '',
    status: 'on_sale',
    spicy: false,
    healthy: false,
    specs: [],
    nutrition: {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0
    }
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchDishes = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (status) params.append('status', status)

      const response = await fetch(`/api/dishes?${params}`)
      const result = await response.json()
      if (result.success) {
        setDishes(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch dishes:', error)
    } finally {
      setLoading(false)
    }
  }, [category, status])

  useEffect(() => {
    fetchDishes()

    // Realtime Subscription
    const channel = supabase
      .channel('realtime-dishes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dishes' },
        () => {
          fetchDishes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchDishes])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个菜品吗？')) return

    try {
      const response = await fetch(`/api/dishes/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        fetchDishes()
      }
    } catch (error) {
      console.error('Failed to delete dish:', error)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'on_sale' ? 'off_sale' : 'on_sale'
    
    // Optimistic update
    setDishes(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))

    try {
      const response = await fetch(`/api/dishes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) fetchDishes() // Revert on error
    } catch (error) {
      console.error('Failed to toggle status:', error)
      fetchDishes()
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked
        setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
        setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleNutritionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        [name]: parseFloat(value) || 0
      }
    }))
  }

  // 规格管理
  const addSpec = () => {
    setFormData(prev => ({
      ...prev,
      specs: [...prev.specs, { name: '', price: 0 }]
    }))
  }

  const removeSpec = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index)
    }))
  }

  const updateSpec = (index: number, field: keyof DishSpec, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      specs: prev.specs.map((spec, i) => {
        if (i === index) {
          return { ...spec, [field]: value }
        }
        return spec
      })
    }))
  }

  // 图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const result = await response.json()
      if (result.success) {
        setFormData(prev => ({ ...prev, image: result.url }))
      } else {
        alert('上传失败: ' + result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('上传出错')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // 转换数据类型
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      }

      const response = await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })
      
      const result = await response.json()
      if (result.success) {
        setIsModalOpen(false)
        setFormData({
            name: '',
            category: 'main',
            price: '',
            stock: '',
            description: '',
            image: '',
            status: 'on_sale',
            spicy: false,
            healthy: false,
            specs: [],
            nutrition: {
              calories: 0,
              protein: 0,
              fat: 0,
              carbs: 0
            }
        })
        fetchDishes()
      } else {
        alert(result.error || '添加失败')
      }
    } catch (error) {
      console.error('Failed to add dish:', error)
      alert('添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryMap: Record<string, string> = {
    main: '主食',
    drink: '饮品',
    combo: '套餐',
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">菜品管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理菜单、价格及库存</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          添加菜品
        </button>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 max-w-xs">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100"
            >
              <option value="">全部分类</option>
              <option value="main">主食</option>
              <option value="drink">饮品</option>
              <option value="combo">套餐</option>
            </select>
          </div>
          <div className="flex-1 max-w-xs">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-100"
            >
              <option value="">全部状态</option>
              <option value="on_sale">在售</option>
              <option value="off_sale">停售</option>
            </select>
          </div>
        </div>
      </div>

      {/* 菜品列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-700">菜品</th>
              <th className="px-6 py-4 font-semibold text-gray-700">分类</th>
              <th className="px-6 py-4 font-semibold text-gray-700">价格</th>
              <th className="px-6 py-4 font-semibold text-gray-700">库存</th>
              <th className="px-6 py-4 font-semibold text-gray-700">状态</th>
              <th className="px-6 py-4 font-semibold text-gray-700 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dishes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  暂无菜品数据
                </td>
              </tr>
            ) : (
              dishes.map((dish) => (
                <tr key={dish.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                        {dish.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={dish.image} 
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{dish.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">销量: {dish.sales}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {categoryMap[dish.category] || dish.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ¥{Number(dish.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 ${
                      dish.stock < 10 ? 'text-red-600 font-medium' : 'text-gray-600'
                    }`}>
                      {dish.stock < 10 && <AlertTriangle className="w-3.5 h-3.5" />}
                      {dish.stock}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(dish.id, dish.status)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        dish.status === 'on_sale' ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          dish.status === 'on_sale' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="ml-2 text-xs text-gray-500">
                      {dish.status === 'on_sale' ? '在售' : '停售'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(dish.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 添加菜品弹窗 (保持原有逻辑，仅优化样式) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">添加新菜品</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* 基本信息 */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">基本信息</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">菜品名称</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        placeholder="请输入菜品名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white"
                      >
                        <option value="main">主食</option>
                        <option value="drink">饮品</option>
                        <option value="combo">套餐</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">价格</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">库存</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* 菜品详情 */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">详情与图片</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                        placeholder="请输入菜品描述..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">图片</label>
                      <div className="flex items-start gap-4">
                        {formData.image && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <label className="flex-1 flex flex-col items-center justify-center h-24 border-2 border-gray-200 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all">
                          <div className="flex flex-col items-center justify-center pt-2 pb-3">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <p className="text-xs text-gray-500">
                              {uploading ? '上传中...' : '点击上传图片'}
                            </p>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100"
                  >
                    {submitting ? '处理中...' : '确认添加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
