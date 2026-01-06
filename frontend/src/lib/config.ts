/**
 * Centralized configuration for the frontend application
 * All environment-based configuration should be accessed through this file
 */

// Raw API base URL from environment
const RAW_API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'

// Normalize base URL (remove trailing slashes)
const NORMALIZED_BASE = RAW_API_BASE_URL.replace(/\/+$/, '')

// API root with version prefix
export const API_BASE_URL = NORMALIZED_BASE.match(/\/api\/v\d+$/) 
  ? NORMALIZED_BASE 
  : `${NORMALIZED_BASE}/api/v1`

// Raw base URL (without /api/v1 prefix, for non-versioned endpoints)
export const API_HOST = NORMALIZED_BASE.replace(/\/api\/v\d+$/, '')

// Clerk configuration
export const CLERK_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY || ''
export const CLERK_TOKEN_TEMPLATE = (import.meta as any).env?.VITE_CLERK_TOKEN_TEMPLATE || 'fastapi'

// Feature flags
export const IS_DEVELOPMENT = (import.meta as any).env?.DEV ?? false
export const IS_PRODUCTION = (import.meta as any).env?.PROD ?? false

// UploadThing (if used)
export const UPLOADTHING_APP_ID = (import.meta as any).env?.VITE_UPLOADTHING_APP_ID || ''

/**
 * Get the full API URL for an endpoint
 * @param endpoint - The API endpoint (e.g., '/students', '/questions/generate')
 * @returns Full URL with API base
 */
export function getApiUrl(endpoint: string): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${path}`
}

/**
 * Configuration object for easy access
 */
export const config = {
  api: {
    baseUrl: API_BASE_URL,
    host: API_HOST,
  },
  clerk: {
    publishableKey: CLERK_PUBLISHABLE_KEY,
    tokenTemplate: CLERK_TOKEN_TEMPLATE,
  },
  features: {
    isDevelopment: IS_DEVELOPMENT,
    isProduction: IS_PRODUCTION,
  },
} as const

export default config

