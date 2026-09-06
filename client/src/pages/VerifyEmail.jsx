import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import api from '../api/axios'
import './VerifyEmail.css'

function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email || 'godong@student.walisongo.ac.id')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60) // Cooldown tombol kirim ulang
  const [sessionTime, setSessionTime] = useState(300) // 5 Menit sesi OTP

  const inputRefs = useRef([])

  // Cooldown Timer untuk Tombol Kirim Ulang
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // Countdown Sesi OTP (5 Menit)
  useEffect(() => {
    if (sessionTime <= 0) return
    const timer = setTimeout(() => setSessionTime(sessionTime - 1), 1000)
    return () => clearTimeout(timer)
  }, [sessionTime])

  const formatSessionTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Handle Input per Digit dengan Auto-Advance & Overwrite Support
  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '')

    if (!cleanVal) {
      const newDigits = [...otpDigits]
      newDigits[index] = ''
      setOtpDigits(newDigits)
      return
    }

    const lastDigit = cleanVal.slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = lastDigit
    setOtpDigits(newDigits)

    // Auto-advance ke input berikutnya
    if (lastDigit && index < 5) {
      inputRefs.current[index + 1]?.focus()
      inputRefs.current[index + 1]?.select()
    }
  }

  // Handle Keyboard Navigation (Backspace & Arrow)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
        const newDigits = [...otpDigits]
        newDigits[index - 1] = ''
        setOtpDigits(newDigits)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle Paste Kode 6-Digit Sekaligus
  const handlePaste = (e) => {
    e.preventDefault()
    const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim()
    const cleanNumbers = pasteData.replace(/\D/g, '').slice(0, 6)
    if (cleanNumbers) {
      const newDigits = [...otpDigits]
      cleanNumbers.split('').forEach((digit, i) => {
        if (i < 6) newDigits[i] = digit
      })
      setOtpDigits(newDigits)
      const nextFocus = Math.min(cleanNumbers.length, 5)
      inputRefs.current[nextFocus]?.focus()
    }
  }

  // Handler Verifikasi OTP ke Backend
  const handleVerify = async (e) => {
    e.preventDefault()
    const fullOtp = otpDigits.join('')

    if (!email) {
      setError('Email kampus wajib diisi!')
      return
    }

    if (fullOtp.length !== 6) {
      setError('Harap masukkan 6 angka kode OTP secara lengkap!')
      return
    }

    try {
      setLoading(true)
      setError('')
      setMessage('')
      const res = await api.post('/auth/verify-otp', { email, otp_code: fullOtp })
      setMessage(res.data.message || 'Email berhasil diverifikasi! Mengalihkan ke login...')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Verifikasi gagal. Pastikan kode OTP benar dan belum kadaluarsa.')
    } finally {
      setLoading(false)
    }
  }

  // Handler Kirim Ulang OTP ke Backend
  const handleResend = async () => {
    if (countdown > 0 || resendLoading || !email) return
    try {
      setResendLoading(true)
      setError('')
      setMessage('')
      const res = await api.post('/auth/resend-otp', { email })
      setMessage(res.data.message || 'Kode OTP baru telah dikirimkan ke email kampus Anda!')
      setCountdown(60)
      setSessionTime(300)
      setOtpDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengirim ulang OTP. Pastikan email kampus Anda benar.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="verify-page-wrapper">
      <main className="verify-container">
        {/* Retro Top Corner Badge */}
        <div className="verify-stamp-badge">
          OTP • KAMPUS 2026
        </div>

        {/* Outer Card Shell */}
        <div className="verify-card">
          {/* Header Subtitle Strip */}
          <div className="verify-substrip">
            <span className="verify-substrip-left">
              <span className="verify-substrip-box" />
              KEAMANAN AKUN • MAHASISWA & PJ
            </span>
            <span className="verify-substrip-ref">
              REF: SK-2026
            </span>
          </div>

          {/* Main Header Details */}
          <section className="verify-header-details">
            {/* Retro Envelope Illustration */}
            <div className="verify-envelope-wrapper">
              <div className="verify-envelope-body">
                <svg
                  className="verify-envelope-svg"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2.5"
                  viewBox="0 0 56 44"
                >
                  <path d="M0 0 L28 24 L56 0" />
                  <path d="M0 44 L20 22" />
                  <path d="M56 44 L36 22" />
                </svg>
                <div className="verify-envelope-arrow">
                  ↓
                </div>
              </div>
            </div>

            <h1 className="verify-title">
              Verifikasi Email Kampus
            </h1>

            <p className="verify-subtitle">
              Kode OTP 6-digit telah dikirimkan ke inbox email mahasiswa:
            </p>

            <div className="verify-email-pill">
              <span>📧</span>
              <span className="underline-text">{email || 'godong@student.walisongo.ac.id'}</span>
            </div>
          </section>

          {/* Form Section */}
          <section className="verify-form-section">
            <form className="verify-form" onSubmit={handleVerify}>
              {/* Alert Message Box */}
              {message && (
                <div className="verify-alert verify-alert-success">
                  <span>✅</span>
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="verify-alert verify-alert-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Registered Campus Email Field */}
              <div>
                <label className="verify-label" htmlFor="campus-email">
                  Email Kampus Terdaftar
                </label>
                <div className="verify-email-input-wrapper">
                  <div className="verify-email-icon">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <rect x="2" y="4" width="20" height="16" rx="1" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <input
                    id="campus-email"
                    type="email"
                    className="verify-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="godong@student.walisongo.ac.id"
                    required
                  />
                  {email && (
                    <span className="verify-email-valid-badge">
                      ✓ Valid
                    </span>
                  )}
                </div>
              </div>

              {/* 6-Digit OTP Box Grid */}
              <div>
                <div className="verify-otp-header-row">
                  <label className="verify-label" style={{ margin: 0 }}>
                    Masukkan 6-Digit OTP
                  </label>
                  <span className="verify-timer-badge">
                    ⏳ <span>{formatSessionTime(sessionTime)}</span>
                  </span>
                </div>

                <div className="verify-otp-grid">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      pattern="[0-9]*"
                      placeholder="0"
                      className="verify-otp-box"
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                    />
                  ))}
                </div>

                <p className="verify-otp-hint">
                  *Tekan angka pada keyboard untuk mengisi secara berurutan.
                </p>
              </div>

              {/* Primary CTA Submit Button */}
              <div style={{ paddingTop: '4px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="verify-btn-submit"
                >
                  <span>{loading ? 'Memverifikasi...' : 'Verifikasi Email Sekarang'}</span>
                  <span style={{ fontSize: '18px' }}>🚀</span>
                </button>
              </div>

              {/* Resend Code Button */}
              <div className="verify-resend-wrapper">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={countdown > 0 || resendLoading || !email}
                  className="verify-btn-resend"
                >
                  <span>📥</span>
                  <span>
                    {resendLoading
                      ? 'Mengirim Ulang...'
                      : countdown > 0
                      ? `Kirim Ulang Kode OTP (${countdown}s)`
                      : 'Kirim Ulang Kode OTP'
                    }
                  </span>
                </button>
              </div>
            </form>
          </section>

          {/* Perforated Ticket Divider Line */}
          <div className="verify-perforation-divider">
            <div className="verify-perforation-line" />
          </div>

          {/* Navigation & Return Link */}
          <div className="verify-return-container">
            <Link to="/login" className="verify-link-return">
              <span className="verify-return-arrow">←</span>
              <span className="underline-text">Kembali ke Halaman Login</span>
            </Link>
          </div>

          {/* Card Bottom Stars Footer */}
          <footer className="verify-card-footer">
            ★ SIKELAS KAMPUS ★ SISTEM TERPADU RUANG KELAS ★ ALL RIGHTS RESERVED ★
          </footer>
        </div>

        {/* External Helpdesk Footer Info */}
        <footer className="verify-helpdesk-footer">
          <p>
            Butuh bantuan?{' '}
            <a
              href="https://wa.me/6281234567890?text=Halo%20Admin%20SiKelas,%20saya%20membutuhkan%20bantuan%20terkait%20verifikasi%20OTP%20email"
              target="_blank"
              rel="noopener noreferrer"
              className="verify-helpdesk-link"
            >
              Hubungi Admin Helpdesk SiKelas
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}

export default VerifyEmail
