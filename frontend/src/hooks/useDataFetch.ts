/**
 * Custom hook for fetching data from API with loading, error, and retry states
 * Reduces boilerplate code across components
 */

import { useState, useEffect, useCallback } from 'react'
import { useApiClient } from '@/lib/api-client'
import { toast } from 'sonner'

interface UseDataFetchOptions<T> {
  endpoint: string
  transform?: (data: any) => T[]
  onError?: (error: string) => void
  autoFetch?: boolean
}

interface UseDataFetchReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch data from API with automatic loading/error handling
 * @param options - Configuration options
 * @returns Object with data, loading state, error, and refetch function
 * 
 * @example
 * const { data: students, loading, error, refetch } = useDataFetch({
 *   endpoint: '/students/',
 *   transform: (data) => data.map(s => ({ id: s._id, name: s.name }))
 * })
 */
export function useDataFetch<T>({
  endpoint,
  transform,
  onError,
  autoFetch = true
}: UseDataFetchOptions<T>): UseDataFetchReturn<T> {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)
  const client = useApiClient()

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await client.get(endpoint)
      
      if (response.error) {
        throw new Error(response.error)
      }

      const transformedData = transform 
        ? transform(response.data || [])
        : (response.data || [])
      
      setData(transformedData)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load data'
      setError(errorMessage)
      
      if (onError) {
        onError(errorMessage)
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [endpoint, transform, onError, client])

  useEffect(() => {
    if (autoFetch) {
      fetchData()
    }
  }, [autoFetch, fetchData])

  return { data, loading, error, refetch: fetchData }
}

