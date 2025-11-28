import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useUser, UserButton } from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import {
  Layers, Check, Star, ArrowRight, ChevronDown, Brain, Users, BarChart3
} from "lucide-react"
import { FeatureCarousel } from "@/components/ui/feature-carousel"
import { EtherealShadow } from "@/components/ui/ethereal-shadow"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function HomePage() {
  const { isSignedIn, user } = useUser()
  const navigate = useNavigate()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // No automatic redirect - let users view the homepage even when signed in

  const handleSignUp = () => navigate('/get-started')
  const handleSignIn = () => navigate('/sign-in')

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden selection:bg-primary selection:text-primary-foreground">

      {/* Fixed Navbar */}
      <nav className="fixed w-full top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">LearnTrack</span>
          </a>

          {/* Nav Links - Centered */}
          <div className="hidden md:flex items-center gap-8 text-lg font-medium text-muted-foreground absolute left-1/2 transform -translate-x-1/2">
            <a href="#" className="hover:text-foreground transition-colors relative group">
              Home
              <span className="w-1.5 h-1.5 bg-primary rounded-full absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all"></span>
            </a>
            <a href="#features" className="hover:text-foreground transition-colors relative group">
              Features
              <span className="w-1.5 h-1.5 bg-primary rounded-full absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all"></span>
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors relative group">
              Pricing
              <span className="w-1.5 h-1.5 bg-primary rounded-full absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all"></span>
            </a>
            <a href="#" className="hover:text-foreground transition-colors relative group">
              About
              <span className="w-1.5 h-1.5 bg-primary rounded-full absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all"></span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {isSignedIn ? (
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  Dashboard
                </Button>
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline text-sm text-muted-foreground">
                    {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0]}
                  </span>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-9 h-9"
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with Ethereal Shadow */}
      <section className="relative min-h-[90vh] overflow-hidden">
        <EtherealShadow className="absolute inset-0" />

        <div className="relative z-10 pt-32 pb-20 lg:pt-40 lg:pb-32 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-7xl font-medium tracking-tight text-foreground leading-[1.1]">
                Transform Your <br/>
                <span className="text-primary relative inline-block">
                  Teaching Journey
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-accent -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="8" fill="none" />
                  </svg>
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Create engaging assignments with AI, track student progress in real-time, and connect with parents—all in one intelligent platform.
              </p>
              <button
                onClick={handleSignUp}
                className="group bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium text-lg hover:opacity-90 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Illustration */}
            <div className="relative h-[500px] w-full flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square">
                {/* Floating Elements */}
                <div className="absolute top-0 right-10 animate-bounce z-20" style={{ animationDuration: '3s' }}>
                  <div className="bg-primary p-4 rounded-2xl shadow-xl transform rotate-12">
                    <Brain className="w-12 h-12 text-primary-foreground" />
                  </div>
                </div>

                <div className="absolute bottom-20 left-0 animate-bounce z-20" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                  <div className="bg-accent p-4 rounded-2xl shadow-xl transform -rotate-12">
                    <Users className="w-12 h-12 text-accent-foreground" />
                  </div>
                </div>

                <div className="absolute top-1/2 right-0 animate-bounce z-20" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
                  <div className="bg-secondary p-3 rounded-full shadow-xl">
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                </div>

                {/* Central Dashboard Graphic */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-64 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden transform hover:scale-105 transition-transform duration-500">
                  <div className="h-full w-full bg-card p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-muted rounded-lg p-4 flex items-center justify-center">
                      <span className="text-primary font-bold text-2xl tracking-tight">LearnTrack</span>
                      <BarChart3 className="w-8 h-8 text-accent ml-2" />
                    </div>
                    <div className="h-2 w-2/3 bg-muted rounded-full"></div>
                    <div className="h-2 w-1/2 bg-muted rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="max-w-4xl mx-auto mt-12 bg-card border border-border rounded-2xl p-8 shadow-xl relative z-20 transform lg:-translate-y-12">
          <div className="grid grid-cols-3 gap-8 divide-x divide-border text-center">
            <div className="group">
              <h3 className="text-4xl font-semibold text-foreground tracking-tight mb-1 group-hover:scale-110 transition-transform duration-300">10k+</h3>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Educators</p>
            </div>
            <div className="group">
              <h3 className="text-4xl font-semibold text-foreground tracking-tight mb-1 group-hover:scale-110 transition-transform duration-300">500k+</h3>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Questions Generated</p>
            </div>
            <div className="group">
              <h3 className="text-4xl font-semibold text-foreground tracking-tight mb-1 group-hover:scale-110 transition-transform duration-300">95%</h3>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Career Outcomes / Benefits Section */}
      <section id="features" className="py-24 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-medium tracking-tight text-foreground mb-6">Everything you need to succeed</h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-10">
              95% of educators report significant time savings and improved student outcomes with LearnTrack's AI-powered tools.
            </p>
            <button
              onClick={handleSignUp}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-medium text-lg hover:opacity-90 hover:shadow-xl transition-all duration-300"
            >
              Start Your Free Trial
            </button>
          </div>
          <div className="relative">
            <div className="relative h-[500px] w-full rounded-tl-3xl rounded-tr-[100px] rounded-bl-3xl rounded-br-3xl overflow-hidden shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                alt="Classroom Learning"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-500"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Carousel Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-medium tracking-tight text-foreground mb-4">
              Powerful Features for Modern Education
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to create, manage, and track educational content — all in one place.
            </p>
          </div>
          <FeatureCarousel />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-medium tracking-tight text-foreground mb-4">
              Loved by Educators Worldwide
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See what teachers, students, and parents are saying about LearnTrack
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-border">
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                "LearnTrack has revolutionized how I create assignments. The AI generates perfect questions for my curriculum, saving me hours every week."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-lg">SM</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Sarah Mitchell</div>
                  <div className="text-sm text-muted-foreground">High School Math Teacher</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-border">
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                "As a parent, I love seeing my daughter's progress in real-time. The detailed reports help me support her learning at home."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">MJ</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Michael Johnson</div>
                  <div className="text-sm text-muted-foreground">Parent</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-border">
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                "The practice questions are exactly what I need to prepare for exams. I can see my improvement week by week!"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center">
                  <span className="text-accent-foreground font-semibold text-lg">AL</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">Alex Lee</div>
                  <div className="text-sm text-muted-foreground">Grade 11 Student</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-card">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-medium tracking-tight text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about LearnTrack
            </p>
          </div>

          <div className="space-y-4">
            {[
              { q: "How does the AI question generation work?", a: "Our AI analyzes your curriculum materials and learning objectives to generate relevant, high-quality questions. You can specify difficulty levels, question types, and topics to get exactly what you need." },
              { q: "Can parents see their child's progress?", a: "Yes! Parents get access to a dedicated dashboard where they can view their child's assignments, grades, progress over time, and communicate directly with teachers." },
              { q: "Is there a free trial available?", a: "Absolutely! We offer a 14-day free trial with full access to all Pro features. No credit card required to start." },
              { q: "How secure is student data?", a: "We take data security seriously. All data is encrypted, we're FERPA compliant, and we never share student information with third parties." },
              { q: "Can I integrate LearnTrack with my existing LMS?", a: "Yes, we offer integrations with popular LMS platforms including Google Classroom, Canvas, and Schoology. Enterprise plans include custom integration support." }
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-muted rounded-2xl overflow-hidden border border-border"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-secondary transition-colors"
                >
                  <span className="text-lg font-medium text-foreground">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-48' : 'max-h-0'}`}>
                  <p className="px-8 pb-6 text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-medium tracking-tight text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that works best for your educational needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-border">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-medium text-foreground mb-2">Free</h3>
                <div className="text-5xl font-semibold text-foreground mb-2">$0</div>
                <p className="text-muted-foreground">Perfect for getting started</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Up to 50 questions/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Basic progress tracking</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Email support</span>
                </li>
              </ul>
              <button
                onClick={handleSignUp}
                className="w-full bg-secondary text-foreground py-4 rounded-xl font-medium transition-all duration-300 hover:bg-muted"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-card rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2 border-primary">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-6 py-1.5 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-medium text-foreground mb-2">Pro</h3>
                <div className="text-5xl font-semibold text-foreground mb-2">$29</div>
                <p className="text-muted-foreground">Per month, per teacher</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Unlimited questions</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Parent dashboard</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Priority support</span>
                </li>
              </ul>
              <button
                onClick={handleSignUp}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-medium transition-all duration-300 hover:opacity-90 hover:shadow-lg"
              >
                Start Pro Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-card rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-border">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-medium text-foreground mb-2">Enterprise</h3>
                <div className="text-5xl font-semibold text-foreground mb-2">Custom</div>
                <p className="text-muted-foreground">For schools and districts</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Custom integrations</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Dedicated support</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">Training & onboarding</span>
                </li>
              </ul>
              <button className="w-full bg-secondary text-foreground py-4 rounded-xl font-medium transition-all duration-300 hover:bg-muted">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with CTA */}
      <footer className="bg-primary text-primary-foreground pt-24 pb-12 px-6 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-secondary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* CTA Section */}
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-medium tracking-tight mb-6">
              Ready to Transform Your Teaching?
            </h2>
            <p className="text-xl text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
              Join thousands of educators who are already using LearnTrack to create better learning experiences.
            </p>
            <button
              onClick={handleSignUp}
              className="group bg-background text-foreground px-10 py-4 rounded-xl font-medium text-lg hover:opacity-90 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 inline-flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Footer Links */}
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-9 h-9 bg-background rounded-lg flex items-center justify-center">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <span className="text-2xl font-semibold">LearnTrack</span>
              </div>
              <p className="text-primary-foreground/70 mb-6 leading-relaxed">
                Empowering educators with AI-powered tools for better learning outcomes.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                  <span className="text-sm font-semibold">f</span>
                </a>
                <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                  <span className="text-sm font-semibold">t</span>
                </a>
                <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                  <span className="text-sm font-semibold">in</span>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-lg mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="#features" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">API</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-lg mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-lg mb-6">Support</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-primary-foreground/10 pt-8 text-center">
            <p className="text-primary-foreground/50">
              © 2024 LearnTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
