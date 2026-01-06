/**
 * Simple API helper for document dashboard components
 * Uses fetch with Clerk authentication
 */

import { API_BASE_URL } from './config'

// Token getter - will be set by the provider
let tokenGetter: (() => Promise<string | null>) | null = null

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter
}

async function makeRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; status: number }> {
  const token = tokenGetter ? await tokenGetter() : null
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.detail || `HTTP ${response.status}`)
    ;(error as any).status = response.status
    ;(error as any).response = data
    throw error
  }

  return { data, status: response.status }
}

export const api = {
  get: <T = any>(endpoint: string) => makeRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, data?: any) => 
    makeRequest<T>(endpoint, { 
      method: 'POST', 
      body: data ? JSON.stringify(data) : undefined 
    }),
  put: <T = any>(endpoint: string, data?: any) => 
    makeRequest<T>(endpoint, { 
      method: 'PUT', 
      body: data ? JSON.stringify(data) : undefined 
    }),
  delete: <T = any>(endpoint: string) => makeRequest<T>(endpoint, { method: 'DELETE' }),
  patch: <T = any>(endpoint: string, data?: any) => 
    makeRequest<T>(endpoint, { 
      method: 'PATCH', 
      body: data ? JSON.stringify(data) : undefined 
    }),
}

