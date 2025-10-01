'use client'

// CLERK DISABLED: import { useUser, useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Trophy,
  Calendar,
  FileText
} from 'lucide-react'

export default function StudentDashboardPage() {
  // CLERK DISABLED: const { user, isLoaded } = useUser()
  // CLERK DISABLED: const { organization, membership, isLoaded: orgLoaded } = useOrganization()
  const router = useRouter()
  const [stats, setStats] = useState({
    assignmentsCompleted: 8,
    assignmentsPending: 3,
    overallProgress: 75,
    currentGrade: 'A-'
  })

  // NO-AUTH: Mock data for testing
  const user = { firstName: 'Demo', lastName: 'Student' }
  const organization = { name: 'Demo School' }
  const membership = { role: 'org:student' }
  const isLoaded = true
  const orgLoaded = true

  useEffect(() => {
    // NO-AUTH: Mock data is already set in state
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
                <p className="text-sm text-gray-500">Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName}
              </span>
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
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.assignmentsCompleted}</div>
              <p className="text-xs text-muted-foreground">
                Assignments done
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.assignmentsPending}</div>
              <p className="text-xs text-muted-foreground">
                Due soon
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Trophy className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.overallProgress}%</div>
              <p className="text-xs text-muted-foreground">
                Overall completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Grade</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.currentGrade}</div>
              <p className="text-xs text-muted-foreground">
                Average grade
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
            <CardDescription>Your overall progress across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Mathematics</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Science</span>
                  <span>72%</span>
                </div>
                <Progress value={72} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>English</span>
                  <span>90%</span>
                </div>
                <Progress value={90} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>History</span>
                  <span>68%</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
              <CardDescription>Tasks that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div className="flex-1">
                    <h4 className="font-medium">Math Quiz #5</h4>
                    <p className="text-sm text-gray-600">Due: Tomorrow</p>
                  </div>
                  <Button size="sm">Start</Button>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div className="flex-1">
                    <h4 className="font-medium">Science Lab Report</h4>
                    <p className="text-sm text-gray-600">Due: Friday</p>
                  </div>
                  <Button size="sm" variant="outline">View</Button>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <h4 className="font-medium">English Essay</h4>
                    <p className="text-sm text-gray-600">Due: Next Monday</p>
                  </div>
                  <Button size="sm" variant="outline">View</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Your latest accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Perfect Score!</p>
                    <p className="text-sm text-gray-600">Math Quiz #4 - 100%</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Assignment Completed</p>
                    <p className="text-sm text-gray-600">Science Chapter 5 Review</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Reading Goal Met</p>
                    <p className="text-sm text-gray-600">Finished 3 chapters this week</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
