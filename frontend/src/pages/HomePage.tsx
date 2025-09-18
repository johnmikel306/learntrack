import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useUser, useAuth } from "@clerk/clerk-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Eye, GraduationCap, Play, Check, BarChart3, MessageCircle, Star, TrendingUp, Clock, Award, Brain, Target } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"


async function getUserRole(getToken: () => Promise<string | null>): Promise<string | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const user = await response.json();
    return user.role;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

export default function HomePage() {
  const { isSignedIn, user } = useUser()
  const { getToken } = useAuth();
  const navigate = useNavigate()

  useEffect(() => {
    if (isSignedIn) {
      getUserRole(getToken).then(role => {
        if (role) {
          switch (role) {
            case 'tutor':
              navigate('/tutor-dashboard');
              break;
            case 'student':
              navigate('/student-dashboard');
              break;
            case 'parent':
              navigate('/parent-dashboard');
              break;
            default:
              navigate('/role-setup');
              break;
          }
        }
      });
    }
  }, [isSignedIn, getToken, navigate]);

  const handleGetStarted = () => {
    navigate('/sign-up')
  }

  const handleSignIn = () => {
    navigate('/sign-in')
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Header Navigation - Enhanced with Academic Credibility */}
      <header className="relative bg-background border-b border-border/60 sticky top-0 z-50">
        {/* Subtle Academic Pattern in Header - MIT-inspired clean institutional look */}
        <div className="absolute inset-0 opacity-[0.015]">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(90deg, #6366f1 0.5px, transparent 0.5px),
              linear-gradient(180deg, #6366f1 0.5px, transparent 0.5px)
            `,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">LearnTrack</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="relative text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400 transition-all duration-300 motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100 group">
                <span className="relative z-10">Features</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none origin-left"></span>
              </a>
              <a href="#" className="relative text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400 transition-all duration-300 motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100 group">
                <span className="relative z-10">Solutions</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none origin-left"></span>
              </a>
              <a href="#" className="relative text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400 transition-all duration-300 motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100 group">
                <span className="relative z-10">Pricing</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none origin-left"></span>
              </a>
              <a href="#" className="relative text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400 transition-all duration-300 motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100 group">
                <span className="relative z-10">About</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none origin-left"></span>
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />

              {isSignedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                  </span>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="outline"
                    className="transition-all duration-300 hover:scale-105 motion-reduce:hover:scale-100"
                  >
                    Dashboard
                  </Button>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleSignIn}
                    className="text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400 transition-all duration-300 motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100 px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-white/5"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all duration-300 hover:scale-105 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:scale-100 transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Enhanced with Academic Background Pattern and dark mode */}
      <section className="relative bg-gradient-to-b from-muted/40 to-background dark:from-black/20 dark:to-background py-20 overflow-hidden">
        {/* Academic Background Pattern - Inspired by Harvard's institutional design */}
        <div className="absolute inset-0 opacity-[0.03]">
          {/* Geometric Grid Pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(90deg, #6366f1 1px, transparent 1px),
              linear-gradient(180deg, #6366f1 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}></div>

          {/* Subtle Academic Icons Pattern - Inspired by Khan Academy's friendly approach */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-12 gap-16 opacity-50 transform rotate-12">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="w-8 h-8 text-purple-600">
                  {i % 4 === 0 && <BookOpen className="w-full h-full" />}
                  {i % 4 === 1 && <GraduationCap className="w-full h-full" />}
                  {i % 4 === 2 && <Brain className="w-full h-full" />}
                  {i % 4 === 3 && <Target className="w-full h-full" />}
                </div>
              ))}
            </div>
          </div>

          {/* Coursera-inspired Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 via-transparent to-blue-50/20"></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Star className="h-4 w-4" />
            <span>AI-Powered Learning Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Transform Your{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Teaching Journey
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Create engaging assignments with AI, track student progress in real-time, and connect with parents—all in one intelligent platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:scale-105 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:scale-100 flex items-center space-x-2"
            >
              <span>Start Free Trial</span>
              <span>→</span>
            </button>
            <button className="group flex items-center space-x-2 text-muted-foreground hover:text-purple-500 dark:hover:text-purple-400 transition-all duration-300 motion-reduce:transition-none border border-border px-6 py-4 rounded-full hover:border-purple-300 hover:shadow-md hover:scale-105 motion-reduce:hover:scale-100">
              <Play className="h-5 w-5 group-hover:scale-110 group-hover:text-purple-600 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100" />
              <span className="text-lg font-medium group-hover:translate-x-1 transition-transform duration-300 motion-reduce:transition-none motion-reduce:hover:translate-x-0">Watch Demo</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-6">Trusted by 10,000+ educators worldwide</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-muted-foreground/70 font-semibold">EduTech</div>
              <div className="text-muted-foreground/70 font-semibold">SmartLearn</div>
              <div className="text-muted-foreground/70 font-semibold">TeachPro</div>
              <div className="text-muted-foreground/70 font-semibold">StudyMax</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful tools designed for modern education, backed by AI technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 - AI-Powered Questions */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-2xl transform transition-all duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100 opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-card border border-border/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">AI Question Generation</h3>
                <p className="text-muted-foreground mb-6">
                  Generate unlimited practice questions tailored to your curriculum using advanced AI technology.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Multiple question types
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Difficulty adjustment
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Subject-specific content
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2 - Progress Tracking */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10 rounded-2xl transform transition-all duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100 opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-card border border-border/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Real-time Analytics</h3>
                <p className="text-muted-foreground mb-6">
                  Track student progress with detailed analytics and insights to improve learning outcomes.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Performance dashboards
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Learning patterns
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Progress reports
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3 - Collaboration */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600/10 to-red-600/10 rounded-2xl transform transition-all duration-300 group-hover:scale-105 motion-reduce:group-hover:scale-100 opacity-0 group-hover:opacity-100"></div>
              <div className="relative bg-card border border-border/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">Parent Engagement</h3>
                <p className="text-muted-foreground mb-6">
                  Keep parents informed with automated progress updates and detailed learning insights.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Weekly reports
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Real-time notifications
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Parent dashboard
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30 dark:bg-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How LearnTrack Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get started in minutes with our intuitive three-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto transition-all duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100 group-hover:shadow-lg">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <div className="absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-purple-600/50 to-transparent hidden md:block"></div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Create Your Account</h3>
              <p className="text-muted-foreground">
                Sign up and choose your role - tutor, student, or parent. Set up your profile in under 2 minutes.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto transition-all duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100 group-hover:shadow-lg">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <div className="absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-green-600/50 to-transparent hidden md:block"></div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Generate Content</h3>
              <p className="text-muted-foreground">
                Use our AI to create assignments, questions, and learning materials tailored to your needs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto transition-all duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100 group-hover:shadow-lg">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor learning progress with detailed analytics and share insights with parents and students.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Loved by Educators Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See what teachers, students, and parents are saying about LearnTrack
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="group">
              <div className="bg-card border border-border/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">
                  "LearnTrack has revolutionized how I create assignments. The AI generates perfect questions for my curriculum, saving me hours every week."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">SM</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Sarah Mitchell</div>
                    <div className="text-sm text-muted-foreground">High School Math Teacher</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="group">
              <div className="bg-card border border-border/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">
                  "As a parent, I love seeing my daughter's progress in real-time. The detailed reports help me support her learning at home."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">MJ</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Michael Johnson</div>
                    <div className="text-sm text-muted-foreground">Parent</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="group">
              <div className="bg-card border border-border/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">
                  "The practice questions are exactly what I need to prepare for exams. I can see my improvement week by week!"
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">AL</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Alex Lee</div>
                    <div className="text-sm text-muted-foreground">Grade 11 Student</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/30 dark:bg-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that works best for your educational needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="group">
              <div className="bg-card border border-border/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Free</h3>
                  <div className="text-4xl font-bold text-foreground mb-2">$0</div>
                  <p className="text-muted-foreground">Perfect for getting started</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Up to 50 questions/month</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Basic progress tracking</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Email support</span>
                  </li>
                </ul>
                <button className="w-full bg-muted text-foreground py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-muted/80 hover:scale-105 motion-reduce:hover:scale-100">
                  Get Started Free
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-card border border-border/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-foreground mb-2">$29</div>
                  <p className="text-muted-foreground">Per month, per teacher</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Unlimited questions</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Advanced analytics</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Parent dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Priority support</span>
                  </li>
                </ul>
                <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 motion-reduce:hover:scale-100">
                  Start Pro Trial
                </button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="group">
              <div className="bg-card border border-border/60 rounded-2xl p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 motion-reduce:hover:translate-y-0">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Enterprise</h3>
                  <div className="text-4xl font-bold text-foreground mb-2">Custom</div>
                  <p className="text-muted-foreground">For schools and districts</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Everything in Pro</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Custom integrations</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Dedicated support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-muted-foreground">Training & onboarding</span>
                  </li>
                </ul>
                <button className="w-full bg-muted text-foreground py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-muted/80 hover:scale-105 motion-reduce:hover:scale-100">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Join thousands of educators who are already using LearnTrack to create better learning experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 motion-reduce:hover:scale-100 hover:shadow-lg">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:bg-white hover:text-purple-600 hover:scale-105 motion-reduce:hover:scale-100">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 dark:bg-black/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1">
              <div className="flex items-center mb-4">
                <BookOpen className="h-8 w-8 text-purple-600 mr-3" />
                <span className="text-xl font-bold text-foreground">LearnTrack</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Empowering educators with AI-powered tools for better learning outcomes.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center transition-all duration-300 hover:bg-purple-600 hover:text-white cursor-pointer">
                  <span className="text-sm font-semibold">f</span>
                </div>
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center transition-all duration-300 hover:bg-purple-600 hover:text-white cursor-pointer">
                  <span className="text-sm font-semibold">t</span>
                </div>
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center transition-all duration-300 hover:bg-purple-600 hover:text-white cursor-pointer">
                  <span className="text-sm font-semibold">in</span>
                </div>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">API</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Integrations</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Contact</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/60 mt-12 pt-8 text-center">
            <p className="text-muted-foreground">
              © 2024 LearnTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
