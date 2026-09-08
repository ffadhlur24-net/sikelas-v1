import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import './Register.css'
import {
  ExclamationTriangleFill,
  LockFill,
  ArrowClockwise,
  ArrowLeftShort,
  ArrowRightShort,
  CheckCircleFill,
  PersonFill,
  MortarboardFill,
  EnvelopeFill,
  TelephoneFill,
  InfoCircleFill,
  Bank,
  JournalBookmarkFill,
  CalendarWeekFill,
  BookHalf,
  TagFill,
  CheckLg,
  PinAngleFill,
  HouseDoorFill
} from 'react-bootstrap-icons'

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

  const [currentStep, setCurrentStep] = useState(1)
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
  const [fetchError, setFetchError] = useState(false)
  const navigate = useNavigate()

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
      console.error('Gagal mengambil opsi pendaftaran dari database:', err)
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
  const semesterOptions = [...new Set(filteredByProdi.map(s => String(s.semester || '').trim()))]
    .filter(Boolean)
    .sort((a, b) => {
      const numA = parseInt(a, 10)
      const numB = parseInt(b, 10)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      if (!isNaN(numA)) return -1
      if (!isNaN(numB)) return 1
      return a.localeCompare(b)
    })

  // 4. Opsi Mata Kuliah (Tersaring per Prodi & Semester)
  const filteredBySemester = filteredByProdi.filter(s => String(s.semester || '').trim() === String(formData.semester || '').trim())
  const uniqueCourseOptions = [...new Set(filteredBySemester.map(s => s.mata_kuliah))].filter(Boolean).sort()

  // 5. Opsi Kelas (Tersaring per Prodi, Semester & Mata Kuliah)
  const filteredByMatkul = filteredBySemester.filter(s => s.mata_kuliah === formData.mata_kuliah)
  const kelasOptions = [...new Set(filteredByMatkul.map(s => s.kelas))].filter(Boolean).sort()

  // Form Change Handlers dengan Auto-Reset Bertingkat & Input Sanitization
  const handleChange = (e) => {
    const { name, value } = e.target

    // Sanitasi Nama Lengkap: Hanya huruf dan spasi
    if (name === 'username') {
      const filteredName = value.replace(/[^a-zA-Z\s]/g, '')
      setFormData(prev => ({ ...prev, username: filteredName }))
      return
    }

    // Sanitasi No. HP: Hanya angka & maksimal 15 digit
    if (name === 'no_hp') {
      const filteredPhone = value.replace(/\D/g, '').slice(0, 15)
      setFormData(prev => ({ ...prev, no_hp: filteredPhone }))
      return
    }

    // Sanitasi & Konstruksi Email Kampus Otomatis dari NIM
    if (name === 'nim_nip') {
      setEmailError('')
      setError('')
      const cleanNim = value.replace(/\D/g, '')
      const fullEmail = cleanNim ? `${cleanNim}@student.walisongo.ac.id` : ''
      setFormData(prev => ({
        ...prev,
        nim_nip: cleanNim,
        email: fullEmail
      }))
      return
    }

    // Cascading selection resets
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

  // Stepper navigation & step validation
  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return Boolean(formData.fakultas && formData.fakultas.trim() !== '')
      case 2:
        return Boolean(formData.prodi && formData.prodi.trim() !== '')
      case 3:
        return Boolean(formData.semester !== undefined && formData.semester !== null && formData.semester !== '' && String(formData.semester).trim() !== '')
      case 4:
        return Boolean(formData.mata_kuliah && formData.mata_kuliah.trim() !== '')
      case 5:
        return Boolean(formData.kelas && formData.kelas.trim() !== '')
      default:
        return true
    }
  }

  // Cek apakah step tujuan dapat diakses
  const isStepAccessible = (targetStep) => {
    if (targetStep <= 1) return true
    for (let s = 1; s < targetStep; s++) {
      if (!isStepValid(s)) return false
    }
    return true
  }

  const canProceedCurrentStep = isStepValid(currentStep)

  const handleStepClick = (step) => {
    if (!isStepAccessible(step)) return
    setCurrentStep(step)
  }

  const handleNextStep = () => {
    if (!canProceedCurrentStep) return
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Step 5 -> scroll down smoothly to submit button
      const submitBtn = document.getElementById('btn-pj-submit')
      if (submitBtn) {
        submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
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

    // Validasi Frontend 2: Check Email Duplikat
    if (emailError) {
      setError('Email ini telah memiliki akun.')
      return
    }

    // Validasi Frontend 3: Password Minimal 8 Karakter
    if (formData.password.length < 8) {
      setError('Password minimal harus 8 karakter.')
      return
    }

    // Validasi Frontend 4: No. HP
    const phoneRegex = /^08[0-9]{8,13}$/
    if (!phoneRegex.test(formData.no_hp.trim())) {
      setError('Nomor HP harus berawalan 08 dan terdiri dari 10 hingga 15 digit angka.')
      return
    }

    // Validasi Frontend 5: Alokasi Jadwal Lengkap
    if (!formData.fakultas || !formData.prodi || !formData.semester || !formData.mata_kuliah || !formData.kelas) {
      setError('Harap lengkapi seluruh langkah Alokasi Jadwal (Fakultas, Prodi, Semester, Mata Kuliah, dan Kelas).')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', formData)
      setSuccess(response.data.message || 'Pendaftaran berhasil! Mengalihkan ke halaman verifikasi...')
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

  const stepTitles = ['FAKULTAS', 'PRODI', 'SEMESTER', 'MATKUL', 'KELAS']

  return (
    <div className="pj-register-wrapper">
      <main className="pj-register-container">
        {/* Retro Floating Stamp / Badge */}
        <div className="pj-floating-badge">
          SIKELAS • 2026
        </div>

        {/* Card Container */}
        <div className="pj-register-card">
          {/* Top Title Header */}
          <header className="pj-register-header">
            <p className="pj-header-tag">MEMBER · ACCESS · PORTAL</p>
            <h1 className="pj-header-title">DAFTAR AKUN PJ KELAS</h1>
            <p className="pj-header-subtitle">
              Pilih alokasi penanggung jawab mata kuliah sesuai data jadwal kampus.
            </p>
          </header>

          {/* Navigation Tabs (Sign Up / Sign In) */}
          <nav aria-label="Tab Akses" className="pj-nav-tabs">
            <span className="pj-nav-tab pj-nav-tab-active">
              SIGN UP (DAFTAR)
            </span>
            <Link to="/login" className="pj-nav-tab pj-nav-tab-inactive">
              SIGN IN (MASUK)
            </Link>
          </nav>

          {/* State: Loading Initial Options */}
          {loadingOptions ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'Chivo Mono, monospace' }}>
              <p style={{ fontWeight: 'bold', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}><ArrowClockwise size={18} /> Memeriksa ketersediaan kuota pendaftaran...</p>
            </div>
          ) : fetchError ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'Chivo Mono, monospace' }}>
              <div style={{ marginBottom: '12px' }}><ExclamationTriangleFill size={36} color="#b91c1c" /></div>
              <h3 style={{ fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>Gagal Memuat Data</h3>
              <p style={{ fontSize: '13px', color: '#525252', margin: '8px 0 20px 0' }}>
                Server sedang menyiapkan koneksi database. Silakan muat ulang.
              </p>
              <button
                type="button"
                onClick={fetchInitialData}
                className="pj-btn-submit"
                style={{ width: 'auto', display: 'inline-flex', padding: '10px 24px', fontSize: '13px' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowClockwise size={16} /> Muat Ulang Opsi</span>
              </button>
            </div>
          ) : isRegistrationClosed ? (
            /* Special State: Registration Closed */
            <div style={{ padding: '40px 24px', textAlign: 'center', fontFamily: 'Chivo Mono, monospace' }}>
              <div style={{ marginBottom: '12px' }}><LockFill size={42} color="#b91c1c" /></div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', textTransform: 'uppercase', color: '#b91c1c' }}>
                Pendaftaran PJ Ditutup
              </h2>
              <p style={{ fontSize: '13px', color: '#404040', lineHeight: '1.6', margin: '12px auto 24px auto', maxWidth: '440px' }}>
                {closedMessage || 'Seluruh Mata Kuliah pada semester ini telah memiliki Penanggung Jawab (PJ) terdaftar.'}
              </p>
              <Link to="/login" className="pj-btn-submit" style={{ textDecoration: 'none', display: 'inline-flex', width: 'auto' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowLeftShort size={20} /> Kembali ke Halaman Login</span>
              </Link>
            </div>
          ) : (
            /* Form Registrasi */
            <form onSubmit={handleSubmit} className="pj-form-body">
              {/* Alert Error / Success */}
              {error && (
                <div className="pj-alert-box pj-alert-error">
                  <ExclamationTriangleFill size={18} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span>{error}</span>
                    {error.includes('Email ini telah memiliki akun') && (
                      <div style={{ marginTop: '8px' }}>
                        <Link
                          to="/login"
                          style={{
                            display: 'inline-block',
                            background: '#000000',
                            color: '#ffffff',
                            padding: '6px 12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            textDecoration: 'none'
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><ArrowRightShort size={18} /> Login ke Akun Anda</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {success && (
                <div className="pj-alert-box pj-alert-success">
                  <CheckCircleFill size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                  <span>{success}</span>
                </div>
              )}

              {/* Field 1: Username / Nama Lengkap */}
              <div className="pj-input-group">
                <div className="pj-label-row">
                  <label className="pj-label" htmlFor="username">
                    <PersonFill size={15} /> Username / Nama Lengkap
                  </label>
                  <span className="pj-badge-tag">WAJIB</span>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="pj-input-text"
                  placeholder="Contoh: Muhammad Rafli"
                  value={formData.username}
                  onChange={handleChange}
                />
                <p className="pj-input-hint">
                  <InfoCircleFill size={13} style={{ flexShrink: 0, color: '#2563eb' }} /> Hanya boleh huruf dan spasi (tanpa angka / karakter khusus).
                </p>
              </div>

              {/* Field 2: NIM Mahasiswa & Email Otomatis */}
              <div className="pj-input-group">
                <div className="pj-label-row">
                  <label className="pj-label" htmlFor="nim_nip">
                    <MortarboardFill size={16} /> Email Kampus
                  </label>
                  <span className="pj-badge-tag">Wajib</span>
                </div>
                <div className="pj-nim-combo">
                  <input
                    id="nim_nip"
                    name="nim_nip"
                    type="text"
                    required
                    maxLength={15}
                    className="pj-nim-input"
                    placeholder="Contoh: 2108096001"
                    value={formData.nim_nip}
                    onChange={handleChange}
                    onBlur={handleEmailBlur}
                  />
                  <div className="pj-nim-suffix">
                    @student.walisongo.ac.id
                  </div>
                </div>
                <p className="pj-input-hint">
                  <EnvelopeFill size={13} style={{ flexShrink: 0 }} /> Surat OTP akan dikirim ke:{' '}
                  <strong>{formData.email || 'NIM@student.walisongo.ac.id'}</strong>
                  {emailChecking && <span style={{ color: '#0284c7', marginLeft: '6px' }}>(memeriksa...)</span>}
                </p>
                {emailError && (
                  <p className="pj-input-hint" style={{ color: '#b91c1c', fontWeight: 'bold' }}>
                    <ExclamationTriangleFill size={13} style={{ flexShrink: 0, color: '#b91c1c' }} /> {emailError}
                  </p>
                )}
              </div>

              {/* Field 3: Password */}
              <div className="pj-input-group">
                <label className="pj-label" htmlFor="password">
                  <LockFill size={15} /> Password
                </label>
                <div className="pj-password-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="pj-input-text"
                    style={{ paddingRight: '48px' }}
                    placeholder="Minimal 8 karakter..."
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    className={`pj-password-toggle ${showPassword ? 'active' : ''}`}
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#000000' }}>
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <p className="pj-input-hint">
                  <InfoCircleFill size={13} style={{ flexShrink: 0, color: '#2563eb' }} /> Password minimal 8 karakter.
                </p>
              </div>

              {/* Field 4: No. HP (WhatsApp) */}
              <div className="pj-input-group">
                <label className="pj-label" htmlFor="no_hp">
                  <TelephoneFill size={15} /> No. HP (WhatsApp)
                </label>
                <input
                  id="no_hp"
                  name="no_hp"
                  type="tel"
                  required
                  pattern="[0-9]{10,15}"
                  className="pj-input-text"
                  placeholder="08123456789"
                  value={formData.no_hp}
                  onChange={handleChange}
                />
                <p className="pj-input-hint">
                  <InfoCircleFill size={13} style={{ flexShrink: 0, color: '#2563eb' }} /> Harus berawalan 08 (10-15 digit angka).
                </p>
              </div>

              {/* Field 5: Stepper Alokasi Jadwal (Steps 1 of 5) */}
              <section className="pj-stepper-box">
                <div className="pj-stepper-top">
                  <p className="pj-stepper-counter">
                    ALOKASI JADWAL · STEP {currentStep} OF 5
                  </p>
                </div>

                {/* Stepper Track Nodes */}
                <div className="pj-stepper-track">
                  {[1, 2, 3, 4, 5].map((step, idx) => {
                    const isCompleted = step < currentStep && isStepValid(step)
                    const isAccessible = isStepAccessible(step)
                    const isActive = step === currentStep

                    return (
                      <div key={step} style={{ display: 'contents' }}>
                        <button
                          type="button"
                          className="pj-step-node"
                          disabled={!isAccessible}
                          onClick={() => handleStepClick(step)}
                          title={`Langkah ${step}: ${stepTitles[idx]}`}
                        >
                          <div
                            className={`pj-step-box ${isCompleted
                              ? 'pj-step-box-completed'
                              : isActive
                                ? 'pj-step-box-active'
                                : 'pj-step-box-inactive'
                              }`}
                          >
                            {isCompleted ? <CheckLg size={16} /> : step}
                          </div>
                          <span
                            className={`pj-step-label ${isActive ? 'pj-step-label-active' : 'pj-step-label-inactive'
                              }`}
                          >
                            {stepTitles[idx]}
                          </span>
                        </button>
                        {idx < 4 && <div className="pj-step-connector" />}
                      </div>
                    )
                  })}
                </div>

                {/* Stepper Dashed Content Pane */}
                <div className="pj-stepper-pane">
                  {/* Step 1: Fakultas */}
                  {currentStep === 1 && (
                    <>
                      <div className="pj-pane-header">
                        <h3><Bank size={18} /> 1. PILIH FAKULTAS</h3>
                        <p>
                          Pilih unit fakultas tempat mata kuliah Anda diselenggarakan. Data prodi akan disesuaikan otomatis.
                        </p>
                      </div>
                      <select
                        id="faculty"
                        name="fakultas"
                        required
                        className="pj-select-brutal"
                        value={formData.fakultas}
                        onChange={handleChange}
                      >
                        <option value="">-- Pilih Fakultas --</option>
                        {fakultasOptions.map((f, i) => (
                          <option key={i} value={f}>{f}</option>
                        ))}
                      </select>
                    </>
                  )}

                  {/* Step 2: Program Studi */}
                  {currentStep === 2 && (
                    <>
                      <div className="pj-pane-header">
                        <h3><JournalBookmarkFill size={18} /> 2. PROGRAM STUDI (PRODI)</h3>
                        <p>Tentukan program studi resmi di bawah naungan fakultas terpilih.</p>
                      </div>
                      <select
                        id="major"
                        name="prodi"
                        required
                        className="pj-select-brutal"
                        value={formData.prodi}
                        onChange={handleChange}
                      >
                        <option value="">-- Pilih Program Studi --</option>
                        {prodiOptions.map((p, i) => (
                          <option key={i} value={p}>{p}</option>
                        ))}
                      </select>
                      <p className="pj-input-hint">
                        <InfoCircleFill size={13} style={{ flexShrink: 0, color: '#2563eb' }} /> Terverifikasi berdasarkan fakultas terpilih.
                      </p>
                    </>
                  )}

                  {/* Step 3: Semester */}
                  {currentStep === 3 && (
                    <>
                      <div className="pj-pane-header">
                        <h3><CalendarWeekFill size={18} /> 3. SEMESTER (AKTIF)</h3>
                        <p>Pilih semester perkuliahan berjalan sesuai kalender akademik kampus.</p>
                      </div>
                      <select
                        id="semester"
                        name="semester"
                        required
                        className="pj-select-brutal"
                        value={formData.semester}
                        onChange={handleChange}
                      >
                        <option value="">-- Pilih Semester --</option>
                        {semesterOptions.map((s, i) => (
                          <option key={i} value={s}>Semester {s}</option>
                        ))}
                      </select>
                      <p className="pj-input-hint">
                        <InfoCircleFill size={13} style={{ flexShrink: 0, color: '#2563eb' }} /> Database kurikulum aktif otomatis terhubung.
                      </p>
                    </>
                  )}

                  {/* Step 4: Mata Kuliah */}
                  {currentStep === 4 && (
                    <>
                      <div className="pj-pane-header">
                        <h3><BookHalf size={18} /> 4. MATA KULIAH (BEBAS PJ)</h3>
                        <p>Pilih mata kuliah yang belum memiliki penanggung jawab (PJ).</p>
                      </div>
                      <select
                        id="course"
                        name="mata_kuliah"
                        required
                        className="pj-select-brutal"
                        value={formData.mata_kuliah}
                        onChange={handleChange}
                      >
                        <option value="">-- Pilih Mata Kuliah dari Database --</option>
                        {uniqueCourseOptions.map((m, i) => (
                          <option key={i} value={m}>{m}</option>
                        ))}
                      </select>
                      <p className="pj-input-hint">
                        <InfoCircleFill size={13} style={{ flexShrink: 0, color: '#2563eb' }} /> Kuota PJ tersedia untuk semester yang dipilih.
                      </p>
                    </>
                  )}

                  {/* Step 5: Kelas */}
                  {currentStep === 5 && (
                    <>
                      <div className="pj-pane-header">
                        <h3><TagFill size={18} /> 5. KELAS (BEBAS PJ)</h3>
                        <p>Tentukan rombongan belajar kelas yang Anda ampu sebagai perwakilan.</p>
                      </div>
                      <select
                        id="classGroup"
                        name="kelas"
                        required
                        className="pj-select-brutal"
                        value={formData.kelas}
                        onChange={handleChange}
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {kelasOptions.map((k, i) => (
                          <option key={i} value={k}>Kelas {k}</option>
                        ))}
                      </select>
                      <p className="pj-input-hint">
                        <InfoCircleFill size={13} style={{ flexShrink: 0, color: '#2563eb' }} /> Alokasi kelas ini akan langsung tersinkron ke daftar jadwal kuliah.
                      </p>
                    </>
                  )}
                </div>

                {/* Stepper Navigation Buttons */}
                <div className="pj-stepper-actions">
                  <button
                    type="button"
                    className="pj-btn-back"
                    disabled={currentStep === 1}
                    onClick={handleBackStep}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><ArrowLeftShort size={18} /> BACK</span>
                  </button>
                  <button
                    type="button"
                    className="pj-btn-next"
                    disabled={!canProceedCurrentStep}
                    title={!canProceedCurrentStep ? "Silakan lakukan pemilihan terlebih dahulu untuk melanjutkan" : ""}

                    onClick={handleNextStep}
                  >
                    {currentStep === 5 ? (
                      <>
                        <span>SELESAI</span> <CheckLg size={16} />
                      </>
                    ) : (
                      <>
                        <span>NEXT</span> <ArrowRightShort size={20} />
                      </>
                    )}
                  </button>
                </div>
              </section>

              {/* Final Submit Button */}
              <button
                id="btn-pj-submit"
                type="submit"
                disabled={loading}
                className="pj-btn-submit"
              >
                <span>{loading ? 'MEMPROSES PENDAFTARAN...' : 'DAFTAR SEKARANG'}</span>
                <ArrowRightShort size={24} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
              </button>

              {/* Form Footer Navigation & Links */}
              <footer className="pj-form-footer">
                <p className="pj-footer-login-text">
                  Sudah punya akun?{' '}
                  <Link to="/login" className="pj-link-login">
                    Login di sini
                  </Link>
                </p>

                <div className="pj-otp-banner">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><PinAngleFill size={15} color="#ef4444" /> Belum tuntas verifikasi OTP?</span>
                  <Link to="/verify-email" className="pj-link-otp">
                    Lanjutkan Verifikasi Di Sini
                  </Link>
                </div>

                <div>
                  <Link to="/" className="pj-btn-home">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><HouseDoorFill size={15} /> Kembali ke Beranda</span>
                  </Link>
                </div>
              </footer>
            </form>
          )}

          {/* Ticket Perforated Footer */}
          <div className="pj-ticket-footer">
            <p>★ ESTABLISHED 2026 ★ SIKELAS KAMPUS ★ ALL RIGHTS RESERVED ★</p>
          </div>
        </div>

        {/* Help Desk Link */}
        <div className="pj-helpdesk-box">
          <p>
            Butuh bantuan?{' '}
            <a href="https://wa.me/6281234567890?text=Halo%20Admin%20SiKelas,%20saya%20membutuhkan%20bantuan%20terkait%20pendaftaran%20PJ" target="_blank" rel="noopener noreferrer">
              Hubungi Admin Helpdesk
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}

export default Register
