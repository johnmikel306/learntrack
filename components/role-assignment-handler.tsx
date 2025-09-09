'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RoleAssignmentHandler() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    const handleRoleAssignment = async () => {
      if (!isLoaded || !user) return

      // Check if user already has a role
      const existingRole = user.publicMetadata?.role
      if (existingRole) {
        // User already has a role, redirect to dashboard
        router.push('/dashboard')
        return
      }

      // Check for selected role in sessionStorage
      const selectedRole = sessionStorage.getItem('selectedRole')
      if (selectedRole) {
        try {
          // Update user's public metadata with the selected role
          await user.update({
            publicMetadata: {
              ...user.publicMetadata,
              role: selectedRole
            }
          })

          // Clear the selected role from sessionStorage
          sessionStorage.removeItem('selectedRole')

          // Redirect to dashboard
          router.push('/dashboard')
        } catch (error) {
          console.error('Failed to update user role:', error)
          // If role assignment fails, redirect to role setup
          router.push('/role-setup')
        }
      } else {
        // No role selected, redirect to role setup
        router.push('/role-setup')
      }
    }

    handleRoleAssignment()
  }, [isLoaded, user, router])

  // Show loading while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Setting up your account...</h2>
        <p className="text-gray-600">Please wait while we configure your dashboard.</p>
      </div>
    </div>
  )
}
