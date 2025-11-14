import { useAuth, useUser } from '@clerk/clerk-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useApiClient } from '@/lib/api-client'

export function DebugPanel() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const client = useApiClient()
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const testBackendConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      // Test 1: Get token
      const token = await getToken()
      console.log('Clerk Token:', token ? 'Present' : 'Missing')

      // Test 2: Call students endpoint
      const response = await client.get('/students?page=1&per_page=10')
      console.log('Students API Response:', response)

      setTestResult({
        success: !response.error,
        token: token ? 'Present' : 'Missing',
        response: response,
        error: response.error || null,
      })
    } catch (error: any) {
      console.error('Test Error:', error)
      setTestResult({
        success: false,
        error: error.message,
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-sm">Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Auth Status:</strong>
          <div className="ml-2">
            <div>Loaded: {isLoaded ? '✅' : '❌'}</div>
            <div>Signed In: {isSignedIn ? '✅' : '❌'}</div>
            <div>User: {user?.fullName || 'N/A'}</div>
            <div>Email: {user?.primaryEmailAddress?.emailAddress || 'N/A'}</div>
            <div>User ID: {user?.id || 'N/A'}</div>
          </div>
        </div>

        <div>
          <strong>API Base URL:</strong>
          <div className="ml-2 break-all">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}</div>
        </div>

        <Button 
          onClick={testBackendConnection} 
          disabled={testing}
          size="sm"
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test Backend Connection'}
        </Button>

        {testResult && (
          <div className="mt-2 p-2 bg-muted rounded">
            <div>
              <strong>Result:</strong> {testResult.success ? '✅ Success' : '❌ Failed'}
            </div>
            {testResult.token && (
              <div>
                <strong>Token:</strong> {testResult.token}
              </div>
            )}
            {testResult.error && (
              <div className="text-destructive">
                <strong>Error:</strong> {testResult.error}
              </div>
            )}
            {testResult.response && (
              <div>
                <strong>Response:</strong>
                <pre className="text-xs overflow-auto max-h-32 mt-1 p-1 bg-background rounded">
                  {JSON.stringify(testResult.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

