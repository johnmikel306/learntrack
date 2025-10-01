'use client'

// CLERK DISABLED: import { useUser, useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, GraduationCap } from 'lucide-react'

export default function PostAuthPage() {
  // CLERK DISABLED: const { isLoaded, isSignedIn, user } = useUser()
  // CLERK DISABLED: const { organization, isLoaded: orgLoaded, membership } = useOrganization()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    // NO-AUTH: Redirect to sign-in page since authentication is disabled
    router.replace('/sign-in')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Redirecting to sign-in...
        </h1>
        
        <div className="flex items-center justify-center mb-6">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
        
        <p className="text-gray-600 mb-4">
          Please wait while we prepare your personalized experience.
        </p>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left text-xs">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
