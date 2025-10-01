import { SignUp } from '@clerk/clerk-react'
import { Header } from '@/components/ui/header'
import { useState, useEffect } from 'react'

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<string>('student')

  useEffect(() => {
    // Get the selected role from sessionStorage
    const storedRole = sessionStorage.getItem('selectedRole')
    if (storedRole) {
      setSelectedRole(storedRole)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header showNavigation={false} />
      <div className="flex items-center justify-center bg-gradient-to-b from-muted/40 to-background dark:from-black/20 dark:to-background py-20">
        <div className="max-w-md w-full space-y-8 px-4">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-foreground">
              Join LearnTrack
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your {selectedRole} account to get started
            </p>
          </div>
          <div className="transform transition-all duration-300 hover:scale-[1.02] motion-reduce:hover:scale-100">
            <SignUp
              routing="path"
              path="/sign-up"
              redirectUrl="/dashboard"
              signInUrl="/sign-in"
              unsafeMetadata={{
                role: selectedRole
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
