import { useUser, UserButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/header"
import { HelpCircle, BookOpen, ArrowLeft } from "lucide-react"

export default function QuestionsPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/sign-in')
    }
  }, [isLoaded, isSignedIn, navigate])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mr-4 transition-all duration-300 hover:scale-105 motion-reduce:hover:scale-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <HelpCircle className="h-8 w-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-foreground">Question Bank</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Question Generator</CardTitle>
            <CardDescription>Generate questions using artificial intelligence.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The AI-powered question generation feature will be available here. Create custom questions for your assignments and assessments.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Generate questions from text prompts</p>
              <p>• Multiple question types (MCQ, Short Answer, Essay)</p>
              <p>• Difficulty level adjustment</p>
              <p>• Subject-specific question generation</p>
              <p>• Question bank management</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
