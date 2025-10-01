'use client'

// CLERK DISABLED: import { useUser, useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  BarChart3, 
  Settings, 
  UserPlus,
  Mail,
  Calendar,
  FileText
} from 'lucide-react'

export default function TutorDashboardPage() {
  // CLERK DISABLED: const { user, isLoaded } = useUser()
  // CLERK DISABLED: const { organization, membership, isLoaded: orgLoaded } = useOrganization()
  const router = useRouter()
  const [stats, setStats] = useState({
    students: 0,
    assignments: 0,
    subjects: 0,
    pendingInvites: 0
  })

  // NO-AUTH: Mock data for testing
  const user = { firstName: 'Demo', lastName: 'Tutor' }
  const organization = { name: 'Demo School' }
  const membership = { role: 'org:owner' }
  const isLoaded = true
  const orgLoaded = true

  useEffect(() => {
    // NO-AUTH: Load mock dashboard stats
    setStats({
      students: 12,
      assignments: 8,
      subjects: 4,
      pendingInvites: 3
    })
  }, [])

  // NO-AUTH: Remove loading state since we're not checking authentication

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {organization?.name || 'Your School'}
                </h1>
                <p className="text-sm text-gray-500">Tutor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName}
              </span>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students}</div>
              <p className="text-xs text-muted-foreground">
                Active in your school
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assignments}</div>
              <p className="text-xs text-muted-foreground">
                Currently assigned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subjects}</div>
              <p className="text-xs text-muted-foreground">
                Being taught
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingInvites}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting response
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for managing your school</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Students & Parents
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Subjects
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your school</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Sarah completed Math Assignment #3</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>New parent invitation sent to john@email.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Assignment "Algebra Basics" due tomorrow</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>3 assignments need grading</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Information about your school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Organization ID:</span>
                <span className="ml-2 text-gray-600">{organization?.id}</span>
              </div>
              <div>
                <span className="font-medium">Your Role:</span>
                <span className="ml-2 text-gray-600">{membership?.role}</span>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <span className="ml-2 text-gray-600">
                  {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium">Members:</span>
                <span className="ml-2 text-gray-600">{organization?.membersCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
