"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Eye, GraduationCap } from "lucide-react"
import TutorDashboard from "@/components/tutor-dashboard"
import StudentDashboard from "@/components/student-dashboard"
import ParentDashboard from "@/components/parent-dashboard"

type UserRole = "tutor" | "student" | "parent" | null

export default function HomePage() {
  const [currentRole, setCurrentRole] = useState<UserRole>(null)

  if (currentRole === "tutor") {
    return <TutorDashboard onBack={() => setCurrentRole(null)} />
  }

  if (currentRole === "student") {
    return <StudentDashboard onBack={() => setCurrentRole(null)} />
  }

  if (currentRole === "parent") {
    return <ParentDashboard onBack={() => setCurrentRole(null)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 pt-8">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">LearnTrack</h1>
          </div>
          <p className="text-xl text-gray-600 mb-2">Smart Assignment & Progress Monitoring</p>
          <p className="text-gray-500">Connecting tutors, students, and parents for better learning outcomes</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentRole("tutor")}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Tutor Dashboard</CardTitle>
              <CardDescription>Manage subjects, create questions, and assign tasks to students</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Create and organize question banks</li>
                <li>• Schedule assignments by topic and date</li>
                <li>• Track student progress and performance</li>
                <li>• Generate progress reports</li>
              </ul>
              <Button className="w-full mt-4">Access Tutor Dashboard</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentRole("student")}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Student Portal</CardTitle>
              <CardDescription>Complete daily assignments and track your learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• View daily assigned questions</li>
                <li>• Complete practice exercises</li>
                <li>• Get instant feedback</li>
                <li>• Monitor your progress</li>
              </ul>
              <Button className="w-full mt-4 bg-transparent" variant="outline">
                Access Student Portal
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentRole("parent")}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Parent View</CardTitle>
              <CardDescription>Monitor your child's learning progress and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• View child's daily progress</li>
                <li>• Track completion rates</li>
                <li>• Receive progress notifications</li>
                <li>• Support learning at home</li>
              </ul>
              <Button className="w-full mt-4 bg-transparent" variant="outline">
                Access Parent View
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Why Choose LearnTrack?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Structured Learning</h3>
              <p className="text-gray-600 text-sm">Organize questions by subjects and topics for systematic learning</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Better Engagement</h3>
              <p className="text-gray-600 text-sm">
                Keep students motivated with scheduled practice and progress tracking
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Full Transparency</h3>
              <p className="text-gray-600 text-sm">Parents stay informed about their child's learning journey</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
