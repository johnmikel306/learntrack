'use client'

// CLERK DISABLED: import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Users, Mail, ArrowLeft, AlertCircle } from 'lucide-react'

export default function JoinOrganizationPage() {
  // CLERK DISABLED: const { user } = useUser()
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  // NO-AUTH: Redirect to sign-in since this page requires authentication
  useEffect(() => {
    router.replace('/sign-in')
  }, [router])

  // CLERK DISABLED: const userRole = user?.publicMetadata?.role as string

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setError(null)
    
    try {
      // This would typically use Clerk's organization invitation acceptance
      // For now, we'll show a message that this needs to be implemented
      setError('Invite code functionality will be implemented with Clerk Organizations API')
    } catch (err) {
      console.error('Failed to join organization:', err)
      setError('Failed to join organization. Please check your invite code.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/post-auth')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join a School</h1>
          <p className="text-gray-600">
            Welcome, {user?.firstName}! You need an invitation to join a school.
          </p>
        </div>

        <div className="space-y-6">
          {/* Invitation Required Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle>Invitation Required</CardTitle>
              <CardDescription>
                {userRole === 'student' 
                  ? 'Students must be invited by their tutor or school administrator'
                  : 'Parents must be invited by their child\'s tutor or school administrator'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleJoinWithCode} className="space-y-4">
                <div>
                  <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Invitation Code (Optional)
                  </label>
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="Enter your invitation code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!inviteCode.trim()}
                >
                  Join with Code
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                How to Get an Invitation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                {userRole === 'student' ? (
                  <>
                    <p>• Ask your tutor or teacher to send you an invitation</p>
                    <p>• They can invite you through their tutor dashboard</p>
                    <p>• Check your email for invitation links</p>
                  </>
                ) : (
                  <>
                    <p>• Ask your child's tutor to send you an invitation</p>
                    <p>• Tutors can invite parents through their dashboard</p>
                    <p>• Check your email for invitation links</p>
                  </>
                )}
                <p>• Contact the school administrator if you need help</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              Need help getting an invitation?
            </p>
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
