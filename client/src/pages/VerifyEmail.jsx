import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import api from '../api/axios'

function VerifyEmail() {
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState(location.state?.email || '')
    const [isEmailSubmitted, setIsEmailSubmitted] = useState(!!location.state?.email)
    const [otpCode, setOtpCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [checkLoading, setCheckLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [isExpired, setIsExpired] = useState(false)
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (countdown <= 0) return
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown])

    // Cek kelayakan OTP saat user submit email pendaftaran lama
    const handleCheckResume = async (e) => {
        e.preventDefault()
        if (!email || !email.includes('@')) {
            setError('Masukkan alamat email kampus yang valid!')
            return
        }
        try {
            setCheckLoading(true)
            setError('')
            setMessage('')
            setIsExpired(false)

            const res = await api.post('/auth/resume-otp', { email })
            setMessage('Pendaftaran ditemukan! Silakan masukkan 6-digit kode OTP.')
            setIsEmailSubmitted(true)
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Gagal memeriksa status OTP.'
            setError(errMsg)
            if (errMsg.includes('kadaluwarsa')) {
                setIsExpired(true)
            }
        } finally {
            setCheckLoading(false)
        }
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        if (!otpCode || otpCode.length !== 6) {
            setError('Kode OTP harus terdiri dari 6 angka!')
            return
        }
        try {
            setLoading(true)
            setError('')
            setMessage('')
            const res = await api.post('/auth/verify-otp', { email, otp_code: otpCode })
            setMessage(res.data.message)
            setTimeout(() => {
                navigate('/login')
            }, 2500)
        } catch (err) {
            const errMsg = err.response?.data?.error || 'Verifikasi gagal.'
            setError(errMsg)
            if (errMsg.includes('kadaluwarsa')) {
                setIsExpired(true)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        if (countdown > 0 || !email) return
        try {
            setResendLoading(true)
            setError('')
            setMessage('')
            const res = await api.post('/auth/resend-otp', { email })
            setMessage(res.data.message)
            setCountdown(60)
        } catch (error) {
            setError(error.response?.data?.error || 'Gagal mengirim OTP. Coba lagi nanti.')
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '16px' }}>
            <div className="card-flat" style={{ width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📩</div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Verifikasi Email Kampus</h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                    {isEmailSubmitted ? (
                        <>Kode OTP 6-digit telah dikirimkan ke email kampus Anda: <br /><b style={{ color: '#0f172a' }}>{email}</b></>
                    ) : (
                        'Masukkan alamat email kampus yang Anda gunakan saat mendaftar untuk melanjutkan verifikasi OTP.'
                    )}
                </p>

                {message && <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{message}</div>}
                {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

                {/* TAMPILAN 1: TANYA EMAIL DAHULU JIKA BELUM SUBMIT EMAIL */}
                {!isEmailSubmitted ? (
                    <form onSubmit={handleCheckResume}>
                        <input
                            type="email"
                            className="input-field"
                            style={{ width: '100%', marginBottom: '16px', textAlign: 'center' }}
                            placeholder="Masukkan Email Kampus Anda"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={checkLoading}>
                            {checkLoading ? 'Memeriksa OTP...' : '🔍 Lanjutkan Verifikasi OTP'}
                        </button>
                    </form>
                ) : isExpired ? (
                    /* TAMPILAN 2: JIKA OTP SUDAH KADALUWARSA (>15 MENIT) -> TIDAK TAMPILKAN INPUT OTP */
                    <div style={{ padding: '12px 0' }}>
                        <p style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500', marginBottom: '20px' }}>
                            ⏰ Pendaftaran Anda telah dibebaskan. Silakan lakukan pendaftaran ulang untuk memilih mata kuliah yang diinginkan.
                        </p>
                        <Link to="/register" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', textAlign: 'center', padding: '12px' }}>
                            📝 Daftar Ulang Sekarang
                        </Link>
                    </div>
                ) : (
                    /* TAMPILAN 3: FORM INPUT KODE OTP 6-DIGIT (OTP MASIH AKTIF) */
                    <>
                        <form onSubmit={handleVerify}>
                            <div style={{ marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    maxLength="6"
                                    className="input-field"
                                    style={{ width: '100%', textAlign: 'center', fontSize: '26px', letterSpacing: '8px', fontWeight: 'bold' }}
                                    placeholder="000000"
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                                {loading ? 'Memverifikasi...' : 'Verifikasi Email Sekarang 🚀'}
                            </button>
                        </form>

                        <div style={{ marginTop: '16px' }}>
                            <button
                                onClick={handleResend}
                                disabled={countdown > 0 || resendLoading || !email}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: countdown > 0 ? '#94a3b8' : '#2563eb',
                                    cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '13px',
                                    textDecoration: countdown > 0 ? 'none' : 'underline'
                                }}
                            >
                                {resendLoading
                                    ? 'Mengirim...'
                                    : countdown > 0
                                        ? `Kirim ulang dalam ${countdown} detik`
                                        : '📩 Kirim Ulang Kode OTP'
                                }
                            </button>
                        </div>
                    </>
                )}

                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <Link to="/login" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none' }}>
                        👈 Kembali ke Halaman Login
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default VerifyEmail