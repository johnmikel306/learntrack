import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import TutorDashboard from '@/components/TutorDashboard'
import StudentDashboard from '@/components/StudentDashboard'
import ParentDashboard from '@/components/ParentDashboard'

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const navigate = useNavigate()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setIsRedirecting(true)
      navigate('/sign-in')
      return
    }

    const userRole = user?.publicMetadata?.role
    if (!userRole) {
      setIsRedirecting(true)
      navigate('/role-setup')
      return
    }
  }, [isLoaded, isSignedIn, user, navigate])

  // Loading state
  if (!isLoaded || !isSignedIn || isRedirecting) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Get user role from metadata
  const userRole = user?.publicMetadata?.role as string

  // Render appropriate dashboard based on role
  switch (userRole) {
    case 'tutor':
      return <TutorDashboard />
    case 'student':
      return <StudentDashboard />
    case 'parent':
      return <ParentDashboard />
    default:
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Role Not Set</h2>
            <p className="text-muted-foreground mb-6">Please set up your role to access the dashboard.</p>
            <button
              onClick={() => navigate('/role-setup')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg motion-reduce:hover:scale-100"
            >
              Set Up Role
            </button>
          </div>
        </div>
      )
  }
}
