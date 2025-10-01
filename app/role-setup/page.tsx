'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Eye, GraduationCap, Loader2, AlertCircle } from 'lucide-react'

export default function RoleSetupPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/sign-in')
        return
      }

      const userRole = user?.publicMetadata?.role
      if (userRole) {
        router.push('/dashboard')
        return
      }
    }
  }, [isLoaded, isSignedIn, user, router])

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.push('/sign-in')
      return
    }

    // If user already has a role, redirect to dashboard
    if (user?.publicMetadata?.role) {
      router.push('/dashboard')
      return
    }
  }, [isLoaded, isSignedIn, user, router])


  const handleRoleSelection = async (role: 'tutor' | 'student' | 'parent') => {
    if (!user) return

    setIsUpdating(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign role')
      }

      // Force user data refresh
      await user.reload()

      // Redirect to dashboard after successful role update
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to update user role:', error)
      setError(error instanceof Error ? error.message : 'Failed to assign role. Please try again.')
      setIsUpdating(false)
    }
  }

  // Show loading state while checking authentication
  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if user already has a role (will redirect)
  if (user?.publicMetadata?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Complete Your Setup</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We need to know your role to customize your LearnTrack experience and provide you with the right tools.
          </p>
          {error && (
            <div className="mt-6 max-w-md mx-auto p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Tutor Card */}
          <Card className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border-2 hover:border-blue-500">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Tutor</CardTitle>
              <CardDescription className="text-base">
                Create assignments, manage students, and track progress
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li>• AI-powered question generation</li>
                <li>• Student progress tracking</li>
                <li>• Assignment management</li>
                <li>• Parent communication</li>
              </ul>
              <Button
                onClick={() => handleRoleSelection('tutor')}
                disabled={isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'I am a Tutor'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Student Card */}
          <Card className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border-2 hover:border-green-500">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Student</CardTitle>
              <CardDescription className="text-base">
                Complete assignments, track your progress, and learn
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li>• Interactive assignments</li>
                <li>• Personal progress tracking</li>
                <li>• Achievement system</li>
                <li>• Real-time feedback</li>
              </ul>
              <Button
                onClick={() => handleRoleSelection('student')}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'I am a Student'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Parent Card */}
          <Card className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer border-2 hover:border-purple-500">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Parent</CardTitle>
              <CardDescription className="text-base">
                Monitor your child's progress and communicate with tutors
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2 mb-6 text-sm text-gray-600">
                <li>• Child progress monitoring</li>
                <li>• Performance insights</li>
                <li>• Tutor communication</li>
                <li>• Assignment tracking</li>
              </ul>
              <Button
                onClick={() => handleRoleSelection('parent')}
                disabled={isUpdating}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'I am a Parent'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Need help choosing? Contact our support team for guidance.
          </p>
        </div>
      </div>
    </div>
  )
}
