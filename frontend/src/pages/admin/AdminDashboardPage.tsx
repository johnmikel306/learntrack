import React, { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { AdminMetrics } from '../../components/admin/AdminMetrics'
import { Activity, RefreshCw } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

interface SystemMetrics {
  total_tutors: number
  total_students: number
  total_parents: number
  total_users: number
  active_tutors: number
  active_students: number
  active_parents: number
  total_questions: number
  total_assignments: number
  total_subjects: number
  total_materials: number
  database_size_mb: number
  storage_used_mb: number
  questions_generated_today: number
  assignments_created_today: number
  logins_today: number
  metrics_updated_at: string
}

export function AdminDashboardPage() {
  const { getToken } = useAuth()
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = await getToken()
      
      const response = await fetch(`${API_BASE_URL}/admin/dashboard/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`)
      }

      const data = await response.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            System-wide metrics and statistics
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Quick Stats Banner */}
      <div className="bg-primary rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">System Status: Healthy</h2>
            <p className="text-white/80">All services are running normally</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <AdminMetrics metrics={metrics} isLoading={isLoading} error={error} />

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Admin Activity</h3>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Activity log will be displayed here</p>
          <p className="text-sm">View the Audit Logs section for detailed activity</p>
        </div>
      </div>
    </div>
  )
}

