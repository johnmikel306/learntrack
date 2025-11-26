import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'

// User role types matching backend
export type UserRole = 'tutor' | 'student' | 'parent'

// Backend user data structure
export interface BackendUser {
  clerk_id: string
  email: string
  name: string
  role: UserRole
  tutor_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  student_ids?: string[]  // For parents
}

interface UserContextType {
  // Clerk user data
  clerkUser: ReturnType<typeof useUser>['user']
  isLoaded: boolean
  isSignedIn: boolean
  
  // Backend user data
  backendUser: BackendUser | null
  isBackendLoaded: boolean
  backendError: string | null
  
  // Derived properties
  role: UserRole | null
  tutorId: string | null
  studentIds: string[]
  
  // Permissions
  isTutor: boolean
  isStudent: boolean
  isParent: boolean
  
  // Actions
  refreshBackendUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()
  
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null)
  const [isBackendLoaded, setIsBackendLoaded] = useState(false)
  const [backendError, setBackendError] = useState<string | null>(null)

  const fetchBackendUser = useCallback(async () => {
    if (!isSignedIn || !clerkUser) {
      setBackendUser(null)
      setIsBackendLoaded(true)
      return
    }

    try {
      setBackendError(null)
      const token = await getToken()
      
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setBackendUser(userData)
      } else if (response.status === 404) {
        // User not found in backend - might need role setup
        setBackendUser(null)
      } else {
        throw new Error(`Failed to fetch user: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to fetch backend user:', error)
      setBackendError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsBackendLoaded(true)
    }
  }, [isSignedIn, clerkUser, getToken])

  // Fetch backend user when Clerk user changes
  useEffect(() => {
    if (isLoaded) {
      fetchBackendUser()
    }
  }, [isLoaded, isSignedIn, clerkUser?.id, fetchBackendUser])

  // Derive role from backend user or Clerk metadata
  const role = backendUser?.role || 
    (clerkUser?.publicMetadata?.role as UserRole) || null

  const tutorId = backendUser?.tutor_id || null
  const studentIds = backendUser?.student_ids || []

  const value: UserContextType = {
    // Clerk data
    clerkUser,
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    
    // Backend data
    backendUser,
    isBackendLoaded,
    backendError,
    
    // Derived
    role,
    tutorId,
    studentIds,
    
    // Permissions
    isTutor: role === 'tutor',
    isStudent: role === 'student',
    isParent: role === 'parent',
    
    // Actions
    refreshBackendUser: fetchBackendUser
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}

// Convenience hooks for common use cases
export function useCurrentRole() {
  const { role, isTutor, isStudent, isParent } = useUserContext()
  return { role, isTutor, isStudent, isParent }
}

export function useTutorId() {
  const { tutorId } = useUserContext()
  return tutorId
}

