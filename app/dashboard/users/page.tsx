'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Award } from 'lucide-react'
import type { User } from '@/lib/types'
import { format } from 'date-fns'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState('')

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (level) params.append('level', level)

      const response = await fetch(`/api/users?${params}`)
      const result = await response.json()
      if (result.success) {
        setUsers(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [level])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const levelMap: Record<string, { label: string; color: string; icon: string }> = {
    bronze: { label: '青铜会员', color: 'bg-orange-100 text-orange-700', icon: '🥉' },
    silver: { label: '白银会员', color: 'bg-gray-100 text-gray-700', icon: '🥈' },
    gold: { label: '黄金会员', color: 'bg-yellow-100 text-yellow-700', icon: '🥇' },
    diamond: { label: '钻石会员', color: 'bg-blue-100 text-blue-700', icon: '💎' },
  }

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">用户管理</h1>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              会员等级
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">全部等级</option>
              <option value="bronze">青铜会员</option>
              <option value="silver">白银会员</option>
              <option value="gold">黄金会员</option>
              <option value="diamond">钻石会员</option>
            </select>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                用户信息
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                会员等级
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                积分
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                订单数
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                总消费
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                注册时间
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar}
                        alt={user.nickname || '用户'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          {user.nickname?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-800">
                        {user.nickname || '未设置昵称'}
                      </div>
                      <div className="text-sm text-gray-500">{user.phone || '未绑定手机'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 w-fit ${
                      levelMap[user.level]?.color || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span>{levelMap[user.level]?.icon}</span>
                    <span>{levelMap[user.level]?.label || user.level}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-gray-700">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span>{user.points}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{user.total_orders}</td>
                <td className="px-6 py-4 text-gray-700">
                  ¥{user.total_spent.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">
                  {format(new Date(user.created_at), 'yyyy-MM-dd')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">暂无用户数据</div>
        )}
      </div>
    </div>
  )
}
