import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { UserProvider } from './contexts/UserContext'
import { ToastProvider } from './contexts/ToastContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
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
        <ToastProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/get-started" element={<GetStartedPage />} />
              <Route path="/sign-in/*" element={<SignInPage />} />
              <Route path="/sign-up/*" element={<SignUpPage />} />
              <Route path="/accept-invitation/:token" element={<AcceptInvitationPage />} />

              {/* Onboarding routes - Protected */}
              <Route
                path="/onboarding/teacher"
                element={
                  <ProtectedRoute>
                    <TeacherOnboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding/student"
                element={
                  <ProtectedRoute>
                    <StudentOnboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding/parent"
                element={
                  <ProtectedRoute>
                    <ParentOnboarding />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes - Dashboard with nested routes */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Legacy routes - redirect to dashboard equivalents */}
              <Route path="/assignments" element={<Navigate to="/dashboard/assignments" replace />} />
              <Route path="/questions" element={<Navigate to="/dashboard/content/bank" replace />} />
              <Route path="/students" element={<Navigate to="/dashboard/students" replace />} />

              {/* Role setup and settings - Protected */}
              <Route
                path="/role-setup"
                element={
                  <ProtectedRoute>
                    <RoleSetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              </Routes>
            </div>
          </ErrorBoundary>
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  )
}

export default App
