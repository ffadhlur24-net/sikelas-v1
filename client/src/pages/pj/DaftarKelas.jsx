import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import api from '../../api/axios'
import { supabaseClient } from '../../config/supabase'

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
  const todayDefaultStr = new Date().toISOString().split('T')[0]
  const [filterTanggal, setFilterTanggal] = useState(todayDefaultStr)
  const [filterWaktuMulai, setFilterWaktuMulai] = useState('08:00')
  const [filterSks, setFilterSks] = useState('2')

  // STATE CASCADING LOCATION FILTER (Database Driven)
  const [filterKampus, setFilterKampus] = useState('')
  const [filterGedung, setFilterGedung] = useState('')
  const [filterLantai, setFilterLantai] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  // 1. Opsi Kampus Dinamis dari Database
  const kampusOptions = [...new Set((rooms || []).map(r => r.kampus).filter(Boolean))].sort()

  // 2. Opsi Gedung Cascading berdasar Kampus terpilih
  const availableGedungRooms = filterKampus ? rooms.filter(r => r.kampus === filterKampus) : rooms
  const gedungOptions = [...new Set(availableGedungRooms.map(r => r.gedung).filter(Boolean))].sort()

  // 3. Opsi Lantai Cascading berdasar Kampus & Gedung terpilih
  const availableLantaiRooms = availableGedungRooms.filter(r => !filterGedung || r.gedung === filterGedung)
  const lantaiOptions = [...new Set(availableLantaiRooms.map(r => r.lantai).filter(l => l !== null && l !== undefined))].sort((a, b) => a - b)

  const handleKampusChange = (e) => {
    setFilterKampus(e.target.value)
    setFilterGedung('')
    setFilterLantai('')
  }

  const handleGedungChange = (e) => {
    setFilterGedung(e.target.value)
    setFilterLantai('')
  }

  const resetLocationFilter = () => {
    setFilterKampus('')
    setFilterGedung('')
    setFilterLantai('')
    setSearchKeyword('')
  }

  const [bookingForm, setBookingForm] = useState({
    mata_kuliah: '',
    tanggal: todayDefaultStr,
    waktu_mulai: '08:00',
    waktu_selesai: '09:40'
  })
  // Fungsi mengambil data ruangan dari backend berdasarkan slot waktu target
  const fetchRooms = async (tgl = filterTanggal, wkt = filterWaktuMulai, sksVal = filterSks, showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true)
      const res = await api.get('/rooms', {
        params: {
          tanggal: tgl,
          waktu_mulai: wkt,
          sks: sksVal
        }
      })
      setRooms(res.data.rooms || [])
    } catch (err) {
      console.error('Gagal memuat ruangan:', err)
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  // JAM DIGITAL & SUPABASE REALTIME WEBSOCKET LISTENER (Pendekatan 1)
  useEffect(() => {
    fetchRooms(filterTanggal, filterWaktuMulai, filterSks, true)
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // ⚡ Menghubungkan WebSocket Listener Supabase Realtime
    const channel = supabaseClient
      .channel('realtime-sikelas-rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        console.log('⚡ [Realtime] Terdeteksi perubahan reservasi di Supabase. Memperbarui status ruangan...')
        fetchRooms(filterTanggal, filterWaktuMulai, filterSks, false)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        console.log('⚡ [Realtime] Terdeteksi perubahan laporan di Supabase. Memperbarui status ruangan...')
        fetchRooms(filterTanggal, filterWaktuMulai, filterSks, false)
      })
      .subscribe()

    return () => {
      clearInterval(clockTimer)
      supabaseClient.removeChannel(channel)
    }
  }, [filterTanggal, filterWaktuMulai, filterSks])
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
    setSks(filterSks)
    const initialStart = filterWaktuMulai
    const targetDate = filterTanggal
    const calculatedEnd = calculateEndTime(initialStart, filterSks)
    setBookingForm({
      mata_kuliah: user?.mata_kuliah || '',
      tanggal: targetDate,
      waktu_mulai: initialStart,
      waktu_selesai: calculatedEnd
    })
    fetchSchedulesForDate(room.id, targetDate, initialStart, calculatedEnd)
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
  const filteredRooms = (rooms || []).filter(room => {
    // 1. Filter Status Tab (Semua / Tersedia / Terpakai)
    if (activeFilter === 'tersedia' && !room.slot_available) return false
    if (activeFilter === 'terpakai' && room.slot_available) return false

    // 2. Filter Lokasi Berjenjang (Kampus -> Gedung -> Lantai)
    if (filterKampus && room.kampus !== filterKampus) return false
    if (filterGedung && room.gedung !== filterGedung) return false
    if (filterLantai && String(room.lantai) !== String(filterLantai)) return false

    // 3. Search Keyword (Nama Ruangan / Gedung)
    if (searchKeyword.trim() !== '') {
      const kw = searchKeyword.trim().toLowerCase()
      const namaMatch = (room.nama || '').toLowerCase().includes(kw)
      const gedungMatch = (room.gedung || '').toLowerCase().includes(kw)
      if (!namaMatch && !gedungMatch) return false
    }

    return true
  })

  return (
    <div className="animate-fade-in">
      {/* HEADER + JAM DIGITAL */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Daftar Kelas & Ketersediaan Ruangan</h1>
          <p className="page-subtitle">Cari slot waktu peminjaman spesifik dan pantau ketersediaan ruangan secara real-time.</p>
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

      {/* PANEL FILTER LOKASI BERJENJANG (CASCADING DYNAMIC LOCATION FILTER) */}
      <div className="card-flat" style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '16px 20px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏢 Filter Lokasi Ruangan (Kampus ➔ Gedung ➔ Lantai)
          </h3>
          {(filterKampus || filterGedung || filterLantai || searchKeyword) && (
            <button
              type="button"
              onClick={resetLocationFilter}
              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', fontSize: '12px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
            >
              🔄 Reset Filter Lokasi
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {/* Dropdown 1: Kampus */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>1. Kampus</label>
            <select className="input-field" value={filterKampus} onChange={handleKampusChange} style={{ background: '#f8fafc' }}>
              <option value="">-- Semua Kampus ({kampusOptions.length}) --</option>
              {kampusOptions.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Dropdown 2: Gedung (Cascading) */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>2. Gedung</label>
            <select className="input-field" value={filterGedung} onChange={handleGedungChange} style={{ background: '#f8fafc' }}>
              <option value="">-- Semua Gedung ({gedungOptions.length}) --</option>
              {gedungOptions.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Dropdown 3: Lantai (Cascading) */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>3. Lantai</label>
            <select className="input-field" value={filterLantai} onChange={(e) => setFilterLantai(e.target.value)} style={{ background: '#f8fafc' }}>
              <option value="">-- Semua Lantai ({lantaiOptions.length}) --</option>
              {lantaiOptions.map(l => (
                <option key={l} value={l}>Lantai {l}</option>
              ))}
            </select>
          </div>

          {/* Input 4: Live Search Nama Ruangan */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>🔍 Cari Nama Ruangan</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ketik nama (mis: 201 / FST)..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ background: '#f8fafc' }}
            />
          </div>
        </div>
      </div>

      {/* PANEL FILTER SLOT WAKTU (TIME-SLOT DRIVEN AVAILABILITY) */}
      <div className="card-flat" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⏰ Slot Waktu Peminjaman Target
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>📅 Tanggal Peminjaman</label>
            <input
              type="date"
              className="input-field"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              style={{ background: '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>⏰ Jam Mulai Peminjaman</label>
            <input
              type="time"
              className="input-field"
              value={filterWaktuMulai}
              onChange={(e) => setFilterWaktuMulai(e.target.value)}
              style={{ background: '#fff' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>⏱️ Jumlah SKS (1 SKS = 50 Mnt)</label>
            <select
              className="input-field"
              value={filterSks}
              onChange={(e) => setFilterSks(e.target.value)}
              style={{ background: '#fff' }}
            >
              <option value="1">1 SKS (50 Menit)</option>
              <option value="2">2 SKS (100 Menit / 1 Jam 40 Mnt)</option>
              <option value="3">3 SKS (150 Menit / 2 Jam 30 Mnt)</option>
              <option value="4">4 SKS (200 Menit / 3 Jam 20 Mnt)</option>
            </select>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => fetchRooms(filterTanggal, filterWaktuMulai, filterSks)}
            style={{ height: '42px', width: '100%', background: '#2563eb' }}
          >
            🔎 Cari Slot Ketersediaan
          </button>
        </div>
      </div>

      {/* FILTER TABS STATUS RUANG & STATISTIK FINISHED */}
      <div className="tabs-container" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`tab-btn ${activeFilter === 'semua' ? 'active' : ''}`} onClick={() => setActiveFilter('semua')}>Semua ({filteredRooms.length})</button>
          <button className={`tab-btn ${activeFilter === 'tersedia' ? 'active' : ''}`} onClick={() => setActiveFilter('tersedia')}>Tersedia Slot Ini ({filteredRooms.filter(r => r.slot_available).length})</button>
          <button className={`tab-btn ${activeFilter === 'terpakai' ? 'active' : ''}`} onClick={() => setActiveFilter('terpakai')}>Terpakai/Terkunci ({filteredRooms.filter(r => !r.slot_available).length})</button>
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
          Menampilkan <b>{filteredRooms.length}</b> dari <b>{rooms.length}</b> total ruangan
        </div>
      </div>

      {/* DAFTAR KARTU RUANGAN */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Memuat ketersediaan ruangan...</div>
      ) : filteredRooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Tidak ada ruangan untuk kriteria filter ini.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredRooms.map(room => (
            <div key={room.id} className="card-flat" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: room.slot_available ? '1px solid #86efac' : '1px solid #fca5a5' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Ruang {room.nama}</h3>
                  {room.slot_available ? (
                    <span className="badge badge-success" style={{ background: '#059669', color: 'white' }}>🟢 Tersedia Slot Ini</span>
                  ) : (
                    <span className="badge badge-error" style={{ background: '#dc2626', color: 'white' }}>🔴 Terpakai / Bentrok</span>
                  )}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '4px' }}>
                  📍 {room.kampus} - {room.gedung} (Lantai {room.lantai})
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '12px' }}>
                  🪑 Kapasitas: <b>{room.kapasitas} Kursi</b>
                </p>

                {room.conflict_reason && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', marginBottom: '12px', lineHeight: '1.4' }}>
                    ⚠️ {room.conflict_reason}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleOpenTimeline(room)}>
                  📅 Lihat Jadwal
                </button>
                {room.slot_available ? (
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, background: '#2563eb' }} onClick={() => handleOpenBookingModal(room)}>
                    📌 Pesan Ruang
                  </button>
                ) : (
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, cursor: 'not-allowed', opacity: 0.6 }} disabled title={room.conflict_reason}>
                    Terpakai di Slot Ini
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