import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useUserContext } from '../../contexts/UserContext'
import { Loader2 } from 'lucide-react'
import AccessDeniedPage from '../../pages/AccessDeniedPage'

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
      <AccessDeniedPage
        title="Admin Access Required"
        message="You don't have permission to access the admin dashboard. This area is restricted to super administrators only."
        resource={location.pathname}
        requiredRole="Super Admin"
      />
    )
  }

  // Check specific permission if required
  if (requiredPermission && !hasAdminPermission(requiredPermission as any)) {
    return (
      <AccessDeniedPage
        title="Insufficient Permissions"
        message={`You don't have the required permission (${requiredPermission}) to access this section.`}
        resource={location.pathname}
        requiredRole={requiredPermission}
      />
    )
  }

  return <>{children}</>
}

