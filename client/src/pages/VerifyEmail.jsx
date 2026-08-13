import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
function VerifyEmail() {
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState(location.state?.email || '')
    const [otpCode, setOtpCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        if (countdown <= 0) return
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown])
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
            setError(err.response?.data?.error || 'Verifikasi gagal.')
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
            <div className="card-flat" style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📩</div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>Verifikasi Email Kampus</h2>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                    Kode OTP 6-digit telah dikirimkan ke email kampus Anda: <br />
                    <b style={{ color: '#0f172a' }}>{email || 'email@mhs.ac.id'}</b>
                </p>
                {message && <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{message}</div>}
                {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
                <form onSubmit={handleVerify}>
                    <div style={{ marginBottom: '20px' }}>
                        {!email && (
                            <input
                                type="email"
                                className="input"
                                style={{ width: '100%', marginBottom: '12px', textAlign: 'center' }}
                                placeholder="Masukkan Email Kampus"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        )}
                        <input
                            type="text"
                            maxLength="6"
                            className="input"
                            style={{ width: '100%', textAlign: 'center', fontSize: '24px', letterSpacing: '8px', fontWeight: 'bold' }}
                            placeholder="000000"
                            value={otpCode}
                            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                            required
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
                            color: countdown > 0 ? '#94a3b8' : '#3b82f6',
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
            </div>
        </div>
    )
}
export default VerifyEmail