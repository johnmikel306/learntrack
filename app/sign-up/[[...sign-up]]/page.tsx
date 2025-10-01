'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { SignUp } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, Eye, GraduationCap, ArrowLeft, AlertCircle } from 'lucide-react'

export default function Page() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [showClerkSignUp, setShowClerkSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, isSignedIn } = useUser()

  // Check if role is already selected via URL params
  const roleFromParams = searchParams.get('role')

  useEffect(() => {
    // Redirect if already signed in
    if (isLoaded && isSignedIn) {
      router.push('/dashboard')
      return
    }

    // Check for stored role on component mount
    const storedRole = sessionStorage.getItem('selectedRole')
    if (storedRole) {
      setSelectedRole(storedRole)
      setShowClerkSignUp(true)
    } else if (roleFromParams) {
      setSelectedRole(roleFromParams)
      sessionStorage.setItem('selectedRole', roleFromParams)
      setShowClerkSignUp(true)
    }
  }, [roleFromParams, isLoaded, isSignedIn, router])

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role)
    setError(null)
    // Store the selected role in sessionStorage to use after Clerk sign-up
    sessionStorage.setItem('selectedRole', role)
    setShowClerkSignUp(true)
  }

  const handleBack = () => {
    if (showClerkSignUp) {
      setShowClerkSignUp(false)
      setSelectedRole(null)
      setError(null)
      sessionStorage.removeItem('selectedRole')
    } else {
      router.push('/')
    }
  }

  // If showing Clerk sign-up component
  if (showClerkSignUp || roleFromParams) {
    const role = selectedRole || roleFromParams
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join LearnTrack</h1>
            <p className="text-gray-600">
              Create your {role} account to get started
            </p>
          </div>
          <SignUp
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-xl border-0",
              }
            }}
          />
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Role selection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Role</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select your role to customize your LearnTrack experience and get started with the right tools for you.
          </p>
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
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Continue as Tutor
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
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Continue as Student
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
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Continue as Parent
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/sign-in')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
