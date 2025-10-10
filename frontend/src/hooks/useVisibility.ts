import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

interface VisibleUser {
  clerk_id: string
  name: string
  email: string
  role: string
}

interface VisibilityData {
  visibleUsers: VisibleUser[]
  visibleUserIds: string[]
  visibleStudents: VisibleUser[]
  loading: boolean
  error: string | null
  canSeeUser: (userId: string) => boolean
  canAccessConversation: (conversationId: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useVisibility(): VisibilityData {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [visibleUsers, setVisibleUsers] = useState<VisibleUser[]>([])
  const [visibleStudents, setVisibleStudents] = useState<VisibleUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVisibleUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = await getToken()

      const response = await fetch(`${API_BASE_URL}/visibility/visible-users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setVisibleUsers(data)
      } else {
        throw new Error('Failed to fetch visible users')
      }
    } catch (err: any) {
      console.error('Failed to fetch visible users:', err)
      setError(err.message || 'Failed to load visible users')
    } finally {
      setLoading(false)
    }
  }

  const fetchVisibleStudents = async () => {
    try {
      const token = await getToken()

      const response = await fetch(`${API_BASE_URL}/visibility/visible-students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setVisibleStudents(data)
      }
    } catch (err: any) {
      console.error('Failed to fetch visible students:', err)
    }
  }

  useEffect(() => {
    if (user) {
      fetchVisibleUsers()
      fetchVisibleStudents()
    }
  }, [user])

  const canSeeUser = (userId: string): boolean => {
    return visibleUsers.some(u => u.clerk_id === userId)
  }

  const canAccessConversation = async (conversationId: string): Promise<boolean> => {
    try {
      const token = await getToken()
      const response = await fetch(
        `${API_BASE_URL}/visibility/can-access-conversation/${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        return data.can_access === true
      }
      return false
    } catch (err) {
      console.error('Failed to check conversation access:', err)
      return false
    }
  }

  const refresh = async () => {
    await fetchVisibleUsers()
    await fetchVisibleStudents()
  }

  return {
    visibleUsers,
    visibleUserIds: visibleUsers.map(u => u.clerk_id),
    visibleStudents,
    loading,
    error,
    canSeeUser,
    canAccessConversation,
    refresh
  }
}

