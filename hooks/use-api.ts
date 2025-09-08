'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApiClient, ApiResponse, ApiError } from '@/lib/api-client'

export interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useApi<T>(
  endpoint: string,
  options: {
    immediate?: boolean
    dependencies?: any[]
  } = {}
): UseApiState<T> {
  const { immediate = true, dependencies = [] } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<string | null>(null)
  
  const apiClient = useApiClient()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get<T>(endpoint)
      
      if (response.error) {
        setError(response.error)
        setData(null)
      } else {
        setData(response.data || null)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [apiClient, endpoint])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [fetchData, immediate, ...dependencies])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}

export interface UseMutationState<T, P = any> {
  data: T | null
  loading: boolean
  error: string | null
  mutate: (params: P) => Promise<T | null>
  reset: () => void
}

export function useMutation<T, P = any>(
  mutationFn: (apiClient: any, params: P) => Promise<ApiResponse<T>>
): UseMutationState<T, P> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const apiClient = useApiClient()

  const mutate = useCallback(async (params: P): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await mutationFn(apiClient, params)
      
      if (response.error) {
        setError(response.error)
        return null
      } else {
        const result = response.data || null
        setData(result)
        return result
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [apiClient, mutationFn])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    mutate,
    reset,
  }
}

// Specific hooks for common operations
export function useStudents() {
  return useApi<any[]>('/students')
}

export function useStudent(id: string) {
  return useApi<any>(`/students/${id}`, {
    immediate: !!id,
    dependencies: [id]
  })
}

export function useAssignments() {
  return useApi<any[]>('/assignments')
}

export function useProgress() {
  return useApi<any>('/progress')
}

export function useCreateStudent() {
  return useMutation<any, any>((client, data) => client.post('/students', data))
}

export function useCreateAssignment() {
  return useMutation<any, any>((client, data) => client.post('/assignments', data))
}

export function useGenerateQuestions() {
  return useMutation<any, any>((client, data) => client.post('/questions/generate', data))
}
