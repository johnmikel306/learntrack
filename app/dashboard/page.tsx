'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AuthDebug from '@/components/auth-debug'
import TutorDashboard from '@/components/tutor-dashboard'
import StudentDashboard from '@/components/student-dashboard'
import ParentDashboard from '@/components/parent-dashboard'


export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setIsRedirecting(true)
      router.push('/sign-in')
      return
    }

    const userRole = user?.publicMetadata?.role
    if (!userRole) {
      setIsRedirecting(true)
      router.push('/role-setup')
      return
    }
  }, [isLoaded, isSignedIn, user, router])

  // Loading state
  if (!isLoaded || !isSignedIn || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
        <AuthDebug />
      </div>
    )
  }

  // Get user role from metadata
  const userRole = user?.publicMetadata?.role as string



  // Render role-specific dashboard
  const handleBack = () => {
    router.push('/')
  }

  if (userRole === 'tutor') {
    return (<>
      <AuthDebug />
      <TutorDashboard onBack={handleBack} />
    </>)
  }

  if (userRole === 'student') {
    return (<>
      <AuthDebug />
      <StudentDashboard onBack={handleBack} />
    </>)
  }

  if (userRole === 'parent') {
    return (<>
      <AuthDebug />
      <ParentDashboard onBack={handleBack} />
    </>)
  }

  // Fallback for unknown roles
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <AuthDebug />
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Setup Required</h1>
        <p className="text-gray-600 mb-6">Please complete your account setup.</p>
        <button
          onClick={() => router.push('/role-setup')}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
        >
          Complete Setup
        </button>
      </div>
    </div>
  )
}
