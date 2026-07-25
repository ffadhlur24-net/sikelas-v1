import { useState, useEffect } from "react";
import api from '../../api/axios'

function ReservasiKelas() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [sks, setSks] = useState("2") // Default 2 sks
  const [roomSchedule, setRoomSchedule] = useState([]) // Menyimpan data jadwal dari backend
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  const [selectedKampus, setSelectedKampus] = useState('')
  const [selectedGedung, setSelectedGedung] = useState('')
  const [selectedLantai, setSelectedLantai] = useState('')

  const [formData, setFormData] = useState({
    room_id: '',
    mata_kuliah: '',
    tanggal: '',
    waktu_mulai: '',
    waktu_selesai: ''
  })

  // 1. Ambil daftar ruangan untuk opsi di dropdown
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await api.get('/rooms')
        // Hanya tampilkan ruangan yang bersetatus 'tersedia'
        const availableRooms = response.data.rooms.filter(r => r.status !== 'terkunci' && r.status !== 'perbaikan')
        setRooms(availableRooms)
      } catch (error) {
        console.error("Gagal mengambil data ruangan:", error)
      }
    }
    fetchRooms()
  }, [])
  // CASCADING DROPDOWNS (FILTER BERTAHAP)
  const kampusList = [...new Set(rooms.map(r => r.kampus))];
  const gedungList = [...new Set(rooms.filter(r => r.kampus === selectedKampus).map(r => r.gedung))];
  const lantaiList = [...new Set(rooms.filter(r => r.kampus === selectedKampus && r.gedung === selectedGedung).map(r => r.lantai))].sort();
  const finalRooms = rooms.filter(r => r.kampus === selectedKampus && r.gedung === selectedGedung && r.lantai === Number(selectedLantai));

  // FECTH TIMELINE JADWAL
  useEffect(() => {
    const fetchSchedule = async () => {
      if (formData.room_id && formData.tanggal) {
        setLoadingSchedule(true)
        try {
          const res = await api.get(`/rooms/${formData.room_id}/schedule?date=${formData.tanggal}`)
          setRoomSchedule(res.data.roomSchedule || [])
        } catch (error) {
          console.error("Gagal mengambil jadwal:", error)
        } finally {
          setLoadingSchedule(false)
        }
      } else {
        setRoomSchedule([]) // kosongkan jadwal jika ruangan/tanggal belum dipilih
      }
    }
    fetchSchedule()
  }, [formData.room_id, formData.tanggal]) // akan selalu update jadwal jika ruangan/tanggal berubah


  // AUTO-CALCULATE WAKTU SELESAI
  const calculateEndTime = (startTime, sksValue) => {
    if (!startTime || !sksValue) return ''
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (Number(sksValue) * 50);

    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }
  const handleTimeChange = (e) => {
    const { name, value } = e.target;

    if (name === 'sks') {
      setSks(value);
      setFormData(prev => ({ ...prev, waktu_selesai: calculateEndTime(prev.waktu_mulai, value) }));
    } else if (name === 'waktu_mulai') {
      setFormData(prev => ({ ...prev, waktu_mulai: value, waktu_selesai: calculateEndTime(value, sks) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // 2. Kirim data reservasi ke backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const response = await api.post('/reservations', formData)
      setMessage({ text: response.data.message, type: 'success' })

      // Kosongkan form setelah sukses
      setFormData({
        room_id: '',
        mata_kuliah: '',
        tanggal: '',
        waktu_mulai: '',
        waktu_selesai: ''
      })
    } catch (error) {
      if (error.response && error.response.data.error) {
        setMessage({ text: error.response.data.error, type: 'error' })
      } else {
        setMessage({ text: 'Terjadi Kesalahan koneksi server.', type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Reservasi Kelas (Smart Booking)</h1>
        <p className="page-subtitle">Ajukan peminjaman dengan perhitungan SKS otomatis dan pantauan jadwal Real-Time.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* KOLOM KIRI: FORM RESERVASI */}
        <div className="card-flat">
          {message.text && (
            <div style={{
              background: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
              color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
              padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500'
            }}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Mata Kuliah</label>
              <input type="text" className="input-field" name="mata_kuliah" value={formData.mata_kuliah} onChange={handleChange} placeholder="Contoh: Studi MBG" required />
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Kampus</label>
                <select className="input-field" value={selectedKampus} onChange={(e) => {
                  setSelectedKampus(e.target.value); setSelectedGedung(''); setSelectedLantai(''); setFormData({ ...formData, room_id: '' })
                }} required>
                  <option value="">-- Pilih Kampus --</option>
                  {kampusList.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Gedung</label>
                <select className="input-field" value={selectedGedung} onChange={(e) => {
                  setSelectedGedung(e.target.value); setSelectedLantai(''); setFormData({ ...formData, room_id: '' })
                }} disabled={!selectedKampus} required>
                  <option value="">-- Pilih Gedung --</option>
                  {gedungList.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Lantai</label>
                <select className="input-field" value={selectedLantai} onChange={(e) => {
                  setSelectedLantai(e.target.value); setFormData({ ...formData, room_id: '' })
                }} disabled={!selectedGedung} required>
                  <option value="">-- Pilih Lantai --</option>
                  {lantaiList.map(l => <option key={l} value={l}>Lantai {l}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Ruangan Akhir</label>
                <select name="room_id" className="input-field" value={formData.room_id} onChange={handleChange} disabled={!selectedLantai} required>
                  <option value="">-- Pilih Ruangan --</option>
                  {finalRooms.map(room => (
                    <option value={room.id} key={room.id}>
                      {room.nama} ({room.kapasitas} Kursi) {room.status !== 'tersedia' ? `[⚠️ ${room.status}]` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input type="date" className="input-field" name='tanggal' value={formData.tanggal} onChange={handleChange} required />
            </div>
            <div className="form-row" style={{ display: 'flex', gap: '20px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Jumlah SKS</label>
                <select name="sks" value={sks} onChange={handleTimeChange} className="input-field" required>
                  <option value="1">1 SKS (50 Menit)</option>
                  <option value="2">2 SKS (100 Menit)</option>
                  <option value="3">3 SKS (150 Menit)</option>
                  <option value="4">4 SKS (200 Menit)</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Waktu Mulai</label>
                <input type="time" className="input-field" name="waktu_mulai" value={formData.waktu_mulai} onChange={handleTimeChange} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Waktu Selesai (Otomatis)</label>
              <input type="time" className="input-field" name="waktu_selesai" value={formData.waktu_selesai} style={{ background: '#f1f5f9', cursor: 'not-allowed' }} readOnly />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
              {loading ? 'Mengajukan...' : 'Ajukan Reservasi'}
            </button>
          </form>
        </div>
        {/* KOLOM KANAN: TIMELINE JADWAL RUANGAN (Ide Cerdas Anda!) */}
        <div className="card-flat" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>📅 Jadwal Ruangan Ini</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            Pilih <b>Ruangan</b> dan <b>Tanggal</b> di form untuk melihat jadwal pemakaian.
          </p>

          <hr style={{ border: 'none', borderBottom: '1px solid #cbd5e1', marginBottom: '16px' }} />
          {loadingSchedule ? (
            <p style={{ fontSize: '14px', color: '#64748b', textAlign: 'center' }}>Memuat jadwal...</p>
          ) : (!formData.room_id || !formData.tanggal) ? (
            <div style={{ textAlign: 'center', padding: '20px', background: '#f1f5f9', borderRadius: '8px' }}>
              <span style={{ fontSize: '24px' }}>🔍</span>
              <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>Menunggu input Ruangan & Tanggal</p>
            </div>
          ) : roomSchedule.length === 0 ? (
            <div style={{ padding: '16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
              ✨ Yey! Ruangan ini kosong seharian penuh!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roomSchedule.map((jadwal, index) => (
                <div key={index} style={{
                  display: 'flex', flexDirection: 'column', gap: '4px',
                  padding: '12px', borderRadius: '8px',
                  background: jadwal.type === 'Reguler' ? '#fee2e2' : '#fef3c7',
                  borderLeft: `4px solid ${jadwal.type === 'Reguler' ? '#ef4444' : '#f59e0b'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{jadwal.mata_kuliah}</span>
                    <span style={{ fontSize: '12px', padding: '2px 6px', background: 'rgba(0,0,0,0.1)', borderRadius: '4px' }}>{jadwal.type}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                    ⏰ {jadwal.waktu_mulai.substring(0, 5)} - {jadwal.waktu_selesai.substring(0, 5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export default ReservasiKelas