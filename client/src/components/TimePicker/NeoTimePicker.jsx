import React, { useState, useRef, useEffect } from 'react'
import { ClockFill, LockFill, Check2 } from 'react-bootstrap-icons'
import './NeoTimePicker.css'

const MINUTE_OPTIONS = ['00', '10', '15', '20', '30', '40', '45', '50']

export default function NeoTimePicker({
  value = '08:00',
  onChange,
  minTime = '06:00',
  maxTime = '22:00',
  readOnly = false,
  disabled = false,
  placeholder = 'Pilih Jam...',
  style = {},
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Parse initial hour and minute
  const parseTime = (val) => {
    if (!val || typeof val !== 'string' || !val.includes(':')) {
      return { hour: '08', minute: '00' }
    }
    const [h, m] = val.split(':')
    return {
      hour: String(h).padStart(2, '0').substring(0, 2),
      minute: String(m).padStart(2, '0').substring(0, 2)
    }
  }

  const [selectedHour, setSelectedHour] = useState(() => parseTime(value).hour)
  const [selectedMinute, setSelectedMinute] = useState(() => parseTime(value).minute)

  // Sync state if external value changes
  useEffect(() => {
    if (value) {
      const parsed = parseTime(value)
      setSelectedHour(parsed.hour)
      setSelectedMinute(parsed.minute)
    }
  }, [value])

  // Generate selectable hours within minTime & maxTime
  const minHour = parseInt(minTime.split(':')[0], 10) || 6
  const maxHour = parseInt(maxTime.split(':')[0], 10) || 22
  const hourOptions = []
  for (let h = minHour; h <= maxHour; h++) {
    hourOptions.push(String(h).padStart(2, '0'))
  }

  // Handle outside click & ESC to close
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

  const applyTime = (h, m) => {
    const timeStr = `${h}:${m}`
    if (onChange) onChange(timeStr)
  }

  const handleSelectHour = (h) => {
    setSelectedHour(h)
    applyTime(h, selectedMinute)
  }

  const handleSelectMinute = (m) => {
    setSelectedMinute(m)
    applyTime(selectedHour, m)
  }

  const handleConfirm = () => {
    applyTime(selectedHour, selectedMinute)
    setIsOpen(false)
  }

  const displayTime = value ? `${value.substring(0, 5)} WIB` : placeholder

  return (
    <div className={`neo-time-picker-container ${className}`} ref={containerRef} style={style}>
      <button
        type="button"
        className={`neo-time-input-btn ${readOnly ? 'readonly' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (!readOnly && !disabled) {
            setIsOpen(!isOpen)
          }
        }}
        disabled={disabled}
        title={readOnly ? 'Jam ini terhitung otomatis' : 'Klik untuk memilih jam'}
      >
        <span className="neo-time-value-display">
          {readOnly ? (
            <LockFill size={15} color="#475569" />
          ) : (
            <ClockFill size={15} color="#0f172a" />
          )}
          <span>{displayTime}</span>
        </span>
      </button>

      {isOpen && !readOnly && !disabled && (
        <div className="neo-time-popover">
          {/* Clean Header */}
          <div className="neo-time-popover-header">
            <span className="neo-time-popover-title">PILIH JAM (WIB)</span>
          </div>

          {/* Dual Columns: Hour & Minute */}
          <div className="neo-time-columns">
            {/* Column Jam */}
            <div className="neo-time-col-box">
              <div className="neo-time-col-title">Jam (06 - 22)</div>
              <div className="neo-time-col-list">
                {hourOptions.map((h) => {
                  const isSel = selectedHour === h
                  return (
                    <button
                      key={h}
                      type="button"
                      className={`neo-time-slot-btn ${isSel ? 'selected' : ''}`}
                      onClick={() => handleSelectHour(h)}
                    >
                      {h}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Column Menit */}
            <div className="neo-time-col-box">
              <div className="neo-time-col-title">Menit</div>
              <div className="neo-time-col-list">
                {MINUTE_OPTIONS.map((m) => {
                  const isSel = selectedMinute === m
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`neo-time-slot-btn ${isSel ? 'selected' : ''}`}
                      onClick={() => handleSelectMinute(m)}
                    >
                      :{m}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer & Apply */}
          <div className="neo-time-footer">
            <span className="neo-time-preview">
              Set: <b>{selectedHour}:{selectedMinute} WIB</b>
            </span>
            <button
              type="button"
              className="neo-time-apply-btn"
              onClick={handleConfirm}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Check2 size={14} /> Terapkan
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
