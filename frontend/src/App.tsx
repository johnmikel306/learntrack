import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from '@/components/ui/sonner'
import HomePage from './pages/HomePage'
import GetStartedPage from './pages/GetStartedPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import AssignmentsPage from './pages/AssignmentsPage'
import QuestionsPage from './pages/QuestionsPage'
import StudentsPage from './pages/StudentsPage'
import StudentDetailsPage from './pages/StudentDetailsPage'
import RoleSetupPage from './pages/RoleSetupPage'
import AcceptInvitationPage from './pages/AcceptInvitationPage'
import TeacherOnboarding from './components/onboarding/TeacherOnboarding'
import StudentOnboarding from './components/onboarding/StudentOnboarding'
import ParentOnboarding from './components/onboarding/ParentOnboarding'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Toaster />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />

          {/* Onboarding routes */}
          <Route
            path="/onboarding/teacher"
            element={
              <SignedIn>
                <TeacherOnboarding />
              </SignedIn>
            }
          />
          <Route
            path="/onboarding/student"
            element={
              <SignedIn>
                <StudentOnboarding />
              </SignedIn>
            }
          />
          <Route
            path="/onboarding/parent"
            element={
              <SignedIn>
                <ParentOnboarding />
              </SignedIn>
            }
          />

          {/* Protected routes - Dashboard with nested routes */}
          <Route
            path="/dashboard/*"
            element={
              <SignedIn>
                <DashboardPage />
              </SignedIn>
            }
          />

          {/* Legacy routes - redirect to dashboard */}
          <Route
            path="/assignments"
            element={
              <SignedIn>
                <AssignmentsPage />
              </SignedIn>
            }
          />
          <Route
            path="/questions"
            element={
              <SignedIn>
                <QuestionsPage />
              </SignedIn>
            }
          />
          <Route
            path="/students"
            element={
              <SignedIn>
                <StudentsPage />
              </SignedIn>
            }
          />
          <Route
            path="/role-setup"
            element={
              <SignedIn>
                <RoleSetupPage />
              </SignedIn>
            }
          />
          <Route
            path="/settings"
            element={
              <SignedIn>
                <SettingsPage />
              </SignedIn>
            }
          />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App
