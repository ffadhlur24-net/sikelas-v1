import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from "../../api/axios"
import { useEffect } from 'react'

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        nim_nip: '',
        prodi: '',
        mata_kuliah: '',
        semester: '',
        kelas: '',
        no_hp: ''
    })

    const [availableSchedules, setAvailableSchedules] = useState([])
    const [isOpen, setIsOpen] = useState(true)
    const [closeMessage, setCloseMessage] = useState('')
    const [loadingData, setLoadingData] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const navigate = useNavigate()


    // Ambil sisa jadwal kosong saat halaman pertama kali dibuka
    useEffect(() => {
        const fetcOptions = async () => {
            try {
                setLoadingData(true)
                const res = await api.get('/auth/registration-options')
                if (!res.data.isOpen) {
                    setIsOpen(false)
                    setCloseMessage(res.data.message)
                } else {
                    setAvailableSchedules(res.data.availableSchedules || [])
                }
            } catch (error) {
                console.error("Gagal memuat opsi pendaftaran", error)
            } finally {
                setLoadingData(false)
            }
        }
        fetcOptions()
    }, [])

    const prodiList = [...new Set(availableSchedules.map(s => s.prodi))];
    const semesterList = [...new Set(availableSchedules
        .filter(s => s.prodi === formData.prodi)
        .map(s => String(s.semester))
    )].sort();
    const kelasList = [...new Set(availableSchedules
        .filter(s => s.prodi === formData.prodi && String(s.semester) === String(formData.semester))
        .map(s => s.kelas)
    )].sort();
    const courseList = [...new Set(availableSchedules
        .filter(s => s.prodi === formData.prodi && String(s.semester) === String(formData.semester) && s.kelas === formData.kelas)
        .map(s => s.mata_kuliah)
    )];


    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'prodi') {
            setFormData(prev => ({ ...prev, prodi: value, semester: '', mata_kuliah: '' }))
        } else if (name === 'semester') {
            setFormData(prev => ({ ...prev, semester: value, kelas: '', mata_kuliah: '' }))
        } else if (name === 'kelas') {
            setFormData(prev => ({ ...prev, kelas: value, mata_kuliah: '' }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await api.post('/auth/register', formData)
            setSuccess(response.data.message)
            setTimeout(() => {
                navigate('/login')
            }, 2500)
        } catch (err) {
            if (err.response && err.response.data.error) {
                setError(err.response.data.error)
            }
        } finally {
            setLoading(false)
        }
    }

    if (loadingData) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>Memuat sistem pendaftaran...</p>
            </div>
        )
    }
    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-main)', padding: '20px'
        }}>
            <div className="card-flat" style={{ width: '100%', maxWidth: '520px', padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>Daftar Akun PJ Kelas</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                        Pilih Prodi, Semester, dan Kelas untuk melihat mata kuliah yang tersedia.
                    </p>
                </div>
                {/* PEMBERITAHUAN JIKA PENDAFTARAN PENUH / TUTUP */}
                {!isOpen ? (
                    <div style={{ padding: '20px', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '32px' }}>🔒</span>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '8px' }}>Pendaftaran Ditutup</h3>
                        <p style={{ fontSize: '14px', marginTop: '4px' }}>{closeMessage}</p>
                        <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '16px' }}>Kembali ke Login</Link>
                    </div>
                ) : (
                    <>
                        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
                        {success && <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Username / Nama Lengkap</label>
                                <input type="text" name="username" value={formData.username} onChange={handleChange} className="input-field" placeholder="Masukkan username" required />
                            </div>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Email Kampus</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" placeholder="contoh@mhs.ac.id" required />
                            </div>
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" placeholder="******" required />
                            </div>
                            <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="form-label">NIM / NIP</label>
                                    <input type="text" name="nim_nip" value={formData.nim_nip} onChange={handleChange} className="input-field" placeholder="Contoh: 210801001" required />
                                </div>
                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="form-label">No. HP (WhatsApp)</label>
                                    <input type="text" name="no_hp" value={formData.no_hp} onChange={handleChange} className="input-field" placeholder="08123456789" required />
                                </div>
                            </div>
                            {/* DROPDOWN 1: PRODI */}
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Program Studi (Prodi)</label>
                                <select name="prodi" value={formData.prodi} onChange={handleChange} className="input-field" required>
                                    <option value="">-- Pilih Prodi --</option>
                                    {prodiList.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            {/* DROPDOWN 2 & 3: SEMESTER & KELAS */}
                            <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="form-label">Semester</label>
                                    <select name="semester" value={formData.semester} onChange={handleChange} className="input-field" disabled={!formData.prodi} required>
                                        <option value="">-- Pilih --</option>
                                        {semesterList.map(s => <option key={s} value={s}>Semester {s}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="form-label">Kelas</label>
                                    <select name="kelas" value={formData.kelas} onChange={handleChange} className="input-field" disabled={!formData.semester} required>
                                        <option value="">-- Pilih Kelas --</option>
                                        {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
                                    </select>
                                </div>
                            </div>
                            {/* DROPDOWN 4: MATA KULIAH */}
                            <div className="form-group" style={{ marginBottom: '24px' }}>
                                <label className="form-label">Mata Kuliah yang Dipegang</label>
                                <select name="mata_kuliah" value={formData.mata_kuliah} onChange={handleChange} className="input-field" disabled={!formData.kelas} required>
                                    <option value="">-- Pilih Mata Kuliah --</option>
                                    {courseList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                            </button>
                        </form>
                        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Sudah punya akun? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Login di sini</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Register