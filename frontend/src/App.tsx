import { Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import HomePage from './pages/HomePage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import DashboardPage from './pages/DashboardPage'
import AssignmentsPage from './pages/AssignmentsPage'
import QuestionsPage from './pages/QuestionsPage'
import StudentsPage from './pages/StudentsPage'
import RoleSetupPage from './pages/RoleSetupPage'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
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
  )
}

export default App
