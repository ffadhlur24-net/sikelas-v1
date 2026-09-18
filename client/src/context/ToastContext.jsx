import { createContext, useContext, useState, useCallback } from 'react'
import ToastContainer from '../components/Toast/ToastContainer'

export const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info', title = null, duration = 4000) => {
    const id = Date.now() + '-' + Math.random().toString(36).substring(2, 9)
    const newToast = { id, message, type, title, duration }
    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const showSuccess = useCallback((message, title = 'BERHASIL', duration = 4000) => {
    return showToast(message, 'success', title, duration)
  }, [showToast])

  const showError = useCallback((message, title = 'TERJADI KESALAHAN', duration = 4000) => {
    return showToast(message, 'error', title, duration)
  }, [showToast])

  const showWarning = useCallback((message, title = 'PERINGATAN', duration = 4000) => {
    return showToast(message, 'warning', title, duration)
  }, [showToast])

  const showInfo = useCallback((message, title = 'INFORMASI', duration = 4000) => {
    return showToast(message, 'info', title, duration)
  }, [showToast])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeToast
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
