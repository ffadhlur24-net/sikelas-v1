import React, { useEffect } from 'react'
import { ExclamationTriangleFill, TrashFill, InfoCircleFill, X } from 'react-bootstrap-icons'
import './ConfirmModal.css'

function ConfirmModal({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  onConfirm,
  onCancel
}) {
  // ESC key to cancel
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, loading, onCancel])

  if (!isOpen) return null

  const getIcon = () => {
    if (variant === 'danger') return <TrashFill size={20} />
    if (variant === 'warning') return <ExclamationTriangleFill size={20} />
    return <InfoCircleFill size={20} />
  }

  return (
    <div className="neo-confirm-backdrop" onClick={() => !loading && onCancel()}>
      <div
        className={`neo-confirm-card neo-confirm-${variant}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="neo-confirm-header">
          <div className="neo-confirm-title-wrap">
            <span className={`neo-confirm-icon neo-confirm-icon-${variant}`}>
              {getIcon()}
            </span>
            <h3 className="neo-confirm-title">{title}</h3>
          </div>
          <button
            type="button"
            className="neo-confirm-close"
            onClick={onCancel}
            disabled={loading}
            aria-label="Tutup"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content Body */}
        <div className="neo-confirm-body">
          {typeof message === 'string' ? (
            <p className="neo-confirm-message">{message}</p>
          ) : (
            message
          )}
        </div>

        {/* Actions Footer */}
        <div className="neo-confirm-actions">
          <button
            type="button"
            className="neo-confirm-btn neo-confirm-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`neo-confirm-btn neo-confirm-btn-${variant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
