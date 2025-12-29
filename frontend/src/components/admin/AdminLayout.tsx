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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside 
        className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-purple-400" />
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
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
                        ? 'bg-purple-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    {item.icon}
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-slate-700 p-4">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm font-medium">
              {clerkUser?.firstName?.[0] || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{clerkUser?.fullName || 'Admin'}</p>
                <p className="text-xs text-slate-400 truncate">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => signOut()}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Super Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link 
              to="/dashboard" 
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
            >
              Back to App
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

