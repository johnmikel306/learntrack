import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Users, Search, ChevronLeft, ChevronRight, MoreVertical, Eye, Edit, Shield } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

interface AdminUserInfo {
  id: string
  clerk_id: string
  email: string
  name: string
  role: string
  tutor_id?: string
  is_active: boolean
  is_super_admin: boolean
  created_at: string
  updated_at?: string
  last_login?: string
}

const roleColors: Record<string, string> = {
  tutor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  student: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  parent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export function UsersPage() {
  const { getToken } = useAuth()
  const [users, setUsers] = useState<AdminUserInfo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const token = await getToken()
      
      const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() })
      if (searchQuery) params.append('search', searchQuery)
      if (roleFilter) params.append('role_filter', roleFilter)

      const response = await fetch(`${API_BASE_URL}/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`)

      const data = await response.json()
      setUsers(data.users)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [getToken, page, perPage, searchQuery, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage all users across tenants</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500" />
              </div>
            </form>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">All Roles</option>
              <option value="tutor">Tutors</option>
              <option value="student">Students</option>
              <option value="parent">Parents</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div></td>
                  <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto"></div></td>
                </tr>
              )) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500"><Users className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No users found</p></td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">{user.name?.[0] || 'U'}</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">{user.name}{user.is_super_admin && <Shield className="w-4 h-4 text-red-500" />}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || roleColors.tutor}`}>{user.role}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right relative">
                    <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><MoreVertical className="w-5 h-5 text-gray-500" /></button>
                    {openMenuId === user.id && (
                      <div className="absolute right-6 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                        <button onClick={() => setOpenMenuId(null)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Eye className="w-4 h-4" /> View</button>
                        <button onClick={() => setOpenMenuId(null)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><Edit className="w-4 h-4" /> Edit</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-2 rounded-lg border disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="p-2 rounded-lg border disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

