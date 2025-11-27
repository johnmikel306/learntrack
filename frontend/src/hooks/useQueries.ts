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
 * Hook to delete a student
 */
export function useDeleteStudent() {
  const client = useApiClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (studentClerkId: string) => {
      const response = await client.delete(`/students/${studentClerkId}`)
      if (response.error) throw new Error(response.error)
      return response.data
    },
    onSuccess: () => {
      // Invalidate students list to refetch
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
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

// ============================================
// Dashboard Queries
// ============================================

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats() {
  const client = useApiClient()

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await client.get('/dashboard/stats')
      if (response.error) throw new Error(response.error)
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// ============================================
// Assignment Queries
// ============================================

/**
 * Hook to fetch tutor assignments with pagination
 */
export function useAssignments(
  page: number = 1,
  perPage: number = 20,
  filters?: { subjectId?: string; status?: string }
) {
  const client = useApiClient()

  return useQuery<PaginatedResponse<any>>({
    queryKey: ['assignments', page, perPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      })
      if (filters?.subjectId) params.append('subject_id', filters.subjectId)
      if (filters?.status) params.append('status', filters.status)

      const response = await client.get(`/assignments?${params.toString()}`)
      if (response.error) throw new Error(response.error)
      return response.data as PaginatedResponse<any>
    },
  })
}

/**
 * Hook to fetch current student's assignments
 */
export function useMyAssignments() {
  const client = useApiClient()

  return useQuery({
    queryKey: ['assignments', 'my'],
    queryFn: async () => {
      const response = await client.get('/assignments/student/')
      if (response.error) throw new Error(response.error)
      return response.data
    },
  })
}

// ============================================
// Subject Queries
// ============================================

/**
 * Hook to fetch all subjects
 */
export function useSubjects() {
  const client = useApiClient()

  return useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await client.get('/subjects')
      if (response.error) throw new Error(response.error)
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - subjects don't change often
  })
}

// ============================================
// Question Queries
// ============================================

/**
 * Hook to fetch questions with pagination
 */
export function useQuestions(
  page: number = 1,
  perPage: number = 20,
  filters?: { subjectId?: string; topic?: string; difficulty?: string; status?: string }
) {
  const client = useApiClient()

  return useQuery<PaginatedResponse<any>>({
    queryKey: ['questions', page, perPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      })
      if (filters?.subjectId) params.append('subject_id', filters.subjectId)
      if (filters?.topic) params.append('topic', filters.topic)
      if (filters?.difficulty) params.append('difficulty', filters.difficulty)
      if (filters?.status) params.append('status', filters.status)

      const response = await client.get(`/questions?${params.toString()}`)
      if (response.error) throw new Error(response.error)
      return response.data as PaginatedResponse<any>
    },
  })
}

/**
 * Hook to fetch pending questions for review
 */
export function usePendingQuestions(page: number = 1, perPage: number = 20) {
  const client = useApiClient()

  return useQuery<PaginatedResponse<any>>({
    queryKey: ['questions', 'pending', page, perPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      })
      const response = await client.get(`/questions/pending?${params.toString()}`)
      if (response.error) throw new Error(response.error)
      return response.data as PaginatedResponse<any>
    },
  })
}

// ============================================
// Material Queries
// ============================================

/**
 * Hook to fetch materials with pagination
 */
export function useMaterials(
  page: number = 1,
  perPage: number = 20,
  filters?: { subjectId?: string; materialType?: string; status?: string }
) {
  const client = useApiClient()

  return useQuery<PaginatedResponse<any>>({
    queryKey: ['materials', page, perPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      })
      if (filters?.subjectId) params.append('subject_id', filters.subjectId)
      if (filters?.materialType) params.append('material_type', filters.materialType)
      if (filters?.status) params.append('status', filters.status)

      const response = await client.get(`/materials?${params.toString()}`)
      if (response.error) throw new Error(response.error)
      return response.data as PaginatedResponse<any>
    },
  })
}

// ============================================
// Group Queries
// ============================================

/**
 * Hook to fetch all groups
 */
export function useGroups(limit: number = 200) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['groups', limit],
    queryFn: async () => {
      const response = await client.get(`/groups?limit=${limit}`)
      if (response.error) throw new Error(response.error)
      return response.data
    },
  })
}

// ============================================
// Parent Progress Queries
// ============================================

/**
 * Hook to fetch parent's children progress
 */
export function useParentProgress() {
  const client = useApiClient()

  return useQuery({
    queryKey: ['progress', 'parent'],
    queryFn: async () => {
      const response = await client.get('/progress/parent')
      if (response.error) throw new Error(response.error)
      return response.data
    },
  })
}

// ============================================
// Conversation & Message Queries
// ============================================

/**
 * Hook to fetch all conversations for the current user
 */
export function useConversations() {
  const client = useApiClient()

  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await client.get('/conversations')
      if (response.error) throw new Error(response.error)
      return response.data?.items || response.data || []
    },
  })
}

/**
 * Hook to fetch messages for a specific conversation
 */
export function useMessages(conversationId: string | undefined, page: number = 1, pageSize: number = 50) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['messages', conversationId, page],
    queryFn: async () => {
      if (!conversationId) throw new Error('Conversation ID is required')
      const response = await client.get(`/messages/conversation/${conversationId}?page=${page}&page_size=${pageSize}`)
      if (response.error) throw new Error(response.error)
      return response.data
    },
    enabled: !!conversationId,
  })
}

// ============================================
// Announcements Queries
// ============================================

/**
 * Hook to fetch announcements/notifications
 */
export function useAnnouncements() {
  const client = useApiClient()

  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      // Use notifications endpoint as announcements
      const response = await client.get('/notifications?per_page=10')
      if (response.error) throw new Error(response.error)
      return response.data?.items || response.data || []
    },
  })
}

// ============================================
// Student Details Queries (for modals)
// ============================================

/**
 * Hook to fetch student progress data
 */
export function useStudentProgress(studentId: string | undefined) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['progress', 'student', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required')
      const response = await client.get(`/progress/student/${studentId}`)
      if (response.error) throw new Error(response.error)
      return response.data
    },
    enabled: !!studentId,
  })
}

/**
 * Hook to fetch student assignments
 */
export function useStudentAssignmentsList(studentId: string | undefined) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['assignments', 'student', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required')
      const response = await client.get(`/assignments?student_id=${studentId}`)
      if (response.error) throw new Error(response.error)
      return response.data?.items || response.data || []
    },
    enabled: !!studentId,
  })
}

/**
 * Hook to fetch student activities
 */
export function useStudentActivities(studentId: string | undefined) {
  const client = useApiClient()

  return useQuery({
    queryKey: ['activities', 'student', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required')
      const response = await client.get(`/activity?user_id=${studentId}&limit=10`)
      if (response.error) throw new Error(response.error)
      return response.data?.items || response.data || []
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
      const response = await client.get(`/groups?member_id=${studentId}`)
      if (response.error) throw new Error(response.error)
      return response.data?.items || response.data || []
    },
    enabled: !!studentId,
  })
}

// ============================================
// Generation History Queries
// ============================================

/**
 * Hook to fetch question generation history
 */
export function useGenerationHistory() {
  const client = useApiClient()

  return useQuery({
    queryKey: ['generation-history'],
    queryFn: async () => {
      const response = await client.get('/questions/generation-history')
      if (response.error) throw new Error(response.error)
      return response.data?.items || response.data || []
    },
  })
}

