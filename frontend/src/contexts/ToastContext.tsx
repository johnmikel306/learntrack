"use client"

import React, { createContext, useContext, useCallback, useState, useEffect } from "react"
import { ToastContainer, ToastType, ToastProps } from "@/components/ui/animated-toast"

interface ToastOptions {
  description?: string
  duration?: number
}

interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

let toastId = 0

// Global callback for imperative toast API
let globalToastCallback: ToastContextValue | null = null

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType, options?: ToastOptions) => {
      const id = `toast-${++toastId}`
      const newToast: ToastProps = {
        id,
        message,
        type,
        description: options?.description,
        duration: options?.duration ?? 3000,
        isVisible: true,
      }
      setToasts((prev) => [...prev, newToast])
      return id
    },
    []
  )

  const success = useCallback(
    (message: string, options?: ToastOptions) => addToast(message, "success", options),
    [addToast]
  )

  const error = useCallback(
    (message: string, options?: ToastOptions) => addToast(message, "error", options),
    [addToast]
  )

  const warning = useCallback(
    (message: string, options?: ToastOptions) => addToast(message, "warning", options),
    [addToast]
  )

  const info = useCallback(
    (message: string, options?: ToastOptions) => addToast(message, "info", options),
    [addToast]
  )

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  const contextValue: ToastContextValue = {
    success,
    error,
    warning,
    info,
    dismiss: removeToast,
    dismissAll,
  }

  // Register global callback for imperative API
  useEffect(() => {
    globalToastCallback = contextValue
    return () => {
      globalToastCallback = null
    }
  }, [contextValue])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  )
}

export function useAnimatedToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useAnimatedToast must be used within a ToastProvider")
  }
  return context
}

// Standalone toast object that can be used outside of React components
// This creates a simple imperative API similar to sonner
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    if (globalToastCallback) globalToastCallback.success(message, options)
  },
  error: (message: string, options?: ToastOptions) => {
    if (globalToastCallback) globalToastCallback.error(message, options)
  },
  warning: (message: string, options?: ToastOptions) => {
    if (globalToastCallback) globalToastCallback.warning(message, options)
  },
  info: (message: string, options?: ToastOptions) => {
    if (globalToastCallback) globalToastCallback.info(message, options)
  },
}

