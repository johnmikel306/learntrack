"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { Check, Brain, BarChart3, Users, FileText } from "lucide-react"

interface Step {
  id: string
  name: string
  title: string
  description: string
  icon: React.ReactNode
  image: string
}

const steps: Step[] = [
  {
    id: "1",
    name: "AI Generation",
    title: "AI-Powered Question Generation",
    description: "Generate high-quality questions from your curriculum materials instantly. Support for MCQ, True/False, Short Answer, and Essay questions.",
    icon: <Brain className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  },
  {
    id: "2",
    name: "Analytics",
    title: "Real-time Performance Analytics",
    description: "Track student progress with detailed insights. Identify learning gaps and celebrate achievements with comprehensive dashboards.",
    icon: <BarChart3 className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  },
  {
    id: "3",
    name: "Collaboration",
    title: "Parent & Teacher Engagement",
    description: "Keep parents informed with real-time updates. Enable seamless communication between teachers, students, and parents.",
    icon: <Users className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
  },
  {
    id: "4",
    name: "Assignments",
    title: "Smart Assignment Management",
    description: "Create, distribute, and grade assignments effortlessly. Auto-grading for MCQs saves hours of manual work.",
    icon: <FileText className="w-8 h-8" />,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
  },
]

function useNumberCycler(totalSteps: number = 4, interval: number = 5000) {
  const [currentNumber, setCurrentNumber] = useState(0)
  const timerRef = useRef<NodeJS.Timeout>()

  const setupTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCurrentNumber((prev) => (prev + 1) % totalSteps)
      setupTimer()
    }, interval)
  }, [interval, totalSteps])

  const setStep = useCallback((index: number) => {
    setCurrentNumber(index)
    setupTimer()
  }, [setupTimer])

  useEffect(() => {
    setupTimer()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [setupTimer])

  return { currentNumber, setStep }
}

export function FeatureCarousel() {
  const { currentNumber: step, setStep } = useNumberCycler()

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="rounded-[28px] bg-primary/10 dark:bg-primary/5 p-2">
        <div className="relative z-10 rounded-[24px] bg-card border border-border overflow-hidden">
          {/* Step Navigation */}
          <nav className="flex justify-center px-4 py-6 border-b border-border">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {steps.map((s, idx) => {
                const isCompleted = step > idx
                const isCurrent = step === idx
                return (
                  <motion.button
                    key={s.id}
                    onClick={() => setStep(idx)}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                      isCurrent && "bg-primary text-primary-foreground",
                      isCompleted && "bg-primary/20 text-primary",
                      !isCurrent && !isCompleted && "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="flex items-center gap-2">
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-xs",
                          isCurrent ? "bg-primary-foreground/20" : "bg-foreground/10"
                        )}>
                          {idx + 1}
                        </span>
                      )}
                      <span className="hidden sm:inline">{s.name}</span>
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </nav>

          {/* Content Area */}
          <div className="grid lg:grid-cols-2 min-h-[450px]">
            {/* Text Content */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="space-y-6"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    {steps[step].icon}
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
                    {steps[step].title}
                  </h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {steps[step].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Image Area */}
            <div className="relative bg-muted overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={step}
                  src={steps[step].image}
                  alt={steps[step].title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeatureCarousel

