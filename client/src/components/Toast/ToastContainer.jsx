import { useEffect, useRef } from 'react'
import {
  CheckCircleFill,
  XCircleFill,
  ExclamationTriangleFill,
  InfoCircleFill,
  X
} from 'react-bootstrap-icons'
import './ToastContainer.css'

function ToastItem({ toast, onRemove }) {
  const { id, message, type = 'info', title, duration = 4000 } = toast
  const timerRef = useRef(null)
  const startTimeRef = useRef(Date.now())
  const remainingTimeRef = useRef(duration)

  // Start timer
  const startTimer = () => {
    startTimeRef.current = Date.now()
    timerRef.current = setTimeout(() => {
      onRemove(id)
    }, remainingTimeRef.current)
  }

  // Pause timer on hover
  const pauseTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      const elapsed = Date.now() - startTimeRef.current
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
    }
  }

  useEffect(() => {
    startTimer()
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  // Icon selector
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleFill />
      case 'error':
        return <XCircleFill />
      case 'warning':
        return <ExclamationTriangleFill />
      case 'info':
      default:
        return <InfoCircleFill />
    }
  }

  // Default title
  const getDefaultTitle = () => {
    switch (type) {
      case 'success':
        return 'BERHASIL'
      case 'error':
        return 'TERJADI KESALAHAN'
      case 'warning':
        return 'PERINGATAN'
      case 'info':
      default:
        return 'INFORMASI'
    }
  }

  return (
    <div
      className={`neo-toast-item type-${type}`}
      role="alert"
      aria-live="polite"
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
    >
      <div className="neo-toast-icon-wrap" aria-hidden="true">
        {getIcon()}
      </div>

      <div className="neo-toast-body">
        <div className="neo-toast-title">
          {title || getDefaultTitle()}
        </div>
        <div className="neo-toast-msg">{message}</div>
      </div>

      <button
        type="button"
        className="neo-toast-close"
        onClick={() => onRemove(id)}
        aria-label="Tutup notifikasi"
      >
        <X size={20} />
      </button>

      <div className="neo-toast-progress-track" aria-hidden="true">
        <div
          className="neo-toast-progress-bar"
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="neo-toast-container" aria-label="Notifikasi sistem">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

export default ToastContainer
