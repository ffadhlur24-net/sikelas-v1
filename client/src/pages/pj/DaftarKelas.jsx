import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

function DaftarKelas() {
  const [activeFilter, setActiveFilter] = useState('semua')
  const [rooms, setRooms] = useState([]) // State untuk menyinpan data ruangan
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const navigate = useNavigate()



  // Fungsi untuk mengambil data ruangan dari back end 
  const fetchRooms = async () => {
    try {
      setLoading(true)
      //Memanggil GET /api/rooms
      const response = await api.get('/rooms')
      // Simpan data ke State
      setRooms(response.data.rooms)
    } catch (err) {
      console.error(err)
      setError('Gagal memuat data ruangan dari server.')
    } finally {
      setLoading(false)
    }
  }

  // AUTO-REFRESH & JAM DIGITAL
  useEffect(() => {
    fetchRooms()

    // 1. Jam digital
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000); // 1 detik

    // 2. Auto-refresh
    const refreshTimer = setInterval(() => {
      fetchRooms()
    }, 60000); // 1 menit

    // Cleanup jika PJ pindah halaman
    return () => {
      clearInterval(clockTimer);
      clearInterval(refreshTimer);
    }
  }, [])

  // Filter ruangan berdasarkan status
  const filteredRooms = activeFilter == 'semua' ? rooms
    : rooms.filter(r => r.status === activeFilter)


  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-betwen', aligItem: 'flex-start' }}>
        <div>
          <h1 className="page-title">Daftar Kelas</h1>
          <p className="page-subtitle">Pantau status dan tersediaan ruang kelas hari ini.</p>
        </div>

        {/* JAM DIGITAL */}
        <div style={{ textAlign: 'right', background: '#f8fafc', padding: '10px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '2px' }}>
            WAKTU SERVER
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'monospace', color: '#0f172a' }}>
            {currentTime.toLocaleTimeString('id-ID')}
          </div>
        </div>
      </div>



      <div className="tabs-container">
        <button className={`tab-btn ${activeFilter === 'semua' ? 'active' : ''}`} onClick={() => setActiveFilter('semua')}>Semua</button>
        <button className={`tab-btn ${activeFilter === 'tersedia' ? 'active' : ''}`} onClick={() => setActiveFilter('tersedia')}>Tersedia</button>
        <button className={`tab-btn ${activeFilter === 'sedang_digunakan' ? 'active' : ''}`} onClick={() => setActiveFilter('sedang_digunakan')}>Sedang Digunakan</button>
        <button className={`tab-btn ${activeFilter === 'dipesan' ? 'active' : ''}`} onClick={() => setActiveFilter('dipesan')}>Dipesan</button>
        <button className={`tab-btn ${activeFilter === 'terkunci' ? 'active' : ''}`} onClick={() => setActiveFilter('terkunci')}>Terkunci</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-muted)' }}>
          Memuat data ruangan...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-error)' }}>
          {error}
        </div>
      ) : (
        <div className="room-grid">
          {filteredRooms.length > 0 ? filteredRooms.map((room) => (
            <div className="card-flat room-card" key={room.id}>
              <div style={{ display: 'flex', justifyContent: 'space-betwen', aligItem: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: '700', marginBottom: '4px' }}>{room.nama}</h3>
                  <p className="text-sm text-muted">{room.gedung} - Lantai {room.lantai}</p>
                </div>
                {room.status === 'tersedia' && <span className="badge badge-success">Tersedia</span>}
                {room.status === 'sedang_digunakan' && <span className="badge badge-warning" style={{ background: '#f97316', color: 'white' }}>Digunakan</span>}
                {room.status === 'dipesan' && <span className="badge badge-warning" style={{ background: '#eab308', color: 'white' }}>Dipesan</span>}
                {room.status === 'terkunci' && <span className="badge badge-error">Terkunci</span>}
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', aligItem: 'center', gap: '6px', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  {room.kapasitas} Kursi
                </div>
              </div>

              {room.status !== 'terkunci' ? (
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => navigate('/pj/reservasi')}>Reservasi Untuk Nanti</button>
              ) : (
                <button className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled>Tidak Tersedia</button>
              )}
            </div>
          )) : (
            <div style={{ gridColumn: '1/ -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Tidak ada ruangan dengan status tersebut.
            </div>
          )}
        </div>
      )}
    </div>

  )
}

export default DaftarKelas
