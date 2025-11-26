import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn } from '@clerk/clerk-react'
import { ThemeProvider } from './contexts/ThemeContext'
import { UserProvider } from './contexts/UserContext'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import GetStartedPage from './pages/GetStartedPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import RoleSetupPage from './pages/RoleSetupPage'
import AcceptInvitationPage from './pages/AcceptInvitationPage'
import TeacherOnboarding from './components/onboarding/TeacherOnboarding'
import StudentOnboarding from './components/onboarding/StudentOnboarding'
import ParentOnboarding from './components/onboarding/ParentOnboarding'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <ErrorBoundary>
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

              {/* Legacy routes - redirect to dashboard equivalents */}
              <Route path="/assignments" element={<Navigate to="/dashboard/assignments" replace />} />
              <Route path="/questions" element={<Navigate to="/dashboard/content/bank" replace />} />
              <Route path="/students" element={<Navigate to="/dashboard/students" replace />} />

              {/* Role setup and settings */}
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
        </ErrorBoundary>
      </UserProvider>
    </ThemeProvider>
  )
}

export default App
