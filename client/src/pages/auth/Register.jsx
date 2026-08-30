import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from "../../api/axios"

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        nim_nip: '',
        no_hp: '',
        fakultas: '',
        prodi: '',
        semester: '',
        mata_kuliah: '',
        kelas: ''
    })

    const [departments, setDepartments] = useState([])
    const [availableSchedules, setAvailableSchedules] = useState([])
    const [isRegistrationClosed, setIsRegistrationClosed] = useState(false)
    const [closedMessage, setClosedMessage] = useState('')
    const [loadingOptions, setLoadingOptions] = useState(true)
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [emailError, setEmailError] = useState('')
    const [emailChecking, setEmailChecking] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const navigate = useNavigate()

    const [fetchError, setFetchError] = useState(false)

    // 1. Fetch Data Master & Jadwal Bebas PJ Murni dari Database Supabase
    const fetchInitialData = async () => {
        try {
            setLoadingOptions(true)
            setFetchError(false)
            // Fetch Master Prodi dari Database
            const depRes = await api.get('/departemen')
            setDepartments(depRes.data.departemen || [])

            // Fetch Schedules Bebas PJ dari Database
            const optRes = await api.get('/auth/registration-options')
            if (optRes.data.isOpen === false || (optRes.data.availableSchedules && optRes.data.availableSchedules.length === 0)) {
                setIsRegistrationClosed(true)
                setClosedMessage(optRes.data.message || 'Pendaftaran penanggung jawab telah ditutup (Semua Mata Kuliah sudah memiliki PJ).')
            } else {
                setAvailableSchedules(optRes.data.availableSchedules || [])
                setIsRegistrationClosed(false)
            }
        } catch (err) {
            console.error("Gagal mengambil opsi pendaftaran dari database:", err)
            setFetchError(true)
        } finally {
            setLoadingOptions(false)
        }
    }

    useEffect(() => {
        fetchInitialData()
    }, [])

        // 1. Opsi Fakultas (Dinamis dari Master Departemen)
    const fakultasOptions = [...new Set(departments.map(d => d.fakultas))].filter(Boolean).sort()

    // 2. Opsi Prodi (Tersaring per Fakultas)
    const prodisInFakultas = departments
        .filter(d => (!formData.fakultas || d.fakultas === formData.fakultas) && d.nama_prodi && !d.nama_prodi.includes('(Umum)') && d.kode_prodi !== 'UMUM')
        .map(d => d.nama_prodi)
    const prodiOptions = prodisInFakultas.length > 0
        ? prodisInFakultas.sort()
        : [...new Set(availableSchedules.map(s => s.prodi))].filter(Boolean).sort()

    // 3. Opsi Semester (Tersaring per Prodi)
    const filteredByProdi = availableSchedules.filter(s => s.prodi === formData.prodi)
    const semesterOptions = [...new Set(filteredByProdi.map(s => String(s.semester || "").trim()))]
        .filter(Boolean)
        .sort((a, b) => {
            const numA = parseInt(a, 10)
            const numB = parseInt(b, 10)
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB
            if (!isNaN(numA)) return -1
            if (!isNaN(numB)) return 1
            return a.localeCompare(b)
        })

    // 4. Opsi Mata Kuliah (Tersaring per Prodi & Semester - Matkul yang seluruh kelasnya terisi otomatis hilang)
    const filteredBySemester = filteredByProdi.filter(s => String(s.semester || "").trim() === String(formData.semester || "").trim())
    const uniqueCourseOptions = [...new Set(filteredBySemester.map(s => s.mata_kuliah))].filter(Boolean).sort()

    // 5. Opsi Kelas (Tersaring per Prodi, Semester & Mata Kuliah - Hanya kelas yang belum diambil PJ yang muncul)
    const filteredByMatkul = filteredBySemester.filter(s => s.mata_kuliah === formData.mata_kuliah)
    const kelasOptions = [...new Set(filteredByMatkul.map(s => s.kelas))].filter(Boolean).sort()

    // Form Change Handlers dengan Auto-Reset Bertingkat & Input Sanitization
    const handleChange = (e) => {
        const { name, value } = e.target

        // 1. Sanitasi Nama Lengkap / Username: Hanya huruf dan spasi (tanpa angka / karakter khusus)
        if (name === 'username') {
            const filteredName = value.replace(/[^a-zA-Z\s]/g, '')
            setFormData(prev => ({ ...prev, username: filteredName }))
            return
        }

        // 2. Sanitasi No. HP: Hanya angka & maksimal 15 digit
        if (name === 'no_hp') {
            const filteredPhone = value.replace(/\D/g, '').slice(0, 15)
            setFormData(prev => ({ ...prev, no_hp: filteredPhone }))
            return
        }

        // 3. Sanitasi & Konstruksi Email Kampus Otomatis dari NIM
        if (name === "nim_nip") {
            setEmailError("")
            setError("")
            const cleanNim = value.replace(/\D/g, "") // hanya angka
            const fullEmail = cleanNim ? `${cleanNim}@student.walisongo.ac.id` : ""
            setFormData(prev => ({
                ...prev,
                nim_nip: cleanNim,
                email: fullEmail
            }))
            return
        }

        if (name === "email") {
            setEmailError("")
            setError("")
            const extractedNim = value.includes("@") ? value.split("@")[0] : value
            setFormData(prev => ({ ...prev, email: value, nim_nip: extractedNim }))
            return
        }
        if (name === 'fakultas') {
            setFormData(prev => ({
                ...prev,
                fakultas: value,
                prodi: '',
                semester: '',
                mata_kuliah: '',
                kelas: ''
            }))
        } else if (name === 'prodi') {
            setFormData(prev => ({
                ...prev,
                prodi: value,
                semester: '',
                mata_kuliah: '',
                kelas: ''
            }))
        } else if (name === 'semester') {
            setFormData(prev => ({
                ...prev,
                semester: value,
                mata_kuliah: '',
                kelas: ''
            }))
        } else if (name === 'mata_kuliah') {
            setFormData(prev => ({
                ...prev,
                mata_kuliah: value,
                kelas: ''
            }))
        } else if (name === 'kelas') {
            setFormData(prev => ({
                ...prev,
                kelas: value
            }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    // Pengecekan Email Duplikat saat User selesai mengetik (onBlur)
    const handleEmailBlur = async () => {
        if (!formData.email || !formData.nim_nip || formData.nim_nip.length < 5) return
        try {
            setEmailChecking(true)
            const res = await api.get(`/auth/check-email?email=${encodeURIComponent(formData.email.trim())}`)
            if (res.data.exists && res.data.isVerified) {
                setEmailError(res.data.message || 'Email ini telah memiliki akun aktif.')
            } else {
                setEmailError('')
            }
        } catch (err) {
            console.error('Pengecekan email gagal:', err)
        } finally {
            setEmailChecking(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (isRegistrationClosed) return

        setError('')
        setSuccess('')

        // Validasi Frontend 1: Nama Lengkap / Username
        const nameRegex = /^[a-zA-Z\s]+$/
        if (!nameRegex.test(formData.username.trim())) {
            setError('Nama Lengkap / Username hanya boleh berisi huruf dan spasi (tanpa angka atau karakter khusus).')
            return
        }

        // Validasi Frontend 2: Check Email Duplikat dari State Blur
        if (emailError) {
            setError('Email ini telah memiliki akun.')
            return
        }

        // Validasi Frontend 3: Password Minimal 8 Karakter
        if (formData.password.length < 8) {
            setError('Password minimal harus 8 karakter.')
            return
        }

        // Validasi Frontend 4: No. HP (Harus 08... dan 10-15 digit)
        const phoneRegex = /^08[0-9]{8,13}$/
        if (!phoneRegex.test(formData.no_hp.trim())) {
            setError('Nomor HP harus berawalan 08 dan terdiri dari 10 hingga 15 digit angka.')
            return
        }

        setLoading(true)

        try {
            const response = await api.post('/auth/register', formData)
            setSuccess(response.data.message)
            setTimeout(() => {
                navigate('/verify-email', { state: { email: formData.email } })
            }, 1500)
        } catch (err) {
            if (err.response && err.response.data.error) {
                setError(err.response.data.error)
                if (err.response.data.error.includes('Email ini telah memiliki akun')) {
                    setEmailError('Email ini telah memiliki akun.')
                }
            } else {
                setError('Terjadi kesalahan jaringan/server.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-main)', padding: '20px'
        }}>
            <div className="card-flat" style={{ width: '100%', maxWidth: '540px', padding: '32px' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>Daftar Akun PJ Kelas</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
                        Pilih alokasi penanggung jawab mata kuliah sesuai data jadwal kampus.
                    </p>
                </div>

                {loadingOptions ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Memeriksa ketersediaan kuota pendaftaran...
                    </div>
                ) : fetchError ? (
                    <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                            Gagal Memuat Data Pendaftaran
                        </h3>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                            Server backend baru saja di-restart atau sedang menyiapkan koneksi. Silakan muat ulang.
                        </p>
                        <button onClick={fetchInitialData} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                            🔄 Muat Ulang Opsi Pendaftaran
                        </button>
                    </div>
                ) : isRegistrationClosed ? (
                    /* TAMPILAN KHUSUS: PENDAFTARAN DITUTUP (100% PULIH) */
                    <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                        <div style={{
                            width: '64px', height: '64px', background: '#fef2f2', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                            fontSize: '32px', border: '1px solid #fca5a5'
                        }}>
                            🔒
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#991b1b', marginBottom: '8px' }}>
                            Pendaftaran PJ Ditutup!
                        </h2>
                        <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                            {closedMessage || 'Seluruh Mata Kuliah pada semester ini telah memiliki Penanggung Jawab (PJ) yang terdaftar di database.'}
                            <br /><span style={{ fontSize: '13px', color: '#64748b' }}>Hubungi Admin Kampus jika Anda membutuhkan informasi lebih lanjut.</span>
                        </p>
                        <Link to="/login" className="btn btn-primary" style={{ display: 'inline-block', width: '100%', textAlign: 'center', padding: '12px' }}>
                            👈 Kembali ke Halaman Login
                        </Link>
                    </div>
                ) : (
                    /* FORM REGISTRASI DENGAN FULL SMART CASCADING FILTER */
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{
                                background: '#fee2e2', color: '#dc2626', padding: '14px', borderRadius: '10px',
                                marginBottom: '16px', fontSize: '14px', border: '1px solid #fca5a5',
                                display: 'flex', flexDirection: 'column', gap: '8px'
                            }}>
                                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    ⚠️ {error}
                                </div>
                                {error.includes('Email ini telah memiliki akun') && (
                                    <div style={{ marginTop: '4px' }}>
                                        <Link to="/login" className="btn btn-secondary" style={{
                                            display: 'inline-block', padding: '6px 14px', fontSize: '13px',
                                            textDecoration: 'none', background: '#dc2626', color: '#ffffff',
                                            borderRadius: '6px', fontWeight: '600'
                                        }}>
                                            👉 Klik di sini untuk Login ke Akun Anda
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                        {success && <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{success}</div>}

                        {/* Username */}
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Username / Nama Lengkap</label>
                            <input type="text" name="username" value={formData.username} onChange={handleChange} className="input-field" placeholder="Masukkan nama lengkap (hanya huruf)" required />
                            <small style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                ℹ️ Hanya boleh huruf dan spasi (tanpa angka / karakter khusus).
                            </small>
                        </div>

                        {/* NIM Mahasiswa & Email Kampus Otomatis (Input Group) */}
                        <div className="form-group" style={{ marginBottom: "16px" }}>
                            <label className="form-label">NIM Mahasiswa (Email Kampus Otomatis)</label>
                            <div style={{ display: "flex", alignItems: "stretch" }}>
                                <input
                                    type="text"
                                    name="nim_nip"
                                    value={formData.nim_nip}
                                    onChange={handleChange}
                                    onBlur={handleEmailBlur}
                                    className="input-field"
                                    placeholder="Contoh: 2108096001"
                                    maxLength={15}
                                    style={{
                                        flex: 1,
                                        borderTopRightRadius: 0,
                                        borderBottomRightRadius: 0,
                                        borderColor: emailError ? "#dc2626" : undefined
                                    }}
                                    required
                                />
                                <div style={{
                                    background: "#f1f5f9",
                                    color: "#334155",
                                    padding: "0 14px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    border: "1px solid #cbd5e1",
                                    borderLeft: "none",
                                    borderTopRightRadius: "8px",
                                    borderBottomRightRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    userSelect: "none"
                                }}>
                                    @student.walisongo.ac.id
                                </div>
                            </div>
                            {emailChecking && (
                                <small style={{ fontSize: "11px", color: "#3b82f6", marginTop: "4px", display: "block" }}>
                                    🔍 Memeriksa ketersediaan NIM / Email...
                                </small>
                            )}
                            {emailError && (
                                <small style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px", fontWeight: "bold", display: "block" }}>
                                    ⚠️ {emailError} <Link to="/login" style={{ color: "#0284c7", textDecoration: "underline" }}>Login di sini</Link>
                                </small>
                            )}
                            <small style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
                                📧 Surat OTP akan dikirim ke: <b style={{ color: "#0f172a" }}>{formData.email || "NIM@student.walisongo.ac.id"}</b>
                            </small>
                        </div>

                        {/* Password dengan Toggle Mata */}
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Minimal 8 karakter"
                                    required
                                    style={{ paddingRight: '44px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b',
                                        padding: '4px'
                                    }}
                                    title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            <small style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                ℹ️ Password minimal 8 karakter.
                            </small>
                        </div>

                        {/* No. HP */}
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">No. HP (WhatsApp)</label>
                            <input
                                type="text"
                                name="no_hp"
                                value={formData.no_hp}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="08123456789"
                                maxLength={15}
                                required
                            />
                            <small style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                                ℹ️ Harus berawalan 08 (10-15 digit angka).
                            </small>
                        </div>


                        {/* SMART CASCADING FILTER DROPDOWNS (100% DINAMIS DATABASE) */}
                        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '18px', borderRadius: '10px', marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🎯 Alokasi Kelas & Mata Kuliah (Dinamis Database)
                            </h4>

                            {/* Dropdown 1: Fakultas */}
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">1. Fakultas</label>
                                <select name="fakultas" value={formData.fakultas} onChange={handleChange} className="input-field" required>
                                    <option value="">-- Pilih Fakultas --</option>
                                    {fakultasOptions.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Dropdown 2: Program Studi (Tersaring per Fakultas) */}
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">2. Program Studi (Prodi)</label>
                                <select name="prodi" value={formData.prodi} onChange={handleChange} className="input-field" required disabled={!formData.fakultas}>
                                    <option value="">-- Pilih Program Studi --</option>
                                    {prodiOptions.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                {!formData.fakultas && (
                                    <small style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                                        ℹ️ Pilih Fakultas terlebih dahulu.
                                    </small>
                                )}
                            </div>

                            {/* Dropdown 3: Semester (Tersaring per Prodi) */}
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">3. Semester (Aktif)</label>
                                <select name="semester" value={formData.semester} onChange={handleChange} className="input-field" required disabled={!formData.prodi}>
                                    <option value="">-- Pilih Semester --</option>
                                    {semesterOptions.map(s => (
                                        <option key={s} value={s}>Semester {s}</option>
                                    ))}
                                </select>
                                {!formData.prodi && (
                                    <small style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                                        ℹ️ Pilih Program Studi terlebih dahulu.
                                    </small>
                                )}
                            </div>

                            {/* Dropdown 4: Mata Kuliah (Bebas PJ - Tersaring per Prodi & Semester) */}
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">4. Mata Kuliah (Bebas PJ)</label>
                                <select name="mata_kuliah" value={formData.mata_kuliah} onChange={handleChange} className="input-field" required disabled={!formData.semester}>
                                    <option value="">-- Pilih Mata Kuliah dari Database --</option>
                                    {uniqueCourseOptions.map(mk => (
                                        <option key={mk} value={mk}>{mk}</option>
                                    ))}
                                </select>
                                {!formData.semester ? (
                                    <small style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                                        ℹ️ Pilih Semester terlebih dahulu.
                                    </small>
                                ) : uniqueCourseOptions.length === 0 ? (
                                    <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px', fontWeight: 'bold' }}>
                                        ⚠️ Seluruh Mata Kuliah pada {formData.prodi} (Semester {formData.semester}) di database sudah memiliki Penanggung Jawab!
                                    </p>
                                ) : null}
                            </div>

                            {/* Dropdown 5: Kelas (Bebas PJ - Tersaring per Mata Kuliah) */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">5. Kelas (Bebas PJ)</label>
                                <select name="kelas" value={formData.kelas} onChange={handleChange} className="input-field" required disabled={!formData.mata_kuliah}>
                                    <option value="">-- Pilih Kelas --</option>
                                    {kelasOptions.map(k => (
                                        <option key={k} value={k}>Kelas {k}</option>
                                    ))}
                                </select>
                                {!formData.mata_kuliah ? (
                                    <small style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                                        ℹ️ Pilih Mata Kuliah terlebih dahulu.
                                    </small>
                                ) : kelasOptions.length === 0 ? (
                                    <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px', fontWeight: 'bold' }}>
                                        ⚠️ Seluruh Kelas untuk mata kuliah ini sudah terisi penuh oleh Penanggung Jawab lain!
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || (formData.mata_kuliah && kelasOptions.length === 0)}>
                            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                        </button>
                    </form>
                )}

                {!isRegistrationClosed && (
                    <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
                        Sudah punya akun? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Login di sini</Link>
                    </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px' }}>
                    📩 Belum tuntas verifikasi OTP? <Link to="/verify-email" style={{ color: '#2563eb', fontWeight: '600' }}>Lanjutkan Verifikasi Di Sini</Link>
                </div>
                <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px' }}>
                    <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500' }}>
                        ⬅️ Kembali ke Beranda
                    </Link>
                </div>
            </div>
        </div >
    )
}

export default Register
