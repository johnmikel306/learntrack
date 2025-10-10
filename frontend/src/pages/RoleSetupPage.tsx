import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/header"
import { BookOpen, Users, Eye, GraduationCap } from "lucide-react"

export default function RoleSetupPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleSelection = async (role: string) => {
    setIsLoading(true)
    try {
      // Update user metadata with selected role
      // Note: We use unsafeMetadata because publicMetadata can only be updated from the backend
      // The DashboardPage will handle migrating this to publicMetadata if needed
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          role: role
        }
      })

      // Force reload user data to get updated metadata
      await user?.reload()

      // Redirect to dashboard
      navigate('/dashboard')
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to set role. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const roles = [
    {
      id: 'tutor',
      title: 'Tutor',
      description: 'Create assignments, track student progress, and manage your classroom',
      icon: GraduationCap,
      color: 'bg-blue-500'
    },
    {
      id: 'student',
      title: 'Student',
      description: 'Complete assignments, track your progress, and learn with AI assistance',
      icon: BookOpen,
      color: 'bg-green-500'
    },
    {
      id: 'parent',
      title: 'Parent',
      description: 'Monitor your child\'s progress and stay connected with their learning journey',
      icon: Eye,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header showNavigation={false} />
      <div className="bg-gradient-to-b from-muted/40 to-background dark:from-black/20 dark:to-background py-20">
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Choose Your Role</h1>
            <p className="text-lg text-muted-foreground">
              Select your role to customize your LearnTrack experience
            </p>
          </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roles.map((role) => {
            const IconComponent = role.icon
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] motion-reduce:hover:scale-100 hover:-translate-y-1 motion-reduce:hover:translate-y-0 ${
                  selectedRole === role.id ? 'ring-2 ring-purple-500 shadow-lg' : ''
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRoleSelection(role.id)
                    }}
                    disabled={isLoading}
                    className="w-full"
                    variant={selectedRole === role.id ? "default" : "outline"}
                  >
                    {isLoading ? 'Setting up...' : `Continue as ${role.title}`}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              You can change your role later in your account settings
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
