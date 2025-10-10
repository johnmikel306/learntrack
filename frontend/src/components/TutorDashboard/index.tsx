import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useApiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { DashboardHeader } from "./DashboardHeader"
import { DashboardSidebar } from "./DashboardSidebar"
import { OverviewView } from "./views/OverviewView"
import { PlaceholderView } from "./views/PlaceholderView"
import InvitationsView from "./views/InvitationsView"
import RelationshipsView from "./views/RelationshipsView"
import StudentManager from "@/components/student-manager"
import AssignmentManager from "@/components/assignment-manager"
import IntegratedSubjectsManager from "@/components/integrated-subjects-manager"
import QuestionReviewer from "@/components/question-reviewer"
import MaterialManager from "@/components/MaterialManager"
import { Users, FileText, BookOpen, Brain, Calendar, BarChart3 } from "lucide-react"

interface TutorDashboardProps {
  onBack?: () => void
}

export default function TutorDashboard({ onBack }: TutorDashboardProps) {
  const [activeView, setActiveView] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const client = useApiClient()

  // Dashboard data state
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await client.get('/dashboard/stats')
        if (response.error) {
          throw new Error(response.error)
        }
        setDashboardStats(response.data)
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Render the appropriate view based on activeView state
  const renderView = () => {
    switch (activeView) {
      case "overview":
        return (
          <OverviewView
            dashboardStats={dashboardStats}
            loading={loading}
            onViewChange={setActiveView}
          />
        )

      case "all-students":
        return <StudentManager />

      case "invitations":
        return <InvitationsView />

      case "relationships":
        return <RelationshipsView />

      case "performance":
        return (
          <PlaceholderView
            title="Performance Analytics"
            description="Detailed insights into student performance and progress"
            icon={BarChart3}
            message="Performance analytics will be available soon"
            submessage="Track detailed student performance metrics"
          />
        )

      case "attendance":
        return (
          <PlaceholderView
            title="Attendance Tracking"
            description="Monitor student attendance and participation"
            icon={Calendar}
            message="Attendance tracking will be available soon"
            submessage="Keep track of student attendance records"
          />
        )

      case "groups":
        return (
          <PlaceholderView
            title="Groups Management"
            description="Organize students into groups"
            icon={Users}
            message="Group management will be available soon"
            submessage="Create and manage student groups for collaborative learning"
          />
        )

      case "active-assignments":
        return <AssignmentManager />

      case "create-new":
        return <AssignmentManager />

      case "templates":
        return (
          <PlaceholderView
            title="Assignment Templates"
            description="Reusable assignment templates"
            icon={FileText}
            message="Assignment templates will be available soon"
            submessage="Create and manage reusable assignment templates"
          />
        )

      case "grading":
        return (
          <PlaceholderView
            title="Grading Center"
            description="Grade and review student submissions"
            icon={FileText}
            message="Grading center will be available soon"
            submessage="Review and grade student assignments"
          />
        )

      case "question-bank":
        return (
          <PlaceholderView
            title="Question Library"
            description="Manage your question bank"
            icon={FileText}
            message="Question bank will be available soon"
            submessage="Access and organize your collection of questions"
          />
        )

      case "subjects":
        return <IntegratedSubjectsManager />

      case "review-questions":
        return <QuestionReviewer />

      case "ai-generator":
        return (
          <PlaceholderView
            title="AI Generator"
            description="Generate questions with AI"
            icon={Brain}
            message="AI question generator will be available soon"
            submessage="Create custom questions with AI assistance"
          />
        )

      case "resources":
        return <MaterialManager />

      default:
        return (
          <OverviewView
            dashboardStats={dashboardStats}
            loading={loading}
            onViewChange={setActiveView}
          />
        )
    }
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-950">
        {/* Left Sidebar */}
        <DashboardSidebar activeView={activeView} onViewChange={setActiveView} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <DashboardHeader onCreateAssignment={() => setActiveView("create-new")} />

          {/* Dashboard Content */}
          {renderView()}
        </div>
      </div>
    </SidebarProvider>
  )
}

