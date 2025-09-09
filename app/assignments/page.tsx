'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, BookOpen, ArrowLeft } from "lucide-react"

export default function AssignmentsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">LearnTrack</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <FileText className="h-8 w-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Manage Assignments</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>This feature is under construction.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              The assignment management functionality will be available here shortly. You'll be able to create, assign, and review assignments.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Create and customize assignments</p>
              <p>• Set due dates and time limits</p>
              <p>• Assign to specific students or groups</p>
              <p>• Review and grade submissions</p>
              <p>• Generate performance reports</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
