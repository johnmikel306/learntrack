/**
 * Custom React Query hooks for data fetching
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApiClient } from '@/lib/api-client'

// Pagination types
export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: PaginationMeta
}

/**
 * Hook to fetch all students with pagination
 */
export function useStudents(page: number = 1, perPage: number = 10) {
  const client = useApiClient()

  return useQuery<PaginatedResponse<any>>({
    queryKey: ['students', page, perPage],
    queryFn: async () => {
      console.log('Fetching students:', { page, perPage })
      const response = await client.get(`/students?page=${page}&per_page=${perPage}`)
      console.log('Students response:', response)
      if (response.error) {
        console.error('Students fetch error:', response.error)
        throw new Error(response.error)
      }
      return response.data as PaginatedResponse<any>
    },
  })
}

/**
 * Hook to fetch a single student by slug
 */
export function useStudent(slug: string | undefined) {
  const client = useApiClient()
  
  return useQuery({
    queryKey: ['students', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Student slug is required')
      const response = await client.get(`/students/by-slug/${slug}`)
      if (response.error) throw new Error(response.error)
      return response.data
    },
    enabled: !!slug, // Only run query if slug is provided
  })
}

/**
 * Hook to fetch student assignments with pagination
 */
export function useStudentAssignments(
  studentId: string | undefined,
  status?: string,
  page: number = 1,
  perPage: number = 10
) {
  const client = useApiClient()

  return useQuery<PaginatedResponse<any>>({
    queryKey: ['assignments', 'student', studentId, status, page, perPage],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required')
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      })
      if (status) params.append('status', status)

      const response = await client.get(`/assignments/student/${studentId}?${params.toString()}`)
      if (response.error) throw new Error(response.error)
      return response.data as PaginatedResponse<any>
    },
    enabled: !!studentId,
  })
}

/**
 * Hook to fetch student groups
 */
export function useStudentGroups(studentId: string | undefined) {
  const client = useApiClient()
  
  return useQuery({
    queryKey: ['groups', 'student', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required')
      const response = await client.get(`/groups/student/${studentId}`)
      if (response.error) throw new Error(response.error)
      return response.data
    },
    enabled: !!studentId,
  })
}

/**
 * Hook to fetch student activities with pagination
 */
export function useStudentActivities(
  studentId: string | undefined,
  page: number = 1,
  perPage: number = 10
) {
  const client = useApiClient()

  return useQuery<PaginatedResponse<any>>({
    queryKey: ['activities', 'student', studentId, page, perPage],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required')
      const response = await client.get(`/activity/student/${studentId}?page=${page}&per_page=${perPage}`)
      if (response.error) throw new Error(response.error)
      return response.data as PaginatedResponse<any>
    },
    enabled: !!studentId,
  })
}

/**
 * Hook to fetch student progress analytics
 */
export function useStudentProgress(studentId: string | undefined) {
  const client = useApiClient()
  
  return useQuery({
    queryKey: ['progress', 'student', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required')
      const response = await client.get(`/progress/student/${studentId}/analytics`)
      if (response.error) throw new Error(response.error)
      return response.data
    },
    enabled: !!studentId,
  })
}

/**
 * Hook to fetch notifications with pagination
 * Uses polling instead of WebSocket for real-time updates
 */
export function useNotifications(
  page: number = 1,
  perPage: number = 10,
  unreadOnly: boolean = false
) {
  const client = useApiClient()

  return useQuery<PaginatedResponse<any>>({
    queryKey: ['notifications', page, perPage, unreadOnly],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        unread_only: unreadOnly.toString(),
      })
      const response = await client.get(`/notifications?${params.toString()}`)
      if (response.error) throw new Error(response.error)
      return response.data as PaginatedResponse<any>
    },
    // Poll for new notifications every 60 seconds
    refetchInterval: 60000, // 1 minute
  })
}

/**
 * Hook to fetch unread notification count
 */
export function useUnreadNotificationCount() {
  const client = useApiClient()
  
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await client.get('/notifications/unread-count')
      if (response.error) throw new Error(response.error)
      return response.data
    },
    // Refetch more frequently for notification count
    refetchInterval: 30000, // 30 seconds
  })
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationRead() {
  const client = useApiClient()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await client.put(`/notifications/${notificationId}/read`, {})
      if (response.error) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    },
  })
}

