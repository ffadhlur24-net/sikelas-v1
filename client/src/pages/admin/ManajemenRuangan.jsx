import { useState, useEffect } from 'react'
import api from '../../api/axios'
import './ManajemenRuangan.css'
import { useToast } from '../../context/ToastContext'
import ConfirmModal from '../../components/Modal/ConfirmModal'
import NeoTimePicker from '../../components/TimePicker/NeoTimePicker'
import NeoSelect from '../../components/Select/NeoSelect'
import {
  Building,
  Buildings,
  GeoAltFill,
  ArrowRight,
  ArrowLeft,
  PlusLg,
  LayersFill,
  CalendarEventFill,
  PencilSquare,
  TrashFill,
  ClockFill,
  ArrowCounterclockwise
} from 'react-bootstrap-icons'

const SEMESTER_OPTIONS = [
  { value: '1', label: 'Semester 1' },
  { value: '2', label: 'Semester 2' },
  { value: '3', label: 'Semester 3' },
  { value: '4', label: 'Semester 4' },
  { value: '5', label: 'Semester 5' },
  { value: '6', label: 'Semester 6' },
  { value: '7', label: 'Semester 7' },
  { value: '8', label: 'Semester 8' },
  { value: 'SPB', label: 'SPB (Semester Pendek)' }
]

const SKS_OPTIONS = [
  { value: '1', label: '1 SKS (50 Menit)' },
  { value: '2', label: '2 SKS (100 Menit)' },
  { value: '3', label: '3 SKS (150 Menit)' },
  { value: '4', label: '4 SKS (200 Menit)' }
]

const HARI_OPTIONS = [
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
  { value: 'Sabtu', label: 'Sabtu' },
  { value: 'Minggu', label: 'Minggu' }
]

