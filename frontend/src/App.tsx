import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import { ThemeProvider } from './contexts/ThemeContext'
import HomePage from './pages/HomePage'
import GetStartedPage from './pages/GetStartedPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import AssignmentsPage from './pages/AssignmentsPage'
import QuestionsPage from './pages/QuestionsPage'
import StudentsPage from './pages/StudentsPage'
import RoleSetupPage from './pages/RoleSetupPage'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <SignedIn>
                <DashboardPage />
              </SignedIn>
            }
          />
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
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App
