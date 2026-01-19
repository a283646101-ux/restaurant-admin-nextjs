'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit, Trash2, Search, X, Upload, Minus } from 'lucide-react'
import type { Dish, DishSpec, Nutrition } from '@/lib/types'

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

  const statusMap: Record<string, string> = {
    on_sale: '在售',
    off_sale: '停售',
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">菜品管理</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          添加菜品
        </button>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部分类</option>
              <option value="main">主食</option>
              <option value="drink">饮品</option>
              <option value="combo">套餐</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              状态
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部状态</option>
              <option value="on_sale">在售</option>
              <option value="off_sale">停售</option>
            </select>
          </div>
        </div>
      </div>

      {/* 菜品列表 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">图片</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">名称</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">分类</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">价格</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">库存</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">销量</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">状态</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dishes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  暂无菜品数据
                </td>
              </tr>
            ) : (
              dishes.map((dish) => (
                <tr key={dish.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                      {dish.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={dish.image} 
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          无图
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{dish.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {categoryMap[dish.category] || dish.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-primary-600 font-semibold">
                    ¥{Number(dish.price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{dish.stock}</td>
                  <td className="px-6 py-4 text-gray-600">{dish.sales}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      dish.status === 'on_sale' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {statusMap[dish.status] || dish.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button className="text-gray-400 hover:text-primary-500 transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(dish.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 添加菜品弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">添加新菜品</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 基本信息 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">基本信息</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">菜品名称</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="请输入菜品名称"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="on_sale">在售</option>
                      <option value="off_sale">停售</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 菜品详情 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">菜品详情</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="请输入菜品描述..."
                    />
                  </div>
                  <div className="flex gap-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="spicy"
                        checked={formData.spicy}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
                      />
                      <span className="text-gray-700">辣味</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="healthy"
                        checked={formData.healthy}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 border-gray-300"
                      />
                      <span className="text-gray-700">健康/低脂</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 图片上传 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">图片设置</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">主图上传</label>
                  <div className="flex items-center gap-4">
                    {formData.image && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">
                            {uploading ? '上传中...' : '点击或拖拽上传图片'}
                          </p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 规格设置 */}
              <div>
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">规格设置</h3>
                  <button type="button" onClick={addSpec} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" /> 添加规格
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.specs.map((spec, index) => (
                    <div key={index} className="flex gap-4 items-center">
                      <input
                        type="text"
                        placeholder="规格名称 (如: 大碗)"
                        value={spec.name}
                        onChange={(e) => updateSpec(index, 'name', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="价格调整 (如: 2.0)"
                        value={spec.price}
                        onChange={(e) => updateSpec(index, 'price', parseFloat(e.target.value))}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpec(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {formData.specs.length === 0 && (
                    <p className="text-sm text-gray-500 italic">暂无规格，点击上方添加按钮增加规格</p>
                  )}
                </div>
              </div>

              {/* 营养成分 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">营养成分 (每份)</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">热量 (kcal)</label>
                    <input
                      type="number"
                      name="calories"
                      value={formData.nutrition?.calories || 0}
                      onChange={handleNutritionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">蛋白质 (g)</label>
                    <input
                      type="number"
                      name="protein"
                      value={formData.nutrition?.protein || 0}
                      onChange={handleNutritionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">脂肪 (g)</label>
                    <input
                      type="number"
                      name="fat"
                      value={formData.nutrition?.fat || 0}
                      onChange={handleNutritionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">碳水 (g)</label>
                    <input
                      type="number"
                      name="carbs"
                      value={formData.nutrition?.carbs || 0}
                      onChange={handleNutritionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '确认添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
