import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  type: 'error' | 'success' | 'warning'
  onClose: () => void
  duration?: number
}

function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true))

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for exit animation
    }, duration)

    return () => clearTimeout(timer)
  }, [onClose, duration])

  const styles = {
    error: {
      bg: 'bg-gradient-to-r from-coral to-rose-500',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
    success: {
      bg: 'bg-gradient-to-r from-emerald-500 to-teal',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500 to-gold',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
  }[type]

  return (
    <div
      className={`fixed top-5 left-1/2 z-50 ${styles.bg} text-white rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-[90%] md:max-w-md transition-all duration-300 ${
        isVisible
          ? 'opacity-100 -translate-x-1/2 translate-y-0'
          : 'opacity-0 -translate-x-1/2 -translate-y-4'
      }`}
      style={{ paddingInline: '1.25rem', paddingBlock: '0.875rem' }}
      role="alert"
    >
      <div className="flex-shrink-0 p-1 bg-white/15 rounded-lg">{styles.icon}</div>
      <p className="flex-1 text-sm font-semibold leading-snug">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="flex-shrink-0 hover:bg-white/20 rounded-lg p-1.5 transition-colors"
        aria-label="إغلاق"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  )
}

export default Toast
