import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from '../api/axios'

function LandingPage() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([])
    const [loading, setLoading] = useState(false)
    const [selectedKampus, setSelectedKampus] = useState('semua')
    const [selectedGedung, setSelectedGedung] = useState('semua')

    useEffect(() => {
        const fetchPublicRooms = async (isInitial = false) => {
            try {
                if (isInitial) setLoading(true)
                const res = await api.get('/rooms')
                setRooms(res.data.rooms || [])
            } catch (error) {
                console.error(error.response?.data?.error || 'Gagal mengambil data ruangan')
            } finally {
                if (isInitial) setLoading(false)
            }
        }
        fetchPublicRooms()
        const intervalId = setInterval(() => {
            fetchPublicRooms(false)
        }, 10000)

        return () => clearInterval(intervalId)
    }, [])

    const listKampus = ['semua', ...Array.from(new Set(rooms.map(r => r.kampus).filter(Boolean)))]

    const filteredBykampus = selectedKampus === 'semua'
        ? rooms
        : rooms.filter(r => r.kampus === selectedKampus)

    const listGedung = ['semua', ...Array.from(new Set(filteredBykampus.map(r => r.gedung).filter(Boolean)))]

    const displayedRooms = selectedGedung === 'semua'
        ? filteredBykampus
        : filteredBykampus.filter(r => r.gedung === selectedGedung)

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: 'sans-serif' }}>

            {/* 📍 1. NAVBAR FLOATING */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '16px 32px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: '#059669', padding: '8px', borderRadius: '10px', color: '#fff', fontSize: '18px' }}>🎓</div>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#059669', letterSpacing: '-0.5px' }}>SiKelas</span>
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '14px', fontWeight: '600' }}>
                    <a href="#hero" style={{ color: '#475569', textDecoration: 'none' }}>Beranda</a>
                    <a href="#live-status" style={{ color: '#475569', textDecoration: 'none' }}>Status Ruangan</a>
                    <a href="#keunggulan" style={{ color: '#475569', textDecoration: 'none' }}>Fitur Utama</a>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/register')}>📝 Daftar PJ</button>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>🔑 Masuk Sistem</button>
                </div>
            </nav>
            {/* 🚀 2. HERO BANNER SECTION */}
            <section id="hero" style={{ padding: '80px 32px 60px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
                <span style={{ background: '#d1fae5', color: '#059669', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                    ✨ Platform Manajemen Kelas
                </span>
                <h1 style={{ fontSize: '42px', fontWeight: '900', margin: '20px 0', lineHeight: '1.2', letterSpacing: '-1px' }}>
                    Manajemen & Peminjaman Ruang Kelas Kampus <span style={{ color: '#059669' }}>Tanpa Bentrok</span>
                </h1>
                <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>
                    Pantau ketersediaan fisik kelas secara real-time, cegah jadwal tumpang tindih dengan SIAKAD, dan ajukan reservasi ruangan secara transparan dalam hitungan detik.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <a href="#live-status" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px' }}>🔍 Cek Ruangan Kosong</a>
                    <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px' }} onClick={() => navigate('/login')}>🔐 Login Account</button>
                </div>
            </section>
            {/* 📊 3. WIDGET STATUS RUANGAN PUBLIK (LIVE ROOM STATUS) */}
            <section id="live-status" style={{ padding: '60px 32px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px' }}>📍 Ketersediaan Ruangan Hari Ini</h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Pantau ketersediaan fisik kelas secara publik tanpa perlu melakukan login.</p>
                </div>
                {/* Filter Dropdown Publik */}
                <div className="card-flat" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>🏫 Kampus:</label>
                        <select
                            className="input-field"
                            style={{ width: 'auto', padding: '6px 12px' }}
                            value={selectedKampus}
                            onChange={(e) => { setSelectedKampus(e.target.value); setSelectedGedung('Semua'); }}
                        >
                            {listKampus.map((k, i) => <option key={i} value={k}>{k}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>🏢 Gedung:</label>
                        <select
                            className="input-field"
                            style={{ width: 'auto', padding: '6px 12px' }}
                            value={selectedGedung}
                            onChange={(e) => setSelectedGedung(e.target.value)}
                        >
                            {listGedung.map((g, i) => <option key={i} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>
                {/* Grid Kartu Ruangan Publik */}
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#64748b' }}>Memuat status ruangan...</p>
                ) : displayedRooms.length === 0 ? (
                    <div className="card-flat" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Tidak ada ruangan yang ditemukan untuk lokasi ini.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                        {displayedRooms.map((room) => (
                            <div key={room.id} className="card-flat" style={{ background: '#fff', borderLeft: room.status === 'tersedia' ? '4px solid #059669' : room.status === 'terkunci' ? '4px solid #ef4444' : '4px solid #f59e0b' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>{room.nama}</h3>
                                    {room.status === 'tersedia' && <span className="badge badge-success">🟢 Tersedia</span>}
                                    {room.status === 'terkunci' && <span className="badge badge-error">🔴 Terkunci</span>}
                                    {room.status === 'perbaikan' && <span className="badge badge-warning">🟡 Perbaikan</span>}
                                </div>
                                <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>
                                    {room.gedung || 'Gedung'} ({room.kampus || 'Kampus 3'}) • Lantai {room.lantai || 1}
                                </p>
                                <div style={{ fontSize: '13px', fontWeight: '500', color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>🪑 Kapasitas: {room.kapasitas} Kursi</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
            {/* 🌟 4. FITUR UNGGULAN (4 PILAR HIGH-IMPACT) */}
            <section id="keunggulan" style={{ padding: '70px 32px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <span style={{ background: '#d1fae5', color: '#059669', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>
                            Keunggulan Platform
                        </span>
                        <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '12px 0 8px', letterSpacing: '-0.5px' }}>Empat Pilar Efisiensi Kampus Modern</h2>
                        <p style={{ color: '#64748b', fontSize: '15px' }}>Solusi cerdas terpadu untuk mengoptimalkan penggunaan ruang kelas secara transparan.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>

                        {/* Pilar 1 */}
                        <div className="card-flat" style={{ border: '1px solid #e2e8f0', padding: '28px', background: '#f8fafc', borderRadius: '16px' }}>
                            <div style={{ background: '#d1fae5', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                                ⚡
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>Live Occupancy Radar</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                Pemantauan fisik ketersediaan kelas secara langsung detik demi detik dengan pembaruan otomatis tanpa perlu me-refresh layar.
                            </p>
                        </div>
                        {/* Pilar 2 */}
                        <div className="card-flat" style={{ border: '1px solid #e2e8f0', padding: '28px', background: '#f8fafc', borderRadius: '16px' }}>
                            <div style={{ background: '#dbeafe', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                                🧠
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>Smart Overlap Engine</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                Otak algoritma cerdas backend yang menjamin nol persen tumpang tindih antara jadwal perkuliahan harian dengan acara insidental.
                            </p>
                        </div>
                        {/* Pilar 3 */}
                        <div className="card-flat" style={{ border: '1px solid #e2e8f0', padding: '28px', background: '#f8fafc', borderRadius: '16px' }}>
                            <div style={{ background: '#fef3c7', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                                🏛️
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>Hierarki Multi-Kampus</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                Pengelompokan fisik ruangan dari tingkat Kampus, Gedung, hingga Lantai yang rapih, teratur, dan bebas dari kesalahan pengetikan.
                            </p>
                        </div>
                        {/* Pilar 4 */}
                        <div className="card-flat" style={{ border: '1px solid #e2e8f0', padding: '28px', background: '#f8fafc', borderRadius: '16px' }}>
                            <div style={{ background: '#fee2e2', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: '20px' }}>
                                🛠️
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>Smart Ticketing Pelaporan</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                Fitur pelaporan cepat untuk kendala ruang kelas (fasilitas bermasalah/dosen absen) yang terhubung langsung ke Dasbor Staf Admin.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            {/* 🏁 5. FOOTER */}
            <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '32px', textAlign: 'center', fontSize: '14px' }}>
                <p style={{ margin: 0 }}>SiKelas © 2026. All Rights Reserved.</p>
            </footer>
        </div>
    )
}

export default LandingPage