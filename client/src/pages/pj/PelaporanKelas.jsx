import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '../../context/AuthContext'
import api from '../../api/axios'
function PelaporanKelas() {
  const { user } = useContext(AuthContext)
  const [userSchedules, setUserSchedules] = useState([])
  const [existingReports, setExistingReports] = useState([])
  const [customAlasan, setCustomAlasan] = useState('')
  const [selectedSessionIndex, setSelectedSessionIndex] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSchedules, setLoadingSchedules] = useState(true)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [formData, setFormData] = useState({
    room_id: '',
    mata_kuliah: user?.mata_kuliah || '',
    alasan: '',
    tanggal: ''
  })

  const formatTanggalIndonesia = (dateString) => {
    if (!dateString) return '-'

    // Ambil YYYY-MM-DD saja
    const cleanDate = dateString.split('T')[0]
    const parts = cleanDate.split('-')

    if (parts.length === 3) {
      const year = parts[0]
      const monthIdx = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)

      const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

      const dateObj = new Date(year, monthIdx, day)
      const hari = namaHari[dateObj.getDay()]
      const bulan = namaBulan[monthIdx]

      return `${hari}, ${day} ${bulan} ${year}`
    }

    return dateString
  }
  const fetchPJData = async () => {
    if (!user?.mata_kuliah) return
    try {
      setLoadingSchedules(true)

      const schedRes = await api.get('/schedules')
      const allSchedules = schedRes.data.schedules || []
      const mySchedules = allSchedules.filter(s =>
        s.mata_kuliah === user.mata_kuliah &&
        (!user.kelas || s.kelas === user.kelas)
      )
      setUserSchedules(mySchedules)

      const repRes = await api.get('/reports')
      setExistingReports(repRes.data.reports || [])

      if (mySchedules.length === 1) {
        applySessionData(0, mySchedules)
      }
    } catch (error) {
      console.error("Failed to fetch PJ data", error)
    } finally {
      setLoadingSchedules(false)
    }
  }
  useEffect(() => {
    fetchPJData()
  }, [user])


  // Helper kalkulasi tanggal pertemuan mendatang terdekat berdasarkan nama hari
  const getNextDateForHari = (targetHari) => {
    const hariIdxMap = { 'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6 }
    const now = new Date()
    const currentIdx = now.getDay()
    const targetIdx = hariIdxMap[targetHari]
    let diff = targetIdx - currentIdx
    if (diff <= 0) diff += 7 // Ambil pertemuan mendatang (bukan yang lalu)

    const resultDate = new Date(now.setDate(now.getDate() + diff))
    const yyyy = resultDate.getFullYear()
    const mm = String(resultDate.getMonth() + 1).padStart(2, '0')
    const dd = String(resultDate.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  const applySessionData = (idx, list = userSchedules) => {
    const session = list[idx]
    if (!session) return
    setSelectedSessionIndex(idx)
    const nextDate = getNextDateForHari(session.hari)
    setFormData(prev => ({
      ...prev,
      room_id: session.room_id,
      mata_kuliah: session.mata_kuliah,
      tanggal: nextDate
    }))
  }
  const handleSessionChange = (e) => {
    const idx = e.target.value
    if (idx === '') {
      setSelectedSessionIndex('')
      setFormData(prev => ({ ...prev, room_id: '', tanggal: '' }))
    } else {
      applySessionData(Number(idx))
    }
  }
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
  // Cek sesi pelaporan
  const activeSession = selectedSessionIndex !== '' ? userSchedules[selectedSessionIndex] : null
  const isAlreadyReported = activeSession && existingReports.some(rep =>
    Number(rep.room_id) === Number(activeSession.room_id) &&
    rep.mata_kuliah === activeSession.mata_kuliah &&
    rep.tanggal === formData.tanggal &&
    ['pending', 'verified'].includes(rep.status)
  )
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.room_id || !formData.tanggal || isAlreadyReported) return
    let finalAlasan = formData.alasan
    if (formData.alasan === 'LAINNYA') {
      if (!customAlasan.trim()) {
        setMessage({ text: 'Silahkan isi rincian alasan pelaporan.', type: 'error' })
        return
      }
      finalAlasan = `LAINNYA: ${customAlasan.trim()}`
    }

    setLoading(true)
    setMessage({ text: '', type: '' })
    try {
      const response = await api.post('/reports', { ...formData, alasan: finalAlasan })
      setMessage({ text: response.data.message || 'Laporan kelas kosong berhasil dikirim!', type: 'success' })
      fetchPJData()
    } catch (error) {
      if (error.response && error.response.data.error) {
        setMessage({ text: error.response.data.error, type: 'error' })
      } else {
        setMessage({ text: 'Terjadi kesalahan koneksi server.', type: 'error' })
      }
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Pelaporan Kelas Kosong</h1>
        <p className="page-subtitle">Laporkan ketidakhadiran dosen untuk jadwal pertemuan mendatang agar ruangan dapat digunakan kelas lain.</p>
      </div>
      <div className="card-flat" style={{ maxWidth: '600px' }}>
        {message.text && (
          <div style={{
            background: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
            color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
            padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500'
          }}>
            {message.text}
          </div>
        )}
        {loadingSchedules ? (
          <p style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>Memuat jadwal pertemuan Anda...</p>
        ) : userSchedules.length === 0 ? (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            ⚠️ <b>Jadwal Pertemuan Tidak Ditemukan!</b><br />
            Mata Kuliah ({user?.mata_kuliah || '-'}) belum terdaftar dalam jadwal perkuliahan SIAKAD. Silakan hubungi Admin.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Auto-Filled Mata Kuliah */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Mata Kuliah Penanggung Jawab</label>
              <input type="text" className="input-field" value={formData.mata_kuliah} readOnly style={{ background: '#f8fafc', fontWeight: 'bold' }} />
            </div>
            {/* Pilihan Sesi Pertemuan SIAKAD */}
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Pilih Pertemuan Jadwal Yang Ingin Dilaporkan Kosong</label>
              {userSchedules.length === 1 ? (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px 16px', borderRadius: '8px', color: '#1e40af', fontSize: '14px', fontWeight: '500' }}>
                  📌 <b>Sesi Tunggal:</b> {formatTanggalIndonesia(formData.tanggal)} ({userSchedules[0].waktu_mulai.substring(0, 5)} - {userSchedules[0].waktu_selesai.substring(0, 5)} WIB) @ Ruang {userSchedules[0].rooms?.nama || userSchedules[0].room_id}
                </div>
              ) : (
                <select className="input-field" value={selectedSessionIndex} onChange={handleSessionChange} required>
                  <option value="">-- Pilih Sesi Pertemuan Perkuliahan --</option>
                  {userSchedules.map((sch, idx) => {
                    const schDate = getNextDateForHari(sch.hari)
                    return (
                      <option key={idx} value={idx}>
                        Pertemuan {formatTanggalIndonesia(schDate)} ({sch.waktu_mulai.substring(0, 5)} - {sch.waktu_selesai.substring(0, 5)} WIB) @ Ruang {sch.rooms?.nama || sch.room_id}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>
            {/* Ruangan & Tanggal Mendatang (Auto-Filled Readonly) */}
            {activeSession && (
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px' }}>
                <p style={{ margin: '0 0 6px', color: '#475569' }}>📍 Ruangan Jadwal Asli: <b>Ruang {activeSession.rooms?.nama || activeSession.room_id} ({activeSession.rooms?.gedung || '-'})</b></p>
                <p style={{ margin: 0, color: '#059669' }}>📅 Tanggal Pertemuan Mendatang: <b>{formatTanggalIndonesia(formData.tanggal)}</b></p>
              </div>
            )}
            {/* NOTIFIKASI JIKA SUDAH PERNAH DILAPORKAN */}
            {isAlreadyReported && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
                ℹ️ Laporan pengosongan untuk sesi pertemuan pada tanggal <b>{formatTanggalIndonesia(formData.tanggal)}</b> ini sudah berhasil dikirim sebelumnya (Menunggu Verifikasi Admin).
              </div>
            )}
            {/* OPSI JENIS PELAPORAN */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Jenis Laporan / Kendala</label>
              <select name="alasan" value={formData.alasan} onChange={handleChange} className="input-field" required>
                <option value="">-- Pilih Jenis Laporan --</option>
                <option value="DOSEN_BERHALANGAN">Dosen Berhalangan Hadir (Kosong)</option>
                <option value="RUANGAN_TERKUNCI">Ruangan Terkunci / Bermasalah</option>
                <option value="KELAS_ONLINE">Kelas Dipindah ke Online (Zoom/Meet)</option>
                <option value="LAINNYA">Lainnya (Tulis keterangan....)</option>
              </select>
            </div>
            {formData.alasan === 'LAINNYA' && (
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Rincian Alasan / Detail Kendala</label>
                <textarea
                  className="input-field"
                  rows="3"
                  value={customAlasan}
                  onChange={(e) => setCustomAlasan(e.target.value)}
                  placeholder="Contoh: AC mati, saklar lampu rusak, atau dosen berhalangan hadir dadakan..."
                  required
                  disabled={isAlreadyReported}
                ></textarea>
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'var(--color-error)' }} disabled={loading || selectedSessionIndex === ''}>
              {loading ? 'Mengirim Laporan...' : '🚨 Kirim Laporan Kelas Kosong'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
export default PelaporanKelas