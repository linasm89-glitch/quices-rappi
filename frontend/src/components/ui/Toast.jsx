import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext(null)

const MAX_TOASTS = 3
const AUTO_DISMISS_MS = 3000

let toastId = 0

function generateId() {
  return ++toastId
}

// ─── Toast Item ──────────────────────────────────────────────────────────────

const TOAST_STYLES = {
  success: {
    bg: 'bg-white border-green-400',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  error: {
    bg: 'bg-white border-red-400',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  info: {
    bg: 'bg-white border-blue-400',
    icon: Info,
    iconColor: 'text-blue-500',
  },
}

function ToastItem({ toast, onDismiss }) {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info
  const Icon = style.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`flex items-start gap-3 w-full max-w-sm rounded-xl border shadow-lg px-4 py-3 ${style.bg}`}
      role="alert"
    >
      <Icon size={18} className={`mt-0.5 flex-shrink-0 ${style.iconColor}`} />
      <p className="text-sm text-gray-800 font-medium flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const addToast = useCallback((type, message) => {
    const id = generateId()

    setToasts((prev) => {
      const next = [...prev, { id, type, message }]
      // Keep only the last MAX_TOASTS
      if (next.length > MAX_TOASTS) {
        const removed = next.splice(0, next.length - MAX_TOASTS)
        removed.forEach((t) => {
          if (timers.current[t.id]) {
            clearTimeout(timers.current[t.id])
            delete timers.current[t.id]
          }
        })
      }
      return next
    })

    timers.current[id] = setTimeout(() => {
      dismiss(id)
    }, AUTO_DISMISS_MS)
  }, [dismiss])

  const toast = {
    success: (msg) => addToast('success', msg),
    error:   (msg) => addToast('error', msg),
    info:    (msg) => addToast('info', msg),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container — bottom-center on mobile, bottom-right on desktop */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-50 flex flex-col gap-2 items-center sm:items-end w-[calc(100vw-2rem)] sm:w-auto"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
