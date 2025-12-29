import React, { useState } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell
} from 'lucide-react'
import { useUserContext } from '../../contexts/UserContext'
import { useClerk } from '@clerk/clerk-react'

interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
  permission?: string
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Tenants', path: '/admin/tenants', icon: <Building2 className="w-5 h-5" />, permission: 'view_all_tenants' },
  { name: 'Users', path: '/admin/users', icon: <Users className="w-5 h-5" />, permission: 'view_all_users' },
  { name: 'Settings', path: '/admin/settings', icon: <Settings className="w-5 h-5" />, permission: 'manage_system_settings' },
]

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const { clerkUser, hasAdminPermission, hasFullAdminAccess } = useUserContext()
  const { signOut } = useClerk()

  const filteredNavItems = navItems.filter(item => {
    if (!item.permission) return true
    return hasFullAdminAccess || hasAdminPermission(item.permission as any)
  })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar with LearnTrack branding */}
      <aside
        className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 text-white transition-all duration-300 flex flex-col shadow-xl`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-purple-700/50">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">LearnTrack</span>
                <span className="block text-xs text-purple-300">Admin Panel</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-purple-700/50 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/admin' && location.pathname.startsWith(item.path))

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                        : 'text-purple-200 hover:bg-purple-700/50 hover:text-white'
                      }
                    `}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    {item.icon}
                    {!sidebarCollapsed && <span className="font-medium">{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-purple-700/50 p-4">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-sm font-medium shadow-lg">
              {clerkUser?.firstName?.[0] || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{clerkUser?.fullName || 'Admin'}</p>
                <p className="text-xs text-purple-300 truncate">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => signOut()}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-200 hover:text-white hover:bg-purple-700/50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with gradient accent */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 relative">
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600"></div>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Super Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
            </button>
            <Link
              to="/dashboard"
              className="text-sm px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
            >
              Back to App
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

