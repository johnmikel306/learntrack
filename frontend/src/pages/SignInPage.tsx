import { SignIn } from '@clerk/clerk-react'
import { Header } from '@/components/ui/header'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header showNavigation={false} />
      <div className="flex items-center justify-center bg-gradient-to-b from-muted/40 to-background dark:from-black/20 dark:to-background py-20">
        <div className="max-w-md w-full space-y-8 px-4">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-foreground">
              Sign in to LearnTrack
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Access your personalized learning dashboard
            </p>
          </div>
          <div className="transform transition-all duration-300 hover:scale-[1.02] motion-reduce:hover:scale-100">
            <SignIn
              routing="path"
              path="/sign-in"
              redirectUrl="/dashboard"
              signUpUrl="/sign-up"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