function ManajemenRuangan() {
  const { showSuccess, showError } = useToast()
  const [rooms, setRooms] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [confirmDeleteSched, setConfirmDeleteSched] = useState({ open: false, id: null, matkul: '', loading: false })

  // NAVIGASI HIERARKI BERJENJANG:
  // selectedKampus: null (Level 1: Daftar Kampus), String (mis: "Kampus 3")
  // selectedGedung: null (Level 2: Daftar Gedung), String (mis: "Gedung Q")
  const [selectedKampus, setSelectedKampus] = useState(null)
  const [selectedGedung, setSelectedGedung] = useState(null)

  // Form Tambah Kampus / Gedung / Ruangan Baru
  const [newKampusInput, setNewKampusInput] = useState('')
  const [newGedungInput, setNewGedungInput] = useState('')

  const [formData, setFormData] = useState({
    nama: '',
    lantai: 1,
    kapasitas: 40
  })

  // Kalkulator SKS Otomatis (50 Menit per 1 SKS)
  const calculateEndTime = (startTime, sksValue) => {
    if (!startTime || !sksValue) return ''
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + Number(sksValue) * 50
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }

  // Tambah Jadwal Pertama Sekaligus (Cascading Fakultas ➔ Prodi + SKS System)
  const [addWithSchedule, setAddWithSchedule] = useState(false)
  const [initialSched, setInitialSched] = useState({
    fakultas: '',
    prodi: '',
    semester: '1',
    kelas: 'A',
    mata_kuliah: '',
    dosen: '',
    hari: 'Senin',
    sks: '3',
    waktu_mulai: '07:30',
    waktu_selesai: '10:00'
  })

  // State mode input kelas kustom/manual
  const [isCustomClassInitial, setIsCustomClassInitial] = useState(false)
  const [isCustomClassSched, setIsCustomClassSched] = useState(false)

  // State Modal Kelola Jadwal Ruangan
  const [selectedRoomModal, setSelectedRoomModal] = useState(null)
  const [roomSchedules, setRoomSchedules] = useState([])
  const [loadingSched, setLoadingSched] = useState(false)
  const [showFormSched, setShowFormSched] = useState(false)
  const [editingSchedId, setEditingSchedId] = useState(null)

  const [schedForm, setSchedForm] = useState({
    fakultas: '',
    prodi: '',
    semester: '1',
    kelas: 'A',
    mata_kuliah: '',
    dosen: '',
    hari: 'Senin',
    sks: '3',
    waktu_mulai: '07:30',
    waktu_selesai: '10:00'
  })

  // Deteksi kode kelas mengulang otomatis berdasarkan prodi (misal: TIF-U, SI-U, TI-U)
  const getRepeatClassCode = (prodiName) => {
    if (!prodiName) return 'U'
    const dep = departments.find(d => d.nama_prodi === prodiName)
    if (dep?.kode_prodi) return `${dep.kode_prodi.toUpperCase()}-U`
    const initials = prodiName
      .replace(/[^a-zA-Z\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .toUpperCase()
    return `${initials || 'U'}-U`
  }

  // Generate opsi kelas: standar (A-G), mengulang prodi, mengulang umum, dan opsi ketik manual
  const getClassOptions = (prodiName) => {
    const base = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(k => ({ value: k, label: `Kelas ${k}` }))
    const repeatCode = getRepeatClassCode(prodiName)
    const repeatOptions = [
      { value: repeatCode, label: `${repeatCode} (Kelas Mengulang)` },
      { value: 'U', label: 'Kelas U (Mengulang Umum)' }
    ]
    const uniqueRepeat = repeatOptions.filter(opt => opt.value !== 'U' || repeatCode !== 'U')
    return [
      ...base,
      ...uniqueRepeat,
      { value: '__CUSTOM__', label: '✏️ + Ketik Manual / Kode Khusus...' }
    ]
  }

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data.rooms || [])
    } catch (error) {
      console.error("Gagal mengambil data ruangan:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departemen')
      const deps = res.data.departemen || []
      setDepartments(deps)
    } catch (error) {
      console.error('Gagal mengambil data prodi:', error)
    }
  }

  useEffect(() => {
    fetchRooms()
    fetchDepartments()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Update Waktu Selesai Otomatis pada Initial Sched
  const handleInitialSchedTimeChange = (startTime, sksVal) => {
    const calculatedEnd = calculateEndTime(startTime, sksVal)
    setInitialSched(prev => ({
      ...prev,
      waktu_mulai: startTime,
      sks: sksVal,
      waktu_selesai: calculatedEnd
    }))
  }

  // Update Waktu Selesai Otomatis pada Modal Sched Form
  const handleSchedFormTimeChange = (startTime, sksVal) => {
    const calculatedEnd = calculateEndTime(startTime, sksVal)
    setSchedForm(prev => ({
      ...prev,
      waktu_mulai: startTime,
      sks: sksVal,
      waktu_selesai: calculatedEnd
    }))
  }

  // Ekstrak Daftar Fakultas Unik dari Database
  const listFakultas = Array.from(new Set(departments.map(d => d.fakultas).filter(Boolean)))
  const fakultasOptions = listFakultas.map(fak => ({ value: fak, label: fak }))

  const prodiOptionsInitial = departments
    .filter(d => d.fakultas === initialSched.fakultas && !d.nama_prodi.includes('(Umum)'))
    .map(dep => ({ value: dep.nama_prodi, label: dep.nama_prodi }))

  const prodiOptionsSched = departments
    .filter(d => d.fakultas === schedForm.fakultas && !d.nama_prodi.includes('(Umum)'))
    .map(dep => ({ value: dep.nama_prodi, label: dep.nama_prodi }))

  // Ekstrak Daftar Kampus Unik & Daftar Gedung Unik
  const kampusList = Array.from(new Set(rooms.map(r => r.kampus).filter(Boolean)))
  if (!kampusList.includes('Kampus 3') && kampusList.length === 0) kampusList.push('Kampus 3')

  const gedungListInSelectedKampus = selectedKampus
    ? Array.from(new Set(rooms.filter(r => r.kampus === selectedKampus).map(r => r.gedung).filter(Boolean)))
    : []

  // Filter Ruangan di Level 3 (Terkunci pada Kampus & Gedung Terpilih)
  const roomsInSelectedGedung = (selectedKampus && selectedGedung)
    ? rooms.filter(r => r.kampus === selectedKampus && r.gedung === selectedGedung)
    : []

  // Kelompokkan Ruangan berdasarkan Lantai
  const roomsByLantai = roomsInSelectedGedung.reduce((acc, room) => {
    const lt = room.lantai || 1
    if (!acc[lt]) acc[lt] = []
    acc[lt].push(room)
    return acc
  }, {})

  const handleAddKampus = (e) => {
    e.preventDefault()
    if (!newKampusInput.trim()) return
    setSelectedKampus(newKampusInput.trim())
    setNewKampusInput('')
  }

  const handleAddGedung = (e) => {
    e.preventDefault()
    if (!newGedungInput.trim()) return
    setSelectedGedung(newGedungInput.trim())
    setNewGedungInput('')
  }

  const handleAddRooms = async (e) => {
    e.preventDefault()
    if (!selectedKampus || !selectedGedung) return

    if (addWithSchedule) {
      if (!initialSched.fakultas || !initialSched.prodi || !initialSched.mata_kuliah.trim() || !initialSched.dosen.trim() || !initialSched.kelas.trim()) {
        showError('Harap lengkapi semua data jadwal perkuliahan!', 'TAMBAH RUANGAN')
        return
      }
    }

    setActionLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const payloadRoom = {
        ...formData,
        kampus: selectedKampus,
        gedung: selectedGedung
      }

      const resRoom = await api.post('/rooms', payloadRoom)
      const newRoom = resRoom.data.room

      if (addWithSchedule && newRoom) {
        await api.post('/schedules', {
          ...initialSched,
          room_id: newRoom.id
        })
      }

      setMessage({ text: `Ruangan ${formData.nama} berhasil ditambahkan ke ${selectedGedung}!`, type: 'success' })
      setFormData({ nama: '', lantai: 1, kapasitas: 40 })
      setAddWithSchedule(false)
      setIsCustomClassInitial(false)
      setInitialSched({
        fakultas: '',
        prodi: '',
        semester: '1',
        kelas: 'A',
        mata_kuliah: '',
        dosen: '',
        hari: 'Senin',
        sks: '3',
        waktu_mulai: '07:30',
        waktu_selesai: '10:00'
      })
      fetchRooms()
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || 'Gagal menambahkan ruangan baru.',
        type: 'error'
      })
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    }
  }

  const handleUppdateStatus = async (id, status) => {
    setActionLoading(true)
    try {
      await api.patch(`/rooms/${id}/status`, { status })
      showSuccess(`Status ruangan berhasil diubah menjadi ${status}!`, 'STATUS RUANGAN')
      fetchRooms()
    } catch (error) {
      showError('Gagal mengupdate status ruangan.', 'STATUS RUANGAN')
    } finally {
      setActionLoading(false)
    }
  }

  const fetchRoomSchedules = async (roomId) => {
    try {
      setLoadingSched(true)
      const res = await api.get(`/schedules?room_id=${roomId}`)
      setRoomSchedules(res.data.schedules || [])
    } catch (error) {
      console.error("Gagal memuat jadwal ruangan:", error)
    } finally {
      setLoadingSched(false)
    }
  }

  const handleOpenRoomSchedules = (room) => {
    setSelectedRoomModal(room)
    setShowFormSched(false)
    setEditingSchedId(null)
    setIsCustomClassSched(false)
    fetchRoomSchedules(room.id)
  }

  const handleSaveSchedule = async (e) => {
    e.preventDefault()
    if (!selectedRoomModal) return

    if (!schedForm.fakultas || !schedForm.prodi || !schedForm.mata_kuliah.trim() || !schedForm.dosen.trim() || !schedForm.kelas.trim()) {
      showError('Harap lengkapi semua data jadwal perkuliahan!', 'JADWAL KULIAH')
      return
    }

    try {
      if (editingSchedId) {
        await api.put(`/schedules/${editingSchedId}`, {
          ...schedForm,
          room_id: selectedRoomModal.id
        })
        showSuccess('Jadwal perkuliahan berhasil diperbarui!', 'JADWAL KULIAH')
      } else {
        await api.post('/schedules', {
          ...schedForm,
          room_id: selectedRoomModal.id
        })
        showSuccess('Jadwal perkuliahan berhasil ditambahkan!', 'JADWAL KULIAH')
      }

      setShowFormSched(false)
      setEditingSchedId(null)
      setIsCustomClassSched(false)
      fetchRoomSchedules(selectedRoomModal.id)
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal menyimpan jadwal perkuliahan.', 'JADWAL KULIAH')
    }
  }

  const handleDeleteSchedule = (id, matkul) => {
    setConfirmDeleteSched({ open: true, id, matkul: matkul || 'ini', loading: false })
  }

  const handleConfirmDeleteSchedule = async () => {
    const { id, matkul } = confirmDeleteSched
    setConfirmDeleteSched(prev => ({ ...prev, loading: true }))
    try {
      await api.delete(`/schedules/${id}`)
      showSuccess(`Jadwal perkuliahan "${matkul}" berhasil dihapus!`, 'JADWAL KULIAH')
      setConfirmDeleteSched({ open: false, id: null, matkul: '', loading: false })
      if (selectedRoomModal) {
        fetchRoomSchedules(selectedRoomModal.id)
      }
    } catch (error) {
      showError('Gagal menghapus jadwal.', 'JADWAL KULIAH')
      setConfirmDeleteSched(prev => ({ ...prev, loading: false }))
    }
  }

  const handleEditScheduleClick = (sched) => {
    const matchedDep = departments.find(d => d.nama_prodi === sched.prodi)

    // Hitung SKS dari selisih waktu_mulai dan waktu_selesai
    let derivedSks = '3'
    if (sched.waktu_mulai && sched.waktu_selesai) {
      const [startH, startM] = sched.waktu_mulai.split(':').map(Number)
      const [endH, endM] = sched.waktu_selesai.split(':').map(Number)
      const durationMin = (endH * 60 + endM) - (startH * 60 + startM)
      if (durationMin > 0) {
        derivedSks = String(Math.max(1, Math.round(durationMin / 50)))
      }
    }

    const repeatCode = getRepeatClassCode(sched.prodi)
    const standardCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'U', repeatCode]
    const isCustom = sched.kelas && !standardCodes.includes(sched.kelas)
    setIsCustomClassSched(Boolean(isCustom))

    setEditingSchedId(sched.id)
    setSchedForm({
      fakultas: matchedDep ? matchedDep.fakultas : '',
      prodi: sched.prodi || '',
      semester: sched.semester || '1',
      kelas: sched.kelas || 'A',
      mata_kuliah: sched.mata_kuliah || '',
      dosen: sched.dosen || '',
      hari: sched.hari || 'Senin',
      sks: derivedSks,
      waktu_mulai: sched.waktu_mulai ? sched.waktu_mulai.substring(0, 5) : '07:30',
      waktu_selesai: sched.waktu_selesai ? sched.waktu_selesai.substring(0, 5) : '10:00'
    })
    setShowFormSched(true)
  }

  const totalBuildings = new Set(rooms.map(room => `${room.kampus}-${room.gedung}`)).size
  const availableRooms = rooms.filter(room => room.status === 'tersedia').length
  const lockedRooms = rooms.filter(room => room.status === 'terkunci').length

  return (
    <div className="room-management-page animate-fade-in">
      <section className="room-clock-card">
        <div className="room-clock-icon" aria-hidden="true"><ClockFill size={20} /></div>
        <div>
          <h2>{currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — {currentTime.toLocaleTimeString('id-ID')}</h2>
        </div>
        <span className="room-online"><span /> SISTEM ONLINE</span>
      </section>

      <section className="room-stats-grid" aria-label="Ringkasan ruangan">
        <article className="room-stat stat-navy"><span>Total Ruangan</span><strong>{rooms.length}</strong></article>
        <article className="room-stat stat-blue"><span>Gedung Aktif</span><strong>{totalBuildings}</strong></article>
        <article className="room-stat stat-green"><span>Ruangan Tersedia</span><strong>{availableRooms}</strong></article>
        <article className="room-stat stat-orange"><span>Ruangan Terkunci</span><strong>{lockedRooms}</strong></article>
      </section>

      <div className="room-page-heading">
        <p className="room-eyebrow">ADMINISTRATOR / FACILITY CONTROL</p>
        <h1>Manajemen Ruangan & Jadwal</h1>
        <p>Inventaris fisik teratur berbasis hierarki Kampus <ArrowRight size={12} style={{ margin: '0 4px' }} /> Gedung <ArrowRight size={12} style={{ margin: '0 4px' }} /> Ruangan Per Lantai.</p>
      </div>

      {message.text && (
        <div style={{
          background: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
          color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
          padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500'
        }}>
          {message.text}
        </div>
      )}

      {/* BREADCRUMB NAVIGASI HIERARKI 3 LEVEL */}
      <div className="room-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: 'bold', flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: !selectedKampus ? '#059669' : '#e2e8f0', color: !selectedKampus ? '#fff' : '#475569' }}
          onClick={() => { setSelectedKampus(null); setSelectedGedung(null); }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Building size={15} /> Level 1: Daftar Kampus</span>
        </button>

        {selectedKampus && (
          <>
            <span style={{ display: "inline-flex", alignItems: "center" }}><ArrowRight size={13} /></span>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: selectedKampus && !selectedGedung ? '#059669' : '#e2e8f0', color: selectedKampus && !selectedGedung ? '#fff' : '#475569' }}
              onClick={() => setSelectedGedung(null)}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><Buildings size={15} /> Level 2: Gedung ({selectedKampus})</span>
            </button>
          </>
        )}

        {selectedKampus && selectedGedung && (
          <>
            <span style={{ display: "inline-flex", alignItems: "center" }}><ArrowRight size={13} /></span>
            <span style={{ color: '#059669', background: '#d1fae5', padding: '4px 12px', borderRadius: '6px' }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><GeoAltFill size={15} /> Level 3: {selectedGedung} ({selectedKampus}) - Ruangan Per Lantai</span>
            </span>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* LEVEL 1: DAFTAR MASTER KAMPUS */}
      {/* ========================================================= */}
      {!selectedKampus && (
        <>
          <div className="room-add-campus-card card-flat" style={{ marginBottom: '24px', maxWidth: '480px' }}>
            <h3 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}><PlusLg size={16} /> Tambah Lokasi Kampus Baru</h3>
            <form onSubmit={handleAddKampus} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Kampus 3"
                value={newKampusInput}
                onChange={(e) => setNewKampusInput(e.target.value)}
                required
              />
              <button className="btn btn-primary" type="submit">Tambah</button>
            </form>
          </div>

          <div className="room-campus-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {kampusList.map((kam, idx) => {
              const totalRooms = rooms.filter(r => r.kampus === kam).length
              const totalGedung = new Set(rooms.filter(r => r.kampus === kam).map(r => r.gedung)).size
              return (
                <div
                  key={idx}
                  className="room-campus-card card-flat"
                  style={{ cursor: 'pointer', borderLeft: '4px solid #059669', background: '#fff' }}
                  onClick={() => setSelectedKampus(kam)}
                >
                  <div style={{ marginBottom: "12px", color: "#059669" }}><Building size={34} /></div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px' }}>{kam}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>{totalGedung} Gedung • {totalRooms} Ruangan</p>
                  <span style={{ color: "#059669", fontSize: "13px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "5px" }}>Kelola Gedung <ArrowRight size={13} /></span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* LEVEL 2: DAFTAR MASTER GEDUNG DALAM KAMPUS TERPILIH */}
      {/* ========================================================= */}
      {selectedKampus && !selectedGedung && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}><Buildings size={20} /> Gedung di {selectedKampus}</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedKampus(null)} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><ArrowLeft size={14} /> Kembali ke Kampus</button>
          </div>

          <div className="card-flat" style={{ marginBottom: '24px', maxWidth: '480px' }}>
            <h3 style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}><PlusLg size={16} /> Tambah Gedung Baru di {selectedKampus}</h3>
            <form onSubmit={handleAddGedung} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Gedung Q"
                value={newGedungInput}
                onChange={(e) => setNewGedungInput(e.target.value)}
                required
              />
              <button className="btn btn-primary" type="submit">Tambah Gedung</button>
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {gedungListInSelectedKampus.map((ged, idx) => {
              const countRooms = rooms.filter(r => r.kampus === selectedKampus && r.gedung === ged).length
              return (
                <div
                  key={idx}
                  className="card-flat"
                  style={{ cursor: 'pointer', borderLeft: '4px solid #2563eb', background: '#fff' }}
                  onClick={() => setSelectedGedung(ged)}
                >
                  <div style={{ marginBottom: "12px", color: "#2563eb" }}><Buildings size={34} /></div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px' }}>{ged}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>{countRooms} Ruangan Perkuliahan</p>
                  <span style={{ color: "#2563eb", fontSize: "13px", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "5px" }}>Lihat Ruangan Per Lantai <ArrowRight size={13} /></span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* LEVEL 3: RUANGAN PER LANTAI DI GEDUNG TERPILIH + JADWAL */}
      {/* ========================================================= */}
      {selectedKampus && selectedGedung && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}><GeoAltFill size={20} /> Ruangan {selectedGedung} ({selectedKampus})</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Daftar inventaris ruang terbagi otomatis per lantai gedung.</p>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => setSelectedGedung(null)}><ArrowLeft size={14} /> Kembali ke Daftar Gedung</button>
          </div>

          {/* Form Tambah Ruangan Baru di Gedung Terpilih */}
          <div className="card-flat" style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: "16px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}><PlusLg size={16} /> Tambah Ruangan Baru di {selectedGedung}</h3>
            <form onSubmit={handleAddRooms}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div style={{ flex: '2', minWidth: '160px' }}>
                  <label className="form-label">Nama Ruangan (Mis: Q.3.1)</label>
                  <input type="text" className="input-field" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} required />
                </div>
                <div style={{ flex: '1', minWidth: '100px' }}>
                  <label className="form-label">Lantai ke-</label>
                  <input type="number" className="input-field" value={formData.lantai} onChange={(e) => setFormData({ ...formData, lantai: Number(e.target.value) })} required />
                </div>
                <div style={{ flex: '1', minWidth: '120px' }}>
                  <label className="form-label">Kapasitas (Kursi)</label>
                  <input type="number" className="input-field" value={formData.kapasitas} onChange={(e) => setFormData({ ...formData, kapasitas: Number(e.target.value) })} required />
                </div>
              </div>

              {/* Tambah Jadwal Pertama Sekaligus (Cascading Fakultas ➔ Prodi + SKS System) */}
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '16px', border: '4px solid var(--room-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={addWithSchedule}
                    onChange={(e) => setAddWithSchedule(e.target.checked)}
                  />
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><PlusLg size={14} /> Tambah Jadwal Perkuliahan Pertama Sekaligus (Opsional)</span>
                </label>

                {addWithSchedule && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--room-border)' }}>
                    <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {/* DROPDOWN FAKULTAS (CASCADING 1) */}
                      <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                        <label className="form-label">Fakultas</label>
                        <NeoSelect
                          value={initialSched.fakultas}
                          onChange={(val) => setInitialSched({ ...initialSched, fakultas: val, prodi: '' })}
                          options={fakultasOptions}
                          placeholder="-- Pilih Fakultas --"
                        />
                      </div>

                      {/* DROPDOWN PRODI (CASCADING 2 - HANYA PRODI FAKULTAS TERPILIH) */}
                      <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                        <label className="form-label">Program Studi</label>
                        <NeoSelect
                          value={initialSched.prodi}
                          onChange={(val) => {
                            const newRepeat = getRepeatClassCode(val)
                            setInitialSched(prev => ({
                              ...prev,
                              prodi: val,
                              kelas: isCustomClassInitial ? prev.kelas : (prev.kelas.endsWith('-U') ? newRepeat : prev.kelas)
                            }))
                          }}
                          options={prodiOptionsInitial}
                          placeholder={initialSched.fakultas ? '-- Pilih Prodi --' : '-- Pilih Fakultas Dulu --'}
                          disabled={!initialSched.fakultas}
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                        <label className="form-label">Semester</label>
                        <NeoSelect
                          value={initialSched.semester}
                          onChange={(val) => setInitialSched({ ...initialSched, semester: val })}
                          options={SEMESTER_OPTIONS}
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                        <label className="form-label">Kelas</label>
                        {isCustomClassInitial ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input
                              type="text"
                              className="input-field"
                              placeholder="Misal: TIF-U / SPB"
                              value={initialSched.kelas}
                              onChange={(e) => setInitialSched({ ...initialSched, kelas: e.target.value.toUpperCase() })}
                              style={{ flex: 1, minWidth: '0', textTransform: 'uppercase' }}
                              autoFocus
                            />
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setIsCustomClassInitial(false)
                                setInitialSched(prev => ({ ...prev, kelas: 'A' }))
                              }}
                              title="Kembali ke pilihan dropdown"
                              style={{ padding: '0 12px', minHeight: '48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <ArrowCounterclockwise size={16} />
                            </button>
                          </div>
                        ) : (
                          <NeoSelect
                            value={initialSched.kelas}
                            onChange={(val) => {
                              if (val === '__CUSTOM__') {
                                setIsCustomClassInitial(true)
                                setInitialSched(prev => ({ ...prev, kelas: '' }))
                              } else {
                                setInitialSched(prev => ({ ...prev, kelas: val }))
                              }
                            }}
                            options={getClassOptions(initialSched.prodi)}
                          />
                        )}
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Mata Kuliah</label>
                        <input type="text" className="input-field" value={initialSched.mata_kuliah} onChange={(e) => setInitialSched({ ...initialSched, mata_kuliah: e.target.value })} placeholder="Pemrograman Web" required={addWithSchedule} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Dosen Pengampu</label>
                        <input type="text" className="input-field" value={initialSched.dosen} onChange={(e) => setInitialSched({ ...initialSched, dosen: e.target.value })} placeholder="Dr. Ilham, M.Kom" required={addWithSchedule} />
                      </div>
                    </div>

                    {/* SKS SYSTEM & KALKULATOR JAM SELESAI OTOMATIS */}
                    <div className="form-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                        <label className="form-label">Hari</label>
                        <NeoSelect
                          value={initialSched.hari}
                          onChange={(val) => setInitialSched({ ...initialSched, hari: val })}
                          options={HARI_OPTIONS}
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                        <label className="form-label">Bobot SKS</label>
                        <NeoSelect
                          value={initialSched.sks}
                          onChange={(val) => handleInitialSchedTimeChange(initialSched.waktu_mulai, val)}
                          options={SKS_OPTIONS}
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                        <label className="form-label">Jam Mulai</label>
                        <NeoTimePicker
                          value={initialSched.waktu_mulai}
                          onChange={(val) => handleInitialSchedTimeChange(val, initialSched.sks)}
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                        <label className="form-label">Jam Selesai</label>
                        <NeoTimePicker
                          value={initialSched.waktu_selesai}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button className="btn btn-primary" disabled={actionLoading} type="submit">Simpan Ruangan Baru</button>
            </form>
          </div>

          {/* Pengelompokan Ruangan Berdasarkan Lantai */}
          {Object.keys(roomsByLantai).length === 0 ? (
            <div className="card-flat" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              Belum ada ruangan yang terdaftar di {selectedGedung}. Silakan tambah ruangan baru di atas.
            </div>
          ) : (
            Object.keys(roomsByLantai).sort((a, b) => Number(a) - Number(b)).map(lantaiNum => (
              <div key={lantaiNum} className="card-flat" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><LayersFill size={16} /> Ruangan Lantai {lantaiNum}</span>
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                      <th style={{ padding: '10px 12px' }}>Nama Ruang</th>
                      <th style={{ padding: '10px 12px' }}>Kapasitas</th>
                      <th style={{ padding: '10px 12px' }}>Status Saat Ini</th>
                      <th style={{ padding: '10px 12px' }}>Ubah Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Kelola Jadwal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomsByLantai[lantaiNum].map(room => (
                      <tr key={room.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#059669' }}>{room.nama}</td>
                        <td style={{ padding: '12px' }}>{room.kapasitas} kursi</td>
                        <td style={{ padding: '12px' }}>
                          {room.status === 'tersedia' && <span className="badge badge-success">Tersedia</span>}
                          {room.status === 'terkunci' && <span className="badge badge-error">Terkunci</span>}
                          {room.status === 'perbaikan' && <span className="badge badge-warning">Perbaikan</span>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <select
                            className="input-field"
                            style={{ padding: '4px 8px', height: 'auto', width: 'auto', display: 'inline-block' }}
                            value={room.status}
                            onChange={(e) => handleUppdateStatus(room.id, e.target.value)}
                            disabled={actionLoading}
                          >
                            <option value="tersedia">Tersedia</option>
                            <option value="terkunci">Terkunci</option>
                            <option value="perbaikan">Perbaikan</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenRoomSchedules(room)}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><CalendarEventFill size={13} /> Kelola Jadwal</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* MODAL KELOLA JADWAL SIAKAD (CASCADING FAKULTAS ➔ PRODI + SKS SYSTEM) */}
      {/* ========================================================= */}
      {selectedRoomModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card-flat" style={{ width: '100%', maxWidth: '720px', background: '#fff', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarEventFill size={18} /> Jadwal SIAKAD Ruang {selectedRoomModal.nama}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRoomModal(null)}>Tutup</button>
            </div>

            {!showFormSched && (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginBottom: '16px' }}
                onClick={() => {
                  setEditingSchedId(null)
                  setIsCustomClassSched(false)
                  const defaultStart = '07:30'
                  const defaultSks = '3'
                  setSchedForm({
                    fakultas: '',
                    prodi: '',
                    semester: '1',
                    kelas: 'A',
                    mata_kuliah: '',
                    dosen: '',
                    hari: 'Senin',
                    sks: defaultSks,
                    waktu_mulai: defaultStart,
                    waktu_selesai: calculateEndTime(defaultStart, defaultSks)
                  })
                  setShowFormSched(true)
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><PlusLg size={14} /> Tambah Jadwal Perkuliahan</span>
              </button>
            )}

            {/* FORM TAMBAH / EDIT JADWAL RUANGAN (CASCADING FAKULTAS ➔ PRODI + SKS SYSTEM) */}
            {showFormSched && (
              <form onSubmit={handleSaveSchedule} style={{ background: '#f8fafc', padding: '16px', marginBottom: '16px', border: '4px solid var(--room-border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                  {editingSchedId ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><PencilSquare size={14} /> Edit Jadwal</span>) : (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><PlusLg size={14} /> Tambah Jadwal Baru</span>)}
                </h3>

                <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {/* DROPDOWN FAKULTAS (CASCADING 1) */}
                  <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                    <label className="form-label">Fakultas</label>
                    <NeoSelect
                      value={schedForm.fakultas}
                      onChange={(val) => setSchedForm({ ...schedForm, fakultas: val, prodi: '' })}
                      options={fakultasOptions}
                      placeholder="-- Pilih Fakultas --"
                    />
                  </div>

                  {/* DROPDOWN PRODI (CASCADING 2 - HANYA PRODI FAKULTAS TERPILIH) */}
                  <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                    <label className="form-label">Program Studi</label>
                    <NeoSelect
                      value={schedForm.prodi}
                      onChange={(val) => {
                        const newRepeat = getRepeatClassCode(val)
                        setSchedForm(prev => ({
                          ...prev,
                          prodi: val,
                          kelas: isCustomClassSched ? prev.kelas : (prev.kelas.endsWith('-U') ? newRepeat : prev.kelas)
                        }))
                      }}
                      options={prodiOptionsSched}
                      placeholder={schedForm.fakultas ? '-- Pilih Prodi --' : '-- Pilih Fakultas Dulu --'}
                      disabled={!schedForm.fakultas}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                    <label className="form-label">Semester</label>
                    <NeoSelect
                      value={schedForm.semester}
                      onChange={(val) => setSchedForm({ ...schedForm, semester: val })}
                      options={SEMESTER_OPTIONS}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                    <label className="form-label">Kelas</label>
                    {isCustomClassSched ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Misal: TIF-U / SPB"
                          value={schedForm.kelas}
                          onChange={(e) => setSchedForm({ ...schedForm, kelas: e.target.value.toUpperCase() })}
                          style={{ flex: 1, minWidth: '0', textTransform: 'uppercase' }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setIsCustomClassSched(false)
                            setSchedForm(prev => ({ ...prev, kelas: 'A' }))
                          }}
                          title="Kembali ke pilihan dropdown"
                          style={{ padding: '0 12px', minHeight: '48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <ArrowCounterclockwise size={16} />
                        </button>
                      </div>
                    ) : (
                      <NeoSelect
                        value={schedForm.kelas}
                        onChange={(val) => {
                          if (val === '__CUSTOM__') {
                            setIsCustomClassSched(true)
                            setSchedForm(prev => ({ ...prev, kelas: '' }))
                          } else {
                            setSchedForm(prev => ({ ...prev, kelas: val }))
                          }
                        }}
                        options={getClassOptions(schedForm.prodi)}
                      />
                    )}
                  </div>
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Mata Kuliah</label>
                    <input type="text" className="input-field" value={schedForm.mata_kuliah} onChange={(e) => setSchedForm({ ...schedForm, mata_kuliah: e.target.value })} placeholder="Pemrograman Web" required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Dosen Pengampu</label>
                    <input type="text" className="input-field" value={schedForm.dosen} onChange={(e) => setSchedForm({ ...schedForm, dosen: e.target.value })} placeholder="Dr. Ilham, M.Kom" required />
                  </div>
                </div>

                {/* SKS SYSTEM & KALKULATOR JAM SELESAI OTOMATIS */}
                <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                    <label className="form-label">Hari</label>
                    <NeoSelect
                      value={schedForm.hari}
                      onChange={(val) => setSchedForm({ ...schedForm, hari: val })}
                      options={HARI_OPTIONS}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
                    <label className="form-label">Bobot SKS</label>
                    <NeoSelect
                      value={schedForm.sks}
                      onChange={(val) => handleSchedFormTimeChange(schedForm.waktu_mulai, val)}
                      options={SKS_OPTIONS}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                    <label className="form-label">Jam Mulai</label>
                    <NeoTimePicker
                      value={schedForm.waktu_mulai}
                      onChange={(val) => handleSchedFormTimeChange(val, schedForm.sks)}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1, minWidth: '130px' }}>
                    <label className="form-label">Jam Selesai</label>
                    <NeoTimePicker
                      value={schedForm.waktu_selesai}
                      readOnly
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setShowFormSched(false); setIsCustomClassSched(false); }}>Batal</button>
                  <button type="submit" className="btn btn-primary btn-sm">Simpan Jadwal</button>
                </div>
              </form>
            )}

            {/* TABEL DAFTAR JADWAL HARIAN RUANGAN */}
            {loadingSched ? (
              <p>Memuat jadwal...</p>
            ) : roomSchedules.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Ruangan ini belum memiliki jadwal perkuliahan reguler.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '8px 12px' }}>Hari & Waktu</th>
                    <th style={{ padding: '8px 12px' }}>Mata Kuliah & Dosen</th>
                    <th style={{ padding: '8px 12px' }}>Kelas</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {roomSchedules.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <b>{s.hari}</b><br />
                        <span className="text-muted" style={{ fontSize: '12px' }}>{s.waktu_mulai.substring(0, 5)} - {s.waktu_selesai.substring(0, 5)}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <b>{s.mata_kuliah}</b><br />
                        <span className="text-muted" style={{ fontSize: '12px' }}>{s.dosen}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {s.prodi} (Smstr {s.semester} - {s.kelas})
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" style={{ marginRight: '4px', display: 'inline-flex', alignItems: 'center', gap: '5px' }} onClick={() => handleEditScheduleClick(s)}><PencilSquare size={13} /> Edit</button>
                        <button className="btn btn-secondary btn-sm" style={{ color: 'red', display: 'inline-flex', alignItems: 'center', gap: '5px' }} onClick={() => handleDeleteSchedule(s.id, s.mata_kuliah)}><TrashFill size={13} /> Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS JADWAL */}
      <ConfirmModal
        isOpen={confirmDeleteSched.open}
        title="Hapus Jadwal Kuliah"
        message={`Apakah Anda yakin ingin menghapus jadwal perkuliahan "${confirmDeleteSched.matkul}"?`}
        confirmText="Ya, Hapus Jadwal"
        cancelText="Batal"
        variant="danger"
        loading={confirmDeleteSched.loading}
        onConfirm={handleConfirmDeleteSchedule}
        onCancel={() => !confirmDeleteSched.loading && setConfirmDeleteSched({ open: false, id: null, matkul: '', loading: false })}
      />
    </div>
  )
}

export default ManajemenRuangan
