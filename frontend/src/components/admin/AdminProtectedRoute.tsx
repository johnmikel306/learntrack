import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useUserContext } from '../../contexts/UserContext'
import { Shield, Loader2 } from 'lucide-react'

interface AdminProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
}

export function AdminProtectedRoute({ children, requiredPermission }: AdminProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth()
  const { isSuperAdmin, hasAdminPermission, isBackendLoaded } = useUserContext()
  const location = useLocation()

  // Show loading while checking auth
  if (!isLoaded || !isBackendLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  // Check super admin status
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access the admin dashboard. 
            This area is restricted to super administrators only.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Check specific permission if required
  if (requiredPermission && !hasAdminPermission(requiredPermission as any)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Insufficient Permissions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have the required permission ({requiredPermission}) to access this section.
          </p>
          <a
            href="/admin"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Return to Admin Dashboard
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

