import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import TutorDashboard from '@/components/TutorDashboard/index'
import StudentDashboard from '@/components/StudentDashboard'
import ParentDashboard from '@/components/ParentDashboard'

export default function DashboardPage() {
  // ProtectedRoute already ensures user is signed in
  const { isLoaded, user } = useUser()
  const navigate = useNavigate()

  // Get user role from metadata (check both public and unsafe metadata)
  const userRole = (user?.publicMetadata?.role || user?.unsafeMetadata?.role) as string | undefined

  useEffect(() => {
    if (!isLoaded) return

    // Sync role from unsafeMetadata to publicMetadata if needed
    if (user?.unsafeMetadata?.role && !user?.publicMetadata?.role) {
      user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          role: user.unsafeMetadata.role
        }
      }).catch(console.error)
    }

    // Redirect to role setup if no role is set
    if (!userRole) {
      navigate('/role-setup')
    }
  }, [isLoaded, user, userRole, navigate])

  // Loading state while Clerk loads
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Render appropriate dashboard based on role
  switch (userRole) {
    case 'tutor':
      return <TutorDashboard />
    case 'student':
      return <StudentDashboard />
    case 'parent':
      return <ParentDashboard />
    default:
      // Show loading while redirecting to role-setup
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Redirecting to role setup...</p>
          </div>
        </div>
      )
  }
}
