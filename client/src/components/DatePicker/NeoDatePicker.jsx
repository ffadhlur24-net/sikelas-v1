import React, { useState, useRef, useEffect } from 'react'
import { CalendarEvent, ChevronLeft, ChevronRight, CalendarCheckFill } from 'react-bootstrap-icons'
import './NeoDatePicker.css'

const NAMA_HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const NAMA_HARI_PANJANG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]
const NAMA_BULAN_PENDEK = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

// Helper format Date object to 'YYYY-MM-DD'
export const formatDateToISO = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const formatDisplayDate = (isoString) => {
  if (!isoString) return ''
  const parts = isoString.split('-')
  if (parts.length !== 3) return isoString
  const [y, m, d] = parts.map(Number)
  const dt = new Date(y, m - 1, d)
  if (isNaN(dt.getTime())) return isoString

  const hari = NAMA_HARI_PANJANG[dt.getDay()]
  const tgl = dt.getDate()
  const bln = NAMA_BULAN_PENDEK[dt.getMonth()]
  const thn = dt.getFullYear()
  return `${hari}, ${tgl} ${bln} ${thn}`
}

export default function NeoDatePicker({
  value,
  onChange,
  minDate,
  disabled = false,
  placeholder = 'Pilih Tanggal...',
  style = {},
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  // Parse current date for navigation view
  const parseInitialDate = () => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number)
      if (y && m && d) return new Date(y, m - 1, d)
    }
    return new Date()
  }

  const [viewDate, setViewDate] = useState(parseInitialDate)

  // Sync viewDate when value changes
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number)
      if (y && m && d) setViewDate(new Date(y, m - 1, d))
    }
  }, [value])

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

  const currentYear = viewDate.getFullYear()
  const currentMonth = viewDate.getMonth()

  const handlePrevMonth = (e) => {
    e.stopPropagation()
    setViewDate(new Date(currentYear, currentMonth - 1, 1))
  }

  const handleNextMonth = (e) => {
    e.stopPropagation()
    setViewDate(new Date(currentYear, currentMonth + 1, 1))
  }

  const handleSelectDate = (dateStr) => {
    if (onChange) onChange(dateStr)
    setIsOpen(false)
  }

  // Generate calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const todayStr = formatDateToISO(new Date())

  const calendarCells = []
  // Empty leading cells
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="neo-date-cell-empty" />)
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(currentYear, currentMonth, day)
    const cellDateStr = formatDateToISO(cellDate)
    const isSelected = value === cellDateStr
    const isToday = cellDateStr === todayStr
    const isSunday = cellDate.getDay() === 0
    const isDisabled = minDate && cellDateStr < minDate

    calendarCells.push(
      <button
        key={cellDateStr}
        type="button"
        className={`neo-date-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isSunday ? 'sunday' : ''} ${isDisabled ? 'disabled' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          if (!isDisabled) handleSelectDate(cellDateStr)
        }}
        disabled={isDisabled}
        title={isSunday ? 'Hari Minggu (Kelas SPB / Khusus)' : ''}
      >
        <span>{day}</span>
        {isToday && <span className="neo-date-today-dot" />}
      </button>
    )
  }

  return (
    <div className={`neo-date-picker-container ${className}`} ref={containerRef} style={style}>
      <button
        type="button"
        className={`neo-date-input-btn ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="neo-date-value-display">
          <CalendarEvent size={16} color="#0f172a" />
          <span>{value ? formatDisplayDate(value) : placeholder}</span>
        </span>
        <CalendarCheckFill size={14} color={value ? '#f59e0b' : '#94a3b8'} />
      </button>

      {isOpen && (
        <div className="neo-date-popover">
          {/* Header navigation */}
          <div className="neo-date-header">
            <button
              type="button"
              className="neo-date-nav-btn"
              onClick={handlePrevMonth}
              aria-label="Bulan Sebelumnya"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="neo-date-title">
              {NAMA_BULAN[currentMonth]} {currentYear}
            </span>
            <button
              type="button"
              className="neo-date-nav-btn"
              onClick={handleNextMonth}
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="neo-date-weekdays">
            {NAMA_HARI.map((d, idx) => (
              <span key={d} className={`neo-date-weekday ${idx === 0 ? 'sunday' : ''}`}>
                {d}
              </span>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="neo-date-grid">
            {calendarCells}
          </div>
        </div>
      )}
    </div>
  )
}
