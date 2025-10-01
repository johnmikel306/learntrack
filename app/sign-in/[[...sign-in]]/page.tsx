'use client'

import { useRouter } from 'next/navigation'


import { SignIn } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, GraduationCap } from 'lucide-react'

export default function Page() {
  const router = useRouter()


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>
        <SignIn
          afterSignInUrl="/dashboard"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border-0",
            }
          }}
        />
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <button
              onClick={() => router.push('/sign-up')}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Sign up here
            </button>
          </p>

        </div>
      </div>
    </div>
  )
}
