import React from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private getToken: () => Promise<string | null>

  constructor(getToken: () => Promise<string | null>) {
    this.getToken = getToken
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getToken()
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new ApiError(
          data?.detail || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        )
      }

      return {
        data,
        status: response.status,
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 0,
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' })
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

/**
 * Hook to create an authenticated API client
 * Gets Clerk JWT token without template (uses default)
 */
export function useApiClient() {
  const { getToken } = useAuth()

  const memoizedGetToken = React.useCallback(() => {
    // Don't specify template - use default Clerk JWT
    return getToken()
  }, [getToken])

  return new ApiClient(memoizedGetToken)
}

// Utility functions for common API operations
export const apiUtils = {
  // Students
  getStudents: (client: ApiClient) => client.get('/students'),
  getStudent: (client: ApiClient, id: string) => client.get(`/students/${id}`),
  createStudent: (client: ApiClient, data: any) => client.post('/students', data),
  updateStudent: (client: ApiClient, id: string, data: any) => client.put(`/students/${id}`, data),
  deleteStudent: (client: ApiClient, id: string) => client.delete(`/students/${id}`),

  // Assignments
  getAssignments: (client: ApiClient) => client.get('/assignments'),
  getAssignment: (client: ApiClient, id: string) => client.get(`/assignments/${id}`),
  createAssignment: (client: ApiClient, data: any) => client.post('/assignments', data),
  updateAssignment: (client: ApiClient, id: string, data: any) => client.put(`/assignments/${id}`, data),
  deleteAssignment: (client: ApiClient, id: string) => client.delete(`/assignments/${id}`),

  // Questions
  getQuestions: (client: ApiClient) => client.get('/questions'),
  generateQuestions: (client: ApiClient, data: any) => client.post('/questions/generate', data),
  reviewQuestions: (client: ApiClient, data: any) => client.post('/questions/review', data),

  // Progress
  getProgress: (client: ApiClient) => client.get('/progress'),
  getStudentProgress: (client: ApiClient, studentId: string) => client.get(`/progress/student/${studentId}`),

  // User Profile
  getProfile: (client: ApiClient) => client.get('/users/me'),
  updateProfile: (client: ApiClient, data: any) => client.put('/users/me', data),
}
