import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check2 } from 'react-bootstrap-icons'
import './NeoSelect.css'

export default function NeoSelect({
  value = '',
  onChange,
  options = [],
  placeholder = '-- Pilih --',
  disabled = false,
  icon = null,
  style = {},
  className = '',
  id
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Normalize options array into { value, label, icon, disabled }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? String(opt.value) : '',
        label: opt.label !== undefined ? opt.label : String(opt.value || ''),
        icon: opt.icon || null,
        disabled: !!opt.disabled
      }
    }
    return {
      value: String(opt),
      label: String(opt),
      icon: null,
      disabled: false
    }
  })

  // Find currently selected item
  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value))

  // Outside click & ESC listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (optVal, optDisabled) => {
    if (optDisabled) return
    if (onChange) {
      onChange(optVal)
    }
    setIsOpen(false)
  }

  return (
    <div
      className={`neo-select-container ${className}`}
      ref={containerRef}
      style={style}
      id={id}
    >
      <button
        type="button"
        className={`neo-select-trigger ${isOpen ? 'is-open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="neo-select-label-wrapper">
          {selectedOption?.icon || icon}
          {selectedOption ? (
            <span>{selectedOption.label}</span>
          ) : (
            <span className="neo-select-placeholder">{placeholder}</span>
          )}
        </div>
        <span className={`neo-select-chevron ${isOpen ? 'rotated' : ''}`}>
          <ChevronDown size={14} />
        </span>
      </button>

      {isOpen && !disabled && (
        <div className="neo-select-dropdown" role="listbox">
          {normalizedOptions.length === 0 ? (
            <div className="neo-select-empty">Tidak ada pilihan</div>
          ) : (
            normalizedOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  className={`neo-select-option ${isSelected ? 'is-selected' : ''} ${opt.disabled ? 'disabled' : ''}`}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  disabled={opt.disabled}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="neo-select-option-content">
                    {opt.icon}
                    <span>{opt.label}</span>
                  </span>
                  {isSelected && <Check2 size={16} color="#000000" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
