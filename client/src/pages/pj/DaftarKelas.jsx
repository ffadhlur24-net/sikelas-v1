import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import api from '../../api/axios'
function DaftarKelas() {
  const { user } = useContext(AuthContext)
  const [activeFilter, setActiveFilter] = useState('semua')
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  // State Modal Timeline Harian Berbasis Hari (Poin 4 - Upgraded)
  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  const todayIndex = new Date().getDay()
  const todayHariName = todayIndex === 0 ? 'Minggu' : hariList[todayIndex - 1]
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [selectedHari, setSelectedHari] = useState(todayHariName)
  const [schedules, setSchedules] = useState([])
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  // State Instant Modal Reservasi Instan (Poin 5 - Opsi 2 + Live Anti-Bentrok)
  const [bookingRoom, setBookingRoom] = useState(null)
  const [sks, setSks] = useState("2")
  const [actionLoading, setActionLoading] = useState(false)
  const [bookingMessage, setBookingMessage] = useState({ text: '', type: '' })
  const [conflictError, setConflictError] = useState('')
  const [daySchedulesForBooking, setDaySchedulesForBooking] = useState([])
  const [loadingDaySchedules, setLoadingDaySchedules] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    mata_kuliah: '',
    tanggal: new Date().toISOString().split('T')[0],
    waktu_mulai: '08:00',
    waktu_selesai: '09:40'
  })
  // Fungsi mengambil data ruangan dari backend
  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await api.get('/rooms')
      setRooms(res.data.rooms || [])
    } catch (err) {
      console.error('Gagal memuat ruangan:', err)
    } finally {
      setLoading(false)
    }
  }
  // AUTO-REFRESH & JAM DIGITAL
  useEffect(() => {
    fetchRooms()
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    const refreshTimer = setInterval(() => {
      fetchRooms()
    }, 60000)
    return () => {
      clearInterval(clockTimer)
      clearInterval(refreshTimer)
    }
  }, [])
  // Buka Modal Timeline berdasarkan Hari
  const handleOpenTimeline = async (room, hari = selectedHari) => {
    setSelectedRoom(room)
    setSelectedHari(hari)
    fetchDayTimeline(room.id, hari)
  }
  const fetchDayTimeline = async (roomId, hari) => {
    try {
      setLoadingTimeline(true)
      const dummyDate = getSampleDateForHari(hari)
      const res = await api.get(`/rooms/${roomId}/schedule?date=${dummyDate}`)

      // Filter: Reservasi yang sudah lewat dari tanggal hari ini TIDAK DITAMPILKAN lagi
      const currentDateStr = new Date().toISOString().split('T')[0]
      const cleanSchedule = (res.data.schedule || []).filter(item => {
        if (item.type === 'Dipesan' && item.tanggal && item.tanggal < currentDateStr) {
          return false
        }
        return true
      })
      setSchedules(cleanSchedule)
    } catch (error) {
      console.error('Gagal memuat timeline hari:', error)
    } finally {
      setLoadingTimeline(false)
    }
  }
  // Helper mendapatkan tanggal terdekat untuk nama hari
  const getSampleDateForHari = (targetHari) => {
    const hariIdxMap = { 'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 }
    const now = new Date()
    const currentIdx = now.getDay()
    const targetIdx = hariIdxMap[targetHari]
    let diff = targetIdx - currentIdx
    if (diff < 0) diff += 7
    const resultDate = new Date(now.setDate(now.getDate() + diff))
    return resultDate.toISOString().split('T')[0]
  }
  // Kalkulator SKS Otomatis (50 Menit per SKS)
  const calculateEndTime = (startTime, sksValue) => {
    if (!startTime || !sksValue) return ''
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + Number(sksValue) * 50
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }
  // Overlap Checker Real-Time
  const validateOverlap = (start, end, scheduleList, dateVal = bookingForm.tanggal) => {
    if (!start || !end) {
      setConflictError('')
      return
    }
    // 1. Cek Apakah Waktu Sudah Berlalu Hari Ini
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const [sHours, sMins] = start.split(':').map(Number)
    const inputMinutes = sHours * 60 + sMins
    if (dateVal === todayStr && inputMinutes <= currentMinutes) {
      setConflictError(`🚨 Jam [${start}] sudah berlalu hari ini! Silakan pilih jam di masa mendatang.`)
      return
    }
    // 2. Cek Overlap Bentrok dengan Jadwal Lain
    if (scheduleList && scheduleList.length > 0) {
      const conflictItem = scheduleList.find(item => {
        const sStart = item.waktu_mulai.substring(0, 5)
        const sEnd = item.waktu_selesai.substring(0, 5)
        return sStart < end && sEnd > start
      })
      if (conflictItem) {
        setConflictError(`🚨 Waktu [${start} - ${end}] BENTROK dengan ${conflictItem.type} (${conflictItem.mata_kuliah}: ${conflictItem.waktu_mulai.substring(0, 5)} - ${conflictItem.waktu_selesai.substring(0, 5)} WIB)!`)
        return
      }
    }
    setConflictError('')
  }
  // Buka Modal Reservasi Instan
  const handleOpenBookingModal = (room) => {
    setBookingRoom(room)
    setBookingMessage({ text: '', type: '' })
    setConflictError('')
    const initialStart = '07:00'
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const todayStr = `${yyyy}-${mm}-${dd}`
    const calculatedEnd = calculateEndTime(initialStart, sks)
    setBookingForm({
      mata_kuliah: user?.mata_kuliah || '',
      tanggal: todayStr,
      waktu_mulai: initialStart,
      waktu_selesai: calculatedEnd
    })
    fetchSchedulesForDate(room.id, todayStr, initialStart, calculatedEnd)
  }
  const fetchSchedulesForDate = async (roomId, dateStr, startVal, endVal) => {
    try {
      setLoadingDaySchedules(true)
      const res = await api.get(`/rooms/${roomId}/schedule?date=${dateStr}`)
      const fetchedSchedules = res.data.schedule || []
      setDaySchedulesForBooking(fetchedSchedules)
      validateOverlap(startVal, endVal, fetchedSchedules, dateStr)
    } catch (err) {
      console.error('Gagal memuat jadwal tanggal terpilih:', err)
    } finally {
      setLoadingDaySchedules(false)
    }
  }
  const handleBookingFormChange = (e) => {
    const { name, value } = e.target
    let newForm = { ...bookingForm }
    let newSks = sks
    if (name === 'sks') {
      newSks = value
      setSks(value)
      newForm.waktu_selesai = calculateEndTime(newForm.waktu_mulai, value)
    } else if (name === 'waktu_mulai') {
      newForm.waktu_mulai = value
      newForm.waktu_selesai = calculateEndTime(value, sks)
    } else {
      newForm[name] = value
    }
    setBookingForm(newForm)
    if (name === 'tanggal' && bookingRoom) {
      fetchSchedulesForDate(bookingRoom.id, value, newForm.waktu_mulai, newForm.waktu_selesai)
    } else {
      validateOverlap(newForm.waktu_mulai, newForm.waktu_selesai, daySchedulesForBooking, newForm.tanggal)
    }
  }
  // Kirim Reservasi Instan
  const handleSubmitBooking = async (e) => {
    e.preventDefault()
    if (!bookingRoom || conflictError) return
    setActionLoading(true)
    setBookingMessage({ text: '', type: '' })
    try {
      const payload = {
        room_id: bookingRoom.id,
        mata_kuliah: bookingForm.mata_kuliah,
        tanggal: bookingForm.tanggal,
        waktu_mulai: bookingForm.waktu_mulai,
        waktu_selesai: bookingForm.waktu_selesai
      }
      const res = await api.post('/reservations', payload)
      setBookingMessage({ text: res.data.message || 'Reservasi berhasil diajukan!', type: 'success' })
      setTimeout(() => {
        setBookingRoom(null)
        fetchRooms()
      }, 1500)
    } catch (err) {
      setBookingMessage({
        text: err.response?.data?.error || 'Gagal mengajukan reservasi.',
        type: 'error'
      })
    } finally {
      setActionLoading(false)
    }
  }
  const filteredRooms = activeFilter === 'semua' ? rooms
    : rooms.filter(r => r.status === activeFilter)
  return (
    <div className="animate-fade-in">
      {/* HEADER + JAM DIGITAL */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Daftar Kelas & Ketersediaan Ruangan</h1>
          <p className="page-subtitle">Pantau status ruangan fisik secara real-time dan lihat jadwal pemakaian harian.</p>
        </div>
        <div style={{ textAlign: 'right', background: '#f8fafc', padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '2px' }}>
            WAKTU SERVER REAL-TIME
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'monospace', color: '#0f172a' }}>
            {currentTime.toLocaleTimeString('id-ID')}
          </div>
        </div>
      </div>
      {/* FILTER TABS STATUS RUANG */}
      <div className="tabs-container" style={{ marginBottom: '20px' }}>
        <button className={`tab-btn ${activeFilter === 'semua' ? 'active' : ''}`} onClick={() => setActiveFilter('semua')}>Semua ({rooms.length})</button>
        <button className={`tab-btn ${activeFilter === 'tersedia' ? 'active' : ''}`} onClick={() => setActiveFilter('tersedia')}>Tersedia ({rooms.filter(r => r.status === 'tersedia').length})</button>
        <button className={`tab-btn ${activeFilter === 'sedang_digunakan' ? 'active' : ''}`} onClick={() => setActiveFilter('sedang_digunakan')}>Sedang Kuliah ({rooms.filter(r => r.status === 'sedang_digunakan').length})</button>
        <button className={`tab-btn ${activeFilter === 'dipesan' ? 'active' : ''}`} onClick={() => setActiveFilter('dipesan')}>Dipesan ({rooms.filter(r => r.status === 'dipesan').length})</button>
        <button className={`tab-btn ${activeFilter === 'terkunci' ? 'active' : ''}`} onClick={() => setActiveFilter('terkunci')}>Terkunci ({rooms.filter(r => r.status === 'terkunci').length})</button>
      </div>
      {/* DAFTAR KARTU RUANGAN */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat ketersediaan ruangan...</div>
      ) : filteredRooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Tidak ada ruangan dengan status "{activeFilter}".
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredRooms.map(room => (
            <div key={room.id} className="card-flat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Ruang {room.nama}</h3>
                  {room.status === 'tersedia' && <span className="badge badge-success">Tersedia (Kosong)</span>}
                  {room.status === 'sedang_digunakan' && <span className="badge badge-error">Sedang Kuliah</span>}
                  {room.status === 'dipesan' && <span className="badge badge-warning">Dipesan Insidental</span>}
                  {room.status === 'terkunci' && <span className="badge badge-error">Terkunci Admin</span>}
                  {room.status === 'perbaikan' && <span className="badge badge-warning">Perbaikan</span>}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
                  📍 {room.kampus} - {room.gedung} (Lantai {room.lantai})
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                  🪑 Kapasitas: <b>{room.kapasitas} Kursi</b>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleOpenTimeline(room)}>
                  📅 Lihat Jadwal
                </button>
                {room.status === 'tersedia' ? (
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleOpenBookingModal(room)}>
                    📌 Pesan Ruang
                  </button>
                ) : (
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled>
                    Tidak Tersedia
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* POP-UP MODAL TIMELINE HARIAN BERBASIS NAMA HARI (POIN 4 - UPGRADED) */}
      {selectedRoom && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card-flat" style={{ width: '100%', maxWidth: '640px', background: '#fff', padding: '24px', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>📅 Jadwal Mingguan Ruang {selectedRoom.nama}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRoom(null)}>Tutup</button>
            </div>
            {/* TAB FILTER NAMA HARI */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
              {hariList.map(hari => (
                <button
                  key={hari}
                  className={`btn btn-sm ${selectedHari === hari ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '13px' }}
                  onClick={() => handleOpenTimeline(selectedRoom, hari)}
                >
                  {hari} {hari === todayHariName && ' (Hari Ini)'}
                </button>
              ))}
            </div>
            {loadingTimeline ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>Memuat jadwal hari {selectedHari}...</p>
            ) : schedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>🎉 Ruangan Kosong Seharian pada Hari {selectedHari}!</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Tidak ada perkuliahan reguler maupun reservasi aktif pada hari {selectedHari}.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {schedules.map((item, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px', borderRadius: '8px', borderLeft: '4px solid',
                    borderColor: item.type === 'Reguler' ? '#3b82f6' : '#f59e0b',
                    background: item.type === 'Reguler' ? '#eff6ff' : '#fffbeb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                      <span>{item.mata_kuliah}</span>
                      <span className="badge" style={{ background: item.type === 'Reguler' ? '#dbeafe' : '#fef3c7', color: item.type === 'Reguler' ? '#1e40af' : '#92400e' }}>
                        {item.type} {item.tanggal ? `(${item.tanggal})` : ''}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                      ⏰ Jam: <b>{item.waktu_mulai.substring(0, 5)} - {item.waktu_selesai.substring(0, 5)} WIB</b>
                    </p>
                  </div>
                ))}
              </div>
            )}
            {selectedRoom.status === 'tersedia' && (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => { setSelectedRoom(null); handleOpenBookingModal(selectedRoom); }}>
                📌 Lanjutkan Pesan Ruang {selectedRoom.nama}
              </button>
            )}
          </div>
        </div>
      )}
      {/* INSTANT POP-UP MODAL RESERVASI + LIVE ANTI-BENTROK INDICATOR */}
      {bookingRoom && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }}>
          <div className="card-flat" style={{ width: '100%', maxWidth: '580px', background: '#fff', padding: '24px', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>📌 Formulir Reservasi Instan</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setBookingRoom(null)}>Batal</button>
            </div>
            {bookingMessage.text && (
              <div style={{
                background: bookingMessage.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
                color: bookingMessage.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                padding: '12px', borderRadius: '8px', marginBottom: '16px', fontWeight: '500'
              }}>
                {bookingMessage.text}
              </div>
            )}
            <form onSubmit={handleSubmitBooking}>
              {/* Lokasi Ruangan (Readonly) */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>RUANGAN TERPILIH (AUTO-FILLED):</p>
                <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                  Ruang {bookingRoom.nama} ({bookingRoom.gedung} - Lantai {bookingRoom.lantai}, {bookingRoom.kampus})
                </p>
              </div>
              {/* Mata Kuliah (Auto-Filled) */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Mata Kuliah</label>
                <input
                  type="text"
                  className="input-field"
                  name="mata_kuliah"
                  value={bookingForm.mata_kuliah}
                  onChange={handleBookingFormChange}
                  placeholder="Contoh: Kecerdasan Buatan"
                  required
                />
              </div>
              {/* Tanggal Pemakaian */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Tanggal Pemakaian</label>
                <input
                  type="date"
                  className="input-field"
                  name="tanggal"
                  value={bookingForm.tanggal}
                  onChange={handleBookingFormChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              {/* Jam Mulai & Jumlah SKS (1 - 6 SKS) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Jam Mulai</label>
                  <input
                    type="time"
                    className="input-field"
                    name="waktu_mulai"
                    value={bookingForm.waktu_mulai}
                    onChange={handleBookingFormChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Jumlah SKS (1–6 SKS)</label>
                  <select
                    name="sks"
                    value={sks}
                    onChange={handleBookingFormChange}
                    className="input-field"
                    required
                  >
                    <option value="1">1 SKS (50 Menit)</option>
                    <option value="2">2 SKS (100 Menit)</option>
                    <option value="3">3 SKS (150 Menit)</option>
                    <option value="4">4 SKS (200 Menit)</option>
                    <option value="5">5 SKS (250 Menit)</option>
                    <option value="6">6 SKS (300 Menit)</option>
                  </select>
                </div>
              </div>
              {/* LIVE ANTI-BENTROK REAL-TIME INDICATOR */}
              <div style={{ marginBottom: '20px' }}>
                {conflictError ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>
                    {conflictError}
                  </div>
                ) : (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
                    ✅ Jam Selesai Otomatis: <b>{bookingForm.waktu_mulai} - {bookingForm.waktu_selesai} WIB</b> (TERSEDIA & AMAN)
                  </div>
                )}
              </div>
              {/* PREVIEW JADWAL REAL-TIME DI TANGGAL TERPILIH */}
              <div style={{ marginBottom: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
                  📋 Agenda Ruangan pada Tanggal {bookingForm.tanggal}:
                </p>
                {loadingDaySchedules ? (
                  <p style={{ fontSize: '12px', color: '#64748b' }}>Memeriksa ketersediaan jadwal...</p>
                ) : daySchedulesForBooking.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>🎉 Ruangan Kosong Seharian pada Tanggal Ini!</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {daySchedulesForBooking.map((sch, i) => (
                      <div key={i} style={{ fontSize: '12px', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid #3b82f6', display: 'flex', justifyContent: 'space-between' }}>
                        <span><b>{sch.mata_kuliah}</b> ({sch.type})</span>
                        <span>⏰ {sch.waktu_mulai.substring(0, 5)} - {sch.waktu_selesai.substring(0, 5)} WIB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setBookingRoom(null)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading || !!conflictError}>
                  {actionLoading ? 'Mengirim...' : '📌 Ajukan Reservasi Instan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default DaftarKelas