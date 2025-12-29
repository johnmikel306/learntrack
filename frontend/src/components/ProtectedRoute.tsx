import { useUser } from '@clerk/clerk-react'
import { Navigate, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { useUserContext } from '../contexts/UserContext'
import AccessDeniedPage from '../pages/AccessDeniedPage'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  /** Required role to access this route (optional) */
  requiredRole?: 'tutor' | 'student' | 'parent'
  /** Redirect to this path if access is denied (optional - uses AccessDeniedPage if not set) */
  redirectOnDeny?: string
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectOnDeny
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useUser()
  const { role, isBackendLoaded } = useUserContext()
  const location = useLocation()

  // Loading state
  if (!isLoaded || (isSignedIn && !isBackendLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Not signed in - redirect to sign-in
  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />
  }

  // Check role if required
  if (requiredRole && role !== requiredRole) {
    // If user has no role, redirect to role setup
    if (!role) {
      return <Navigate to="/role-setup" state={{ from: location }} replace />
    }

    // If redirect path is specified, use it
    if (redirectOnDeny) {
      return <Navigate to={redirectOnDeny} replace />
    }

    // Otherwise show Access Denied page
    return (
      <AccessDeniedPage
        title="Wrong Role"
        message={`This page is only accessible to ${requiredRole}s. You are currently signed in as a ${role}.`}
        resource={location.pathname}
        requiredRole={requiredRole}
      />
    )
  }

  return <>{children}</>
}
