"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useAuth } from "@clerk/nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Eye, GraduationCap, Play, Check, BarChart3, MessageCircle, Star, TrendingUp, Clock, Award, Brain, Target } from "lucide-react"

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
  const router = useRouter()

  useEffect(() => {
    if (isSignedIn) {
      getUserRole(getToken).then(role => {
        if (role) {
          switch (role) {
            case 'tutor':
              router.push('/tutor-dashboard');
              break;
            case 'student':
              router.push('/student-dashboard');
              break;
            case 'parent':
              router.push('/parent-dashboard');
              break;
            default:
              router.push('/role-setup');
              break;
          }
        }
      });
    }
  }, [isSignedIn, getToken, router]);

  const handleGetStarted = () => {
    router.push('/sign-up')
  }

  const handleSignIn = () => {
    router.push('/sign-in')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation - Enhanced with Academic Credibility */}
      <header className="relative bg-white border-b border-gray-100 sticky top-0 z-50">
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
              <span className="text-xl font-bold text-gray-900">LearnTrack</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="relative text-gray-600 hover:text-purple-600 transition-all duration-300 motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100 group">
                <span className="relative z-10">Features</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none origin-left"></span>
              </a>
              <a href="#" className="relative text-gray-600 hover:text-purple-600 transition-all duration-300 motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100 group">
                <span className="relative z-10">Solutions</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none origin-left"></span>
              </a>
              <a href="#" className="relative text-gray-600 hover:text-purple-600 transition-all duration-300 motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100 group">
                <span className="relative z-10">Pricing</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none origin-left"></span>
              </a>
              <a href="#" className="relative text-gray-600 hover:text-purple-600 transition-all duration-300 motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100 group">
                <span className="relative z-10">About</span>
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 motion-reduce:transition-none origin-left"></span>
              </a>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {isSignedIn ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                  </span>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    variant="outline"
                    className="transition-all duration-300 hover:scale-105 motion-reduce:hover:scale-100"
                  >
                    Dashboard
                  </Button>
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <>
                  <button
                    onClick={handleSignIn}
                    className="text-gray-600 hover:text-purple-600 transition-all duration-300 motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100 px-3 py-2 rounded-lg hover:bg-purple-50"
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

      {/* Hero Section - Enhanced with Academic Background Pattern */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white py-20 overflow-hidden">
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
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Star className="h-4 w-4" />
            <span>AI-Powered Learning Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Teaching Journey
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
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
            <button className="group flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-all duration-300 motion-reduce:transition-none border border-gray-300 px-6 py-4 rounded-full hover:border-purple-300 hover:shadow-md hover:scale-105 motion-reduce:hover:scale-100">
              <Play className="h-5 w-5 group-hover:scale-110 group-hover:text-purple-600 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100" />
              <span className="text-lg font-medium group-hover:translate-x-1 transition-transform duration-300 motion-reduce:transition-none motion-reduce:hover:translate-x-0">Watch Demo</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-6">Trusted by 10,000+ educators worldwide</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-gray-400 font-semibold">EduTech</div>
              <div className="text-gray-400 font-semibold">SmartLearn</div>
              <div className="text-gray-400 font-semibold">TeachPro</div>
              <div className="text-gray-400 font-semibold">StudyMax</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* AI Questions */}
            <div className="group text-center p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Questions</h3>
              <p className="text-gray-600">Generate unlimited questions</p>
            </div>

            {/* Real-time Analytics */}
            <div className="group text-center p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Analytics</h3>
              <p className="text-gray-600">Track student progress</p>
            </div>

            {/* Parent Connect */}
            <div className="group text-center p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:-translate-y-2 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                <MessageCircle className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Parent Connect</h3>
              <p className="text-gray-600">Seamless communication</p>
            </div>
          </div>
        </div>
      </section>

      {/* Everything You Need in One Platform Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="h-4 w-4" />
              <span>Powerful Features</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need in{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                One Platform
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              LearnTrack provides cutting-edge tools that modern educators need to create engaging learning experiences.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Feature List */}
            <div className="space-y-8">
              {/* AI Question Generation */}
              <div className="group flex items-start space-x-4 p-6 rounded-2xl transition-all duration-300 motion-reduce:transition-none">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 mb-2 transition-colors duration-300 motion-reduce:transition-none">AI Question Generation</h3>
                  <p className="text-gray-600 mb-3">Transform any prompt into comprehensive questions.<br />Our AI understands context and creates personalized<br />assessments that match your teaching style.</p>
                </div>
              </div>

              {/* Smart Progress Tracking */}
              <div className="group flex items-start space-x-4 p-6 rounded-2xl transition-all duration-300 motion-reduce:transition-none">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 mb-2 transition-colors duration-300 motion-reduce:transition-none">Smart Progress Tracking</h3>
                  <p className="text-gray-600 mb-3">Monitor student progress with intelligent analytics.<br />Identify learning patterns and provide targeted support<br />exactly when it's needed.</p>
                </div>
              </div>

              {/* Parent Engagement Hub */}
              <div className="group flex items-start space-x-4 p-6 rounded-2xl transition-all duration-300 motion-reduce:transition-none">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 mb-2 transition-colors duration-300 motion-reduce:transition-none">Parent Engagement Hub</h3>
                  <p className="text-gray-600 mb-3">Build stronger connections with automated updates,<br />detailed progress reports, and seamless communication<br />tools for parents.</p>
                </div>
              </div>
            </div>

            {/* Right Side - AI-Powered Dashboard Preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">AI-Powered Dashboard</h3>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Live</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700 text-sm">Question generation from prompts</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 text-sm">Automated grading and feedback</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-700 text-sm">Personalized learning insights</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-700 text-sm">Advanced progress analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Designed for Every User Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="h-4 w-4" />
              <span>User Experiences</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Designed for{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Every User
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored experiences that make teaching, learning, and monitoring progress intuitive and effective.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Tutor Dashboard Card */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-200 group-hover:scale-110 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tutor Dashboard</h3>
              <p className="text-gray-600 mb-6">Complete assignment management with AI-powered question generation</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  AI question generation that extends
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Advanced student progress tracking
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Direct assignment scheduling
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Comprehensive analytics dashboard
                </li>
              </ul>


            </div>

            {/* Student Portal Card */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 border border-gray-100">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-200 group-hover:scale-110 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Student Portal</h3>
              <p className="text-gray-600 mb-6">Engaging interface for completing assignments and tracking personal progress</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Interactive assignment experience
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Real-time feedback and scoring
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Personal progress visualization
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Achievement and reward tracking
                </li>
              </ul>


            </div>

            {/* Parent Dashboard Card */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0 border border-gray-100">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-200 group-hover:scale-110 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Parent Dashboard</h3>
              <p className="text-gray-600 mb-6">Comprehensive view of your child's learning journey and achievements</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Real-time progress monitoring
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Detailed performance insights
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Assignment completion tracking
                </li>
                <li className="flex items-center text-gray-700">
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                  Direct tutor communication
                </li>
              </ul>


            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Proven Results That Transform Education
          </h2>
          <p className="text-xl text-purple-100 mb-16 max-w-3xl mx-auto">
            Join thousands of educators who have revolutionized their teaching with LearnTrack's intelligent platform
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="group text-center">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                98%
              </div>
              <div className="text-purple-100 font-medium">Student Engagement Rate</div>
            </div>
            <div className="group text-center">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                60%
              </div>
              <div className="text-purple-100 font-medium">Time Saved on Grading</div>
            </div>
            <div className="group text-center">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                50K+
              </div>
              <div className="text-purple-100 font-medium">Questions Generated</div>
            </div>
            <div className="group text-center">
              <div className="text-5xl md:text-6xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100">
                99%
              </div>
              <div className="text-purple-100 font-medium">Parent Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Star className="h-4 w-4" />
            <span>Start Your Transformation</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Revolutionize{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Your Teaching?
            </span>
          </h2>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Join thousands of educators who are creating more engaging, effective, and efficient learning experiences with LearnTrack.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:scale-105 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:scale-100 flex items-center space-x-2"
            >
              <span>Start Your Free Trial</span>
              <span>→</span>
            </button>
            <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-full text-lg font-semibold hover:border-purple-300 hover:text-purple-600 transition-all duration-200 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100">
              Schedule a Demo
            </button>
          </div>

          <p className="text-sm text-gray-500">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">LearnTrack</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering educators worldwide with AI-powered assignment management and intelligent student progress tracking.
              </p>
              <div className="flex space-x-4 text-sm text-gray-400">
                <span>10K+ Educators</span>
                <span>50K+ Students</span>
                <span>98% Satisfaction</span>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-all duration-300 motion-reduce:transition-none hover:translate-x-1 motion-reduce:hover:translate-x-0 inline-block hover:text-purple-300">Features</a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 motion-reduce:transition-none hover:translate-x-1 motion-reduce:hover:translate-x-0 inline-block hover:text-purple-300">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 motion-reduce:transition-none hover:translate-x-1 motion-reduce:hover:translate-x-0 inline-block hover:text-purple-300">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 motion-reduce:transition-none hover:translate-x-1 motion-reduce:hover:translate-x-0 inline-block hover:text-purple-300">API</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-all duration-300 motion-reduce:transition-none hover:translate-x-1 motion-reduce:hover:translate-x-0 inline-block hover:text-purple-300">About</a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 motion-reduce:transition-none hover:translate-x-1 motion-reduce:hover:translate-x-0 inline-block hover:text-purple-300">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 motion-reduce:transition-none hover:translate-x-1 motion-reduce:hover:translate-x-0 inline-block hover:text-purple-300">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-all duration-300 motion-reduce:transition-none hover:translate-x-1 motion-reduce:hover:translate-x-0 inline-block hover:text-purple-300">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LearnTrack. All rights reserved. Built with ❤️ for educators worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
