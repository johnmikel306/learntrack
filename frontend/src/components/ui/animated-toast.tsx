"use client"

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

export type ToastType = "success" | "error" | "info" | "warning"

export interface ToastProps {
  id: string
  message: string
  description?: string
  type?: ToastType
  duration?: number
  onClose?: (id: string) => void
  isVisible?: boolean
  className?: string
}

const toastIcons = {
  success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
}

const toastClasses = {
  success:
    "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
  error: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
  warning:
    "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
  info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
}

export function AnimatedToast({
  id,
  message,
  description,
  type = "info",
  duration = 3000,
  onClose,
  isVisible = true,
  className = "",
}: ToastProps) {
  const [visible, setVisible] = useState(isVisible)

  useEffect(() => {
    setVisible(isVisible)
  }, [isVisible])

  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        onClose?.(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose, id])

  const handleClose = () => {
    setVisible(false)
    onClose?.(id)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`flex w-80 items-start gap-3 rounded-lg border p-4 shadow-lg ${toastClasses[type]} ${className}`}
          initial={{ opacity: 0, x: 50, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{
            opacity: 0,
            x: 50,
            scale: 0.8,
            transition: { duration: 0.15 },
          }}
          transition={{ type: "spring", bounce: 0.25 }}
          layout
        >
          <div className="flex-shrink-0 mt-0.5">{toastIcons[type]}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{message}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastProps[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <AnimatedToast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}

