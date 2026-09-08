import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from '../api/axios';
import './LandingPage.css';
import {
    PencilSquare,
    KeyFill,
    Stars,
    Search,
    LockFill,
    GeoAltFill,
    Building,
    Buildings,
    BarChartFill,
    CircleFill,
    PeopleFill,
    LightningChargeFill,
    CpuFill,
    Bank2,
    Tools,
    RocketTakeoffFill
} from 'react-bootstrap-icons';

function LandingPage() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedKampus, setSelectedKampus] = useState('semua');
    const [selectedGedung, setSelectedGedung] = useState('semua');
    const [currentPage, setCurrentPage] = useState(1);

    // Grid 4 kolom x 5 baris = 20 kartu per halaman
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        const fetchPublicRooms = async (isInitial = false) => {
            try {
                if (isInitial) setLoading(true);
                const res = await api.get('/rooms');
                setRooms(res.data.rooms || []);
            } catch (error) {
                console.error(error.response?.data?.error || 'Gagal mengambil data ruangan');
            } finally {
                if (isInitial) setLoading(false);
            }
        };
        fetchPublicRooms(true);
        const intervalId = setInterval(() => {
            fetchPublicRooms(false);
        }, 10000);

        return () => clearInterval(intervalId);
    }, []);

    // Reset pagination ketika filter kampus atau gedung berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedKampus, selectedGedung]);

    const listKampus = ['semua', ...Array.from(new Set(rooms.map(r => r.kampus).filter(Boolean)))];

    const filteredBykampus = selectedKampus === 'semua'
        ? rooms
        : rooms.filter(r => r.kampus === selectedKampus);

    const listGedung = ['semua', ...Array.from(new Set(filteredBykampus.map(r => r.gedung).filter(Boolean)))];

    const displayedRooms = selectedGedung === 'semua'
        ? filteredBykampus
        : filteredBykampus.filter(r => r.gedung === selectedGedung);

    // Perhitungan Pagination
    const totalRooms = displayedRooms.length;
    const totalPages = Math.max(1, Math.ceil(totalRooms / ITEMS_PER_PAGE));
    const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalRooms);
    const currentRooms = displayedRooms.slice(startIndex, endIndex);

        const scrollToSection = (e, targetId) => {
        if (e) e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages || newPage === validCurrentPage) return;
        setCurrentPage(newPage);
        const element = document.getElementById('live-status');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getPageNumbers = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (validCurrentPage <= 3) {
            return [1, 2, 3, 4, '...', totalPages];
        }
        if (validCurrentPage >= totalPages - 2) {
            return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', totalPages];
    };

    return (
        <div className="landing-page" style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: 'sans-serif' }}>

            {/* 1. NAVBAR FLOATING */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)', borderBottom: '1px solid #e2e8f0', padding: '16px 32px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={(e) => scrollToSection(e, 'hero')}>
                    <div style={{ background: '#059669', padding: '8px', borderRadius: '10px', color: '#fff', fontSize: '18px' }}>
                        <img width="50" src="/assets/logo_sikelas.png" alt="Logo SiKelas" />
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#059669', letterSpacing: '-0.5px' }}>SiKelas</span>
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '14px', fontWeight: '600' }}>
                    <a href="#hero" onClick={(e) => scrollToSection(e, 'hero')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Beranda</a>
                    <a href="#live-status" onClick={(e) => scrollToSection(e, 'live-status')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Status Ruangan</a>
                    <a href="#keunggulan" onClick={(e) => scrollToSection(e, 'keunggulan')} style={{ color: '#475569', textDecoration: 'none', cursor: 'pointer' }}>Fitur Utama</a>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate('/register')}><PencilSquare size={16} /> Daftar PJ</button>
                    <button className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => navigate('/login')}><KeyFill size={16} /> Masuk Sistem</button>
                </div>
            </nav>

            {/* 2. HERO BANNER SECTION (FULL-WIDTH EDGE-TO-EDGE) */}
            <section id="hero">
                <div className="hero-content">
                    <span style={{ background: '#d1fae5', color: '#059669', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Stars size={16} /> Platform Manajemen Kelas
                    </span>
                    <h1 style={{ fontSize: '42px', fontWeight: '900', margin: '20px 0', lineHeight: '1.2', letterSpacing: '-1px' }}>
                        Manajemen & Peminjaman Ruang Kelas Kampus <span style={{ color: '#059669' }}>Tanpa Bentrok</span>
                    </h1>
                    <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '32px', lineHeight: '1.6' }}>
                        Pantau ketersediaan fisik kelas secara real-time, cegah jadwal tumpang tindih dengan SIAKAD, dan ajukan reservasi ruangan secara transparan dalam hitungan detik.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="#live-status" onClick={(e) => scrollToSection(e, 'live-status')} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Search size={16} /> Cek Ruangan Kosong</a>
                        <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('/login')}><LockFill size={16} /> Login Account</button>
                    </div>
                </div>
            </section>

            {/* 3. WIDGET STATUS RUANGAN PUBLIK (LIVE ROOM STATUS) */}
            <section id="live-status" style={{ padding: '60px 32px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><GeoAltFill size={26} color="#059669" /> Ketersediaan Ruangan Hari Ini</h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Pantau ketersediaan fisik kelas secara publik tanpa perlu melakukan login.</p>
                </div>

                {/* Filter Dropdown Publik */}
                <div className="card-flat" style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Building size={16} /> Kampus:</label>
                        <select
                            className="input-field"
                            style={{ width: 'auto', padding: '6px 12px' }}
                            value={selectedKampus}
                            onChange={(e) => { setSelectedKampus(e.target.value); setSelectedGedung('semua'); }}
                        >
                            {listKampus.map((k, i) => <option key={i} value={k}>{k}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontWeight: 'bold', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Buildings size={16} /> Gedung:</label>
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

                {/* Grid Kartu Ruangan Publik (4 x 5) */}
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#64748b' }}>Memuat status ruangan...</p>
                ) : displayedRooms.length === 0 ? (
                    <div className="card-flat" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Tidak ada ruangan yang ditemukan untuk lokasi ini.
                    </div>
                ) : (
                    <>
                        <div className="landing-room-grid">
                            {currentRooms.map((room) => (
                                <div key={room.id} className="landing-room-card">
                                    <div className="landing-room-header">
                                        <h3 className="landing-room-title">{room.nama}</h3>
                                        {room.status === 'tersedia' && (
                                            <span className="landing-room-badge status-tersedia" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <CircleFill size={7} /> Tersedia
                                            </span>
                                        )}
                                        {room.status === 'terkunci' && (
                                            <span className="landing-room-badge status-terkunci" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <CircleFill size={7} /> Terkunci
                                            </span>
                                        )}
                                        {room.status === 'perbaikan' && (
                                            <span className="landing-room-badge status-perbaikan" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <CircleFill size={7} /> Perbaikan
                                            </span>
                                        )}
                                    </div>
                                    <div className="landing-room-location">
                                        <p className="landing-room-building">
                                            {room.gedung || 'Gedung'} ({room.kampus || 'Kampus 3'})
                                        </p>
                                        <p className="landing-room-floor">
                                            • Lantai {room.lantai || 1}
                                        </p>
                                    </div>
                                    <div className="landing-room-divider" />
                                    <div className="landing-room-footer">
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><PeopleFill size={15} /> Kapasitas: {room.kapasitas} Kursi</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Neo-Brutalist matching mockup */}
                        <div className="landing-pagination-wrapper">
                            <div className="landing-pagination-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <BarChartFill size={16} /> Menampilkan {totalRooms === 0 ? 0 : startIndex + 1}-{endIndex} dari {totalRooms} Ruangan
                            </div>

                            {totalPages > 1 && (
                                <div className="landing-pagination-controls">
                                    <button
                                        type="button"
                                        className="landing-page-btn landing-page-nav-btn"
                                        onClick={() => handlePageChange(validCurrentPage - 1)}
                                        disabled={validCurrentPage === 1}
                                    >
                                        ← Prev
                                    </button>

                                    {getPageNumbers().map((page, idx) => {
                                        if (page === '...') {
                                            return (
                                                <span key={`ellipsis-${idx}`} className="landing-page-ellipsis">
                                                    ...
                                                </span>
                                            );
                                        }
                                        return (
                                            <button
                                                key={page}
                                                type="button"
                                                className={`landing-page-btn landing-page-num-btn ${validCurrentPage === page ? 'active' : ''}`}
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}

                                    <button
                                        type="button"
                                        className="landing-page-btn landing-page-nav-btn"
                                        onClick={() => handlePageChange(validCurrentPage + 1)}
                                        disabled={validCurrentPage === totalPages}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>

            {/* 4. FITUR UNGGULAN (4 PILAR HIGH-IMPACT) */}
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
                            <div style={{ background: '#d1fae5', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <LightningChargeFill size={28} color="#059669" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>Live Occupancy Radar</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                Pemantauan fisik ketersediaan kelas secara langsung detik demi detik dengan pembaruan otomatis tanpa perlu me-refresh layar.
                            </p>
                        </div>
                        {/* Pilar 2 */}
                        <div className="card-flat" style={{ border: '1px solid #e2e8f0', padding: '28px', background: '#f8fafc', borderRadius: '16px' }}>
                            <div style={{ background: '#dbeafe', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <CpuFill size={28} color="#2563eb" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>Smart Overlap Engine</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                Otak algoritma cerdas backend yang menjamin nol persen tumpang tindih antara jadwal perkuliahan harian dengan acara insidental.
                            </p>
                        </div>
                        {/* Pilar 3 */}
                        <div className="card-flat" style={{ border: '1px solid #e2e8f0', padding: '28px', background: '#f8fafc', borderRadius: '16px' }}>
                            <div style={{ background: '#fef3c7', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <Bank2 size={28} color="#d97706" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>Hierarki Multi-Kampus</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                Pengelompokan fisik ruangan dari tingkat Kampus, Gedung, hingga Lantai yang rapih, teratur, dan bebas dari kesalahan pengetikan.
                            </p>
                        </div>
                        {/* Pilar 4 */}
                        <div className="card-flat" style={{ border: '1px solid #e2e8f0', padding: '28px', background: '#f8fafc', borderRadius: '16px' }}>
                            <div style={{ background: '#fee2e2', width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <Tools size={28} color="#dc2626" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>Smart Ticketing Pelaporan</h3>
                            <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                                Fitur pelaporan cepat untuk kendala ruang kelas (fasilitas bermasalah/dosen absen) yang terhubung langsung ke Dasbor Staf Admin.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            <section className="landing-cta">
                <div>
                    <span className="landing-pill">AKSES KAMPUS TERPADU</span>
                    <h2>Ingin Meminjam Ruangan untuk Kegiatan?</h2>
                    <p>Ajukan reservasi sekarang sebagai Penanggung Jawab (PJ) kelas. Proses persetujuan tercatat transparan.</p>
                </div>
                <button type="button" className="landing-cta-button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }} onClick={() => navigate('/register')}><RocketTakeoffFill size={20} /> Mulai Pinjam Kelas</button>
            </section>
            {/* 5. FOOTER */}
            <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '32px', textAlign: 'center', fontSize: '14px' }}>
                <p style={{ margin: 0 }}>SiKelas © 2026. All Rights Reserved.</p>
            </footer>
        </div>
    );
}

export default LandingPage;