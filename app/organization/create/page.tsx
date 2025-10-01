'use client'

// CLERK DISABLED: import { useUser, useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Building, Loader2, ArrowLeft } from 'lucide-react'

export default function CreateOrganizationPage() {
  // CLERK DISABLED: const { user } = useUser()
  // CLERK DISABLED: const { createOrganization } = useOrganization()
  const router = useRouter()
  const [schoolName, setSchoolName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // NO-AUTH: Redirect to sign-in since this page requires authentication
  useEffect(() => {
    router.replace('/sign-in')
  }, [router])

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolName.trim() || !createOrganization) return

    setIsCreating(true)
    setError(null)

    try {
      const organization = await createOrganization({
        name: schoolName.trim(),
      })

      if (organization) {
        // Organization created successfully, redirect to post-auth to handle role assignment
        router.replace('/post-auth')
      }
    } catch (err) {
      console.error('Failed to create organization:', err)
      setError('Failed to create school. Please try again.')
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
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
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your School</h1>
          <p className="text-gray-600">
            Welcome, {user?.firstName}! Let's set up your educational organization.
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle>School Information</CardTitle>
            <CardDescription>
              Choose a name for your school or educational organization
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
                  School Name
                </label>
                <Input
                  id="schoolName"
                  type="text"
                  placeholder="e.g., Riverside Elementary, Math Tutoring Center"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  disabled={isCreating}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!schoolName.trim() || isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating School...
                  </>
                ) : (
                  'Create School'
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You'll become the school administrator</li>
                <li>• You can invite students and parents</li>
                <li>• Manage assignments and track progress</li>
                <li>• Access all tutor features</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
