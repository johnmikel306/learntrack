import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/ui/header'
import { GraduationCap, BookOpen, Eye } from 'lucide-react'

export default function RoleSelectionPage() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<string>('')

  const handleRoleSelect = (role: string) => {
    // Store role in sessionStorage to use after sign-up
    sessionStorage.setItem('selectedRole', role)
    navigate('/sign-up')
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
      <div className="flex items-center justify-center bg-gradient-to-b from-muted/40 to-background py-20">
        <div className="max-w-4xl w-full px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground mb-4">
              Choose Your Role
            </h2>
            <p className="text-muted-foreground">
              Select how you'll be using LearnTrack
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role) => {
              const IconComponent = role.icon
              return (
                <Card 
                  key={role.id}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedRole === role.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle>{role.title}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRoleSelect(role.id)
                      }}
                      className="w-full"
                      variant={selectedRole === role.id ? "default" : "outline"}
                    >
                      Continue as {role.title}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}