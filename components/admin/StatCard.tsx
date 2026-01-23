import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/components/admin/Sidebar'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  color?: 'blue' | 'green' | 'orange' | 'purple'
}

export function StatCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral', 
  icon: Icon,
  color = 'blue'
}: StatCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
        
        {change && (
          <div className="flex items-center mt-2 gap-1">
            {trend === 'up' && <ArrowUpRight className="w-4 h-4 text-green-500" />}
            {trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500" />}
            <span className={cn(
              "text-xs font-medium",
              trend === 'up' ? "text-green-600" : 
              trend === 'down' ? "text-red-600" : "text-gray-500"
            )}>
              {change}
            </span>
            <span className="text-xs text-gray-400">较昨日</span>
          </div>
        )}
      </div>
      
      <div className={cn("p-3 rounded-lg", colorStyles[color])}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  )
}
