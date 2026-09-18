import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../api/axios';
import NeoSelect from '../components/Select/NeoSelect';
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
    ChevronLeft,
    ChevronRight,
    List,
    XLg,
    HouseDoorFill,
    ArrowRight,
    HeartFill,
    CheckLg
} from 'react-bootstrap-icons';

function LandingPage() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedKampus, setSelectedKampus] = useState('semua');
    const [selectedGedung, setSelectedGedung] = useState('semua');
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Grid: Desktop 4x5 (20 kartu), Mobile 2x4 (8 kartu) atau 2x3 (6 kartu)
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth <= 768;
        }
        return false;
    });

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 8 kartu per halaman pada mobile (2 kolom x 4 baris = 2x4, atau 6 untuk 2x3)
    const ITEMS_PER_PAGE = isMobile ? 8 : 20;

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

    // Reset pagination ketika filter kampus, gedung, atau breakpoint mobile/desktop berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedKampus, selectedGedung, isMobile]);

    const listKampus = ['semua', ...Array.from(new Set(rooms.map(r => r.kampus).filter(Boolean)))];

    const filteredBykampus = selectedKampus === 'semua'
        ? rooms
        : rooms.filter(r => r.kampus === selectedKampus);

    const listGedung = ['semua', ...Array.from(new Set(filteredBykampus.map(r => r.gedung).filter(Boolean)))];

    const kampusOptions = listKampus.map(k => ({
        value: k,
        label: k === 'semua' ? 'Semua Kampus' : k
    }));

    const gedungOptions = listGedung.map(g => ({
        value: g,
        label: g === 'semua' ? 'Semua Gedung' : g
    }));

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
        setIsMobileMenuOpen(false);
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
        <div className="landing-page">

            {/* 1. NAVBAR FLOATING */}
            <nav className="landing-navbar">
                <div className="landing-brand" onClick={(e) => scrollToSection(e, 'hero')}>
                    <div className="landing-brand-logo">
                        <img src="/assets/logo_sikelas.png" alt="Logo SiKelas" className="landing-brand-img" />
                    </div>
                    <span className="landing-brand-title">SiKelas</span>
                </div>
                <div className="landing-nav-links">
                    <a href="#hero" className="landing-nav-btn nav-btn-beranda" onClick={(e) => scrollToSection(e, 'hero')}>Beranda</a>
                    <a href="#keunggulan" className="landing-nav-btn nav-btn-fitur" onClick={(e) => scrollToSection(e, 'keunggulan')}>Fitur Utama</a>
                    <a href="#live-status" className="landing-nav-btn nav-btn-status" onClick={(e) => scrollToSection(e, 'live-status')}>Status Ruangan</a>
                </div>
                <div className="landing-nav-actions">
                    <button type="button" className="btn btn-secondary btn-sm landing-btn-pj-cta" onClick={() => navigate('/register')}>
                        <span className="btn-icon-wrapper"><PencilSquare size={16} /></span>
                        <span>Daftar PJ</span>
                    </button>
                    <button type="button" className="btn btn-primary btn-sm landing-btn-masuk-cta" onClick={() => navigate('/login')}>
                        <KeyFill size={16} /> Masuk Sistem
                    </button>
                    {/* Tombol Hamburger Mobile */}
                    <button
                        type="button"
                        className={`landing-mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Menu navigasi"
                    >
                        {isMobileMenuOpen ? (
                            <XLg size={22} color="#000000" />
                        ) : (
                            <List size={26} color="#000000" />
                        )}
                    </button>
                </div>

                {/* Backdrop Mobile Drawer */}
                {isMobileMenuOpen && (
                    <div
                        className="landing-mobile-drawer-backdrop"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Drawer Menu Navigasi Mobile */}
                <div className={`landing-mobile-drawer ${isMobileMenuOpen ? 'is-open' : ''}`}>
                    <div className="mobile-drawer-header">
                        <span className="mobile-drawer-tag">Navigasi Halaman</span>
                    </div>
                    <div className="mobile-drawer-links">
                        <button type="button" className="mobile-drawer-link-btn" onClick={(e) => scrollToSection(e, 'hero')}>
                            <HouseDoorFill size={18} /> <span>Beranda Utama</span>
                        </button>
                        <button type="button" className="mobile-drawer-link-btn" onClick={(e) => scrollToSection(e, 'keunggulan')}>
                            <Stars size={18} /> <span>Fitur Utama</span>
                        </button>
                        <button type="button" className="mobile-drawer-link-btn" onClick={(e) => scrollToSection(e, 'live-status')}>
                            <GeoAltFill size={18} /> <span>Status Ruangan</span>
                        </button>
                    </div>
                    <div className="mobile-drawer-divider" />
                    <div className="mobile-drawer-actions">
                        <button
                            type="button"
                            className="mobile-drawer-btn-register"
                            onClick={() => { setIsMobileMenuOpen(false); navigate('/register'); }}
                        >
                            <PencilSquare size={18} /> <span>Daftar Sebagai PJ Kelas</span>
                        </button>
                        <button
                            type="button"
                            className="mobile-drawer-btn-login"
                            onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }}
                        >
                            <KeyFill size={18} /> <span>Masuk ke Sistem</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* 2. HERO BANNER SECTION (2 COLUMNS: TEXT LEFT + IMAGE CARD RIGHT) */}
            <section id="hero" className="landing-hero-section">
                {/* Background Checkerboard Bottom Accent */}
                <div className="hero-checkerboard-accent" aria-hidden="true">
                    <div className="hero-checkerboard-pattern" />
                </div>

                <div className="hero-container">
                    {/* Left Column: Headline & Action Buttons */}
                    <div className="hero-left-col">
                        <div className="hero-badge">
                            <Stars size={18} />
                            <span>Platform Manajemen Kelas Modern</span>
                        </div>
                        <h1 className="hero-title">
                            Manajemen &amp; Peminjaman Ruang Kelas Kampus
                            <span className="hero-title-highlight-wrap">
                                <span className="hero-title-highlight">Tanpa Bentrok</span>
                            </span>
                        </h1>
                        <p className="hero-desc">
                            Pantau ketersediaan fisik kelas secara <span className="hero-highlight-inline">real-time</span>, cegah jadwal tumpang tindih dengan SIAKAD, dan ajukan reservasi ruangan secara transparan dalam hitungan detik.
                        </p>
                        <div className="hero-actions">
                            <a href="#live-status" onClick={(e) => scrollToSection(e, 'live-status')} className="btn hero-btn-search">
                                <Search size={18} /> <span>Cek Ruangan Kosong</span>
                            </a>
                            <button type="button" className="btn hero-btn-login" onClick={() => navigate('/login')}>
                                <LockFill size={18} /> <span>Login Account</span>
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Hero Card with Image */}
                    <div className="hero-right-col">
                        {/* Realistic Washi Tape on top */}
                        <div className="washi-tape-vertical hero-card-tape" aria-hidden="true" />

                        {/* Floating Corner Badge */}
                        <div className="hero-card-corner-badge" aria-hidden="true">
                            <HeartFill size={20} color="#ffffff" />
                        </div>

                        {/* Card Container */}
                        <div className="hero-card-frame">
                            <div className="hero-card-image-box">
                                <img
                                    src="/assets/logo_sk.png"
                                    alt="Mahasiswa SiKelas"
                                    className="hero-card-img"
                                />
                            </div>
                            <div className="hero-card-footer">
                                <span className="hero-card-caption">best class ever</span>
                                <span className="hero-card-tag">SK-2026</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. FITUR UNGGULAN (MOVED TO POSITION #2 - NOTE PAPER CARDS WITH WASHI TAPE & RUNNING BANNER) */}
            <section id="keunggulan" className="landing-features-section">
                {/* Houndstooth / Pattern Accent at bottom */}
                <div className="features-bottom-accent" aria-hidden="true">
                    <div className="features-bottom-pattern" />
                </div>

                <div className="landing-features-container">
                    {/* Section Header */}
                    <div className="landing-section-header">
                        <div className="features-badge">
                            <LightningChargeFill size={15} />
                            <span>KEUNGGULAN PLATFORM</span>
                        </div>
                        <h2 className="features-title">Kelola Operasional Ruang Kelas Lebih Mudah</h2>
                        <p className="landing-section-subtitle">Semua fitur penting untuk memantau, mengatur, dan melaporkan kegiatan kampus dalam satu tempat.</p>
                    </div>

                    {/* 4 Cards Grid with Dynamic Neobrutalist Offsets and Tilts */}
                    <div className="features-note-grid">

                        {/* Pillar 1: Note Paper Sheet (Tilted -2deg, shifted upwards) */}
                        <div className="note-card-wrapper note-card-tilt-1">
                            <div className="washi-tape-vertical note-card-tape tape-tilt-left" aria-hidden="true" />
                            <div className="note-card-body">
                                <div className="note-card-accent-line accent-cyan" />
                                <div className="note-card-content">
                                    <div className="note-card-icon-box bg-cyan">
                                        <LightningChargeFill size={26} />
                                    </div>
                                    <h3 className="note-card-title">Cek Status Kelas Real-Time</h3>
                                    <p className="note-card-desc">
                                        Pantau ketersediaan ruang kelas secara langsung dan otomatis tanpa perlu pembaruan manual.
                                    </p>
                                </div>
                                <div className="note-card-footer">
                                    <span>Status Realtime</span>
                                    <ArrowRight size={16} className="note-card-arrow" />
                                </div>
                            </div>
                        </div>

                        {/* Pillar 2: Note Paper Sheet (Tilted +2.5deg, shifted downwards) */}
                        <div className="note-card-wrapper note-card-tilt-2">
                            <div className="washi-tape-vertical note-card-tape tape-tilt-right" aria-hidden="true" />
                            <div className="note-card-body">
                                <div className="note-card-accent-line accent-purple" />
                                <div className="note-card-content">
                                    <div className="note-card-icon-box bg-purple">
                                        <CpuFill size={26} />
                                    </div>
                                    <h3 className="note-card-title">Pencegah Jadwal Bentrok</h3>
                                    <p className="note-card-desc">
                                        Memastikan jadwal kuliah harian dan acara kampus tidak pernah tumpang tindih dengan akurat.
                                    </p>
                                </div>
                                <div className="note-card-footer">
                                    <span>Anti-Collision AI</span>
                                    <ArrowRight size={16} className="note-card-arrow" />
                                </div>
                            </div>
                        </div>

                        {/* Pillar 3: Note Paper Sheet (Tilted -1.5deg, shifted slightly upwards) */}
                        <div className="note-card-wrapper note-card-tilt-3">
                            <div className="washi-tape-vertical note-card-tape tape-tilt-left" aria-hidden="true" />
                            <div className="note-card-body">
                                <div className="note-card-accent-line accent-yellow" />
                                <div className="note-card-content">
                                    <div className="note-card-icon-box bg-yellow">
                                        <Bank2 size={26} />
                                    </div>
                                    <h3 className="note-card-title">Tata Letak Ruangan Rapi</h3>
                                    <p className="note-card-desc">
                                        Atur lokasi ruangan dengan terstruktur berdasarkan kampus, gedung, hingga nomor lantai.
                                    </p>
                                </div>
                                <div className="note-card-footer">
                                    <span>Multi-Level Node</span>
                                    <ArrowRight size={16} className="note-card-arrow" />
                                </div>
                            </div>
                        </div>

                        {/* Pillar 4: Note Paper Sheet (Tilted +3deg, shifted downwards) */}
                        <div className="note-card-wrapper note-card-tilt-4">
                            <div className="washi-tape-vertical note-card-tape tape-tilt-right" aria-hidden="true" />
                            <div className="note-card-body">
                                <div className="note-card-accent-line accent-coral" />
                                <div className="note-card-content">
                                    <div className="note-card-icon-box bg-coral">
                                        <Tools size={26} />
                                    </div>
                                    <h3 className="note-card-title">Laporan Kendala Cepat</h3>
                                    <p className="note-card-desc">
                                        Laporkan fasilitas rusak atau kendala kelas secara langsung ke tim admin dengan responsif.
                                    </p>
                                </div>
                                <div className="note-card-footer">
                                    <span>Instant Dispatch</span>
                                    <ArrowRight size={16} className="note-card-arrow" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 4. WIDGET STATUS RUANGAN PUBLIK (LIVE ROOM STATUS - FOLDER-TAB DESIGN) */}
            <section id="live-status" className="landing-status-section">
                {/* Checkerboard Bottom Accent */}
                <div className="status-checkerboard-accent" aria-hidden="true">
                    <div className="status-checkerboard-pattern" />
                </div>

                <div className="landing-status-container">
                    <div className="landing-section-header">
                        <div className="status-header-badge">
                            <GeoAltFill size={22} className="landing-title-icon" />
                            <h2 className="landing-section-title">Ketersediaan Ruangan Hari Ini</h2>
                        </div>
                        <p className="landing-section-subtitle">Pantau ketersediaan fisik kelas secara publik tanpa perlu melakukan login.</p>
                    </div>

                    {/* Filter Dropdown Publik */}
                    <div className="landing-filter-card card-flat">
                        <div className="landing-filter-group">
                            <label className="landing-filter-label"><Building size={18} /> Kampus:</label>
                            <div className="landing-filter-select-wrap">
                                <NeoSelect
                                    value={selectedKampus}
                                    onChange={(val) => { setSelectedKampus(val); setSelectedGedung('semua'); }}
                                    options={kampusOptions}
                                    placeholder="Pilih Kampus"
                                />
                            </div>
                        </div>
                        <div className="landing-filter-group">
                            <label className="landing-filter-label"><Buildings size={18} /> Gedung:</label>
                            <div className="landing-filter-select-wrap">
                                <NeoSelect
                                    value={selectedGedung}
                                    onChange={(val) => setSelectedGedung(val)}
                                    options={gedungOptions}
                                    placeholder="Pilih Gedung"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grid Kartu Ruangan Publik (Folder-Tab Cards) */}
                    {loading ? (
                        <p className="landing-loading-state">Memuat status ruangan...</p>
                    ) : displayedRooms.length === 0 ? (
                        <div className="landing-empty-state card-flat">
                            Tidak ada ruangan yang ditemukan untuk lokasi ini.
                        </div>
                    ) : (
                        <>
                            <div className="landing-room-grid">
                                {currentRooms.map((room, idx) => {
                                    const isLocked = room.status === 'terkunci';
                                    const isRepair = room.status === 'perbaikan';
                                    const cardIndexStr = `#${String(startIndex + idx + 1).padStart(2, '0')}`;

                                    return (
                                        <div
                                            key={room.id}
                                            className={`landing-room-card-wrapper ${isLocked ? 'is-locked' : ''} ${isRepair ? 'is-repair' : ''}`}
                                        >
                                            {/* Folder Tab at Top */}
                                            <div className="landing-room-folder-tab" aria-hidden="true" />

                                            {/* Folder Body */}
                                            <div className="landing-room-card">
                                                <div className="landing-room-header">
                                                    <h3 className="landing-room-title">{room.nama}</h3>
                                                    {room.status === 'tersedia' && (
                                                        <span className="landing-room-badge status-tersedia">
                                                            <CircleFill size={7} /> Tersedia
                                                        </span>
                                                    )}
                                                    {room.status === 'terkunci' && (
                                                        <span className="landing-room-badge status-terkunci">
                                                            <CircleFill size={7} /> Terkunci
                                                        </span>
                                                    )}
                                                    {room.status === 'perbaikan' && (
                                                        <span className="landing-room-badge status-perbaikan">
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
                                                    <span className="landing-room-capacity">
                                                        <PeopleFill size={14} /> Kapasitas: {room.kapasitas} Kursi
                                                    </span>
                                                    <span className="landing-room-tag">
                                                        {cardIndexStr}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination Neo-Brutalist matching mockup */}
                            <div className="landing-pagination-wrapper">
                                <div className="landing-pagination-badge">
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
                                            <ChevronLeft size={14} /> Prev
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
                                            Next <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* 5. CALL TO ACTION BANNER (HORIZONTAL CARD WITH IMAGE & ACTION) */}
            <section className="landing-cta-section">
                <div className="landing-cta-card">
                    <div className="landing-cta-content-group">
                        {/* Left: Polaroid Image Box with Washi Tape */}
                        <div className="landing-cta-image-col">
                            <div className="washi-tape-vertical cta-card-tape" aria-hidden="true" />
                            <div className="landing-cta-image-backdrop" aria-hidden="true" />
                            <div className="landing-cta-image-frame">
                                <div className="landing-cta-img-inner">
                                    <img
                                        src="/assets/logo_sk.png"
                                        alt="Ilustrasi Peminjaman Ruangan"
                                        className="landing-cta-img"
                                    />
                                </div>
                                <span className="landing-cta-corner-tag">
                                    PINJAM <CheckLg size={12} />
                                </span>
                            </div>
                        </div>

                        {/* Center: Text Content */}
                        <div className="landing-cta-text-col">
                            <span className="landing-pill">AKSES KAMPUS TERPADU</span>
                            <h2 className="landing-cta-title">Ingin Meminjam Ruangan untuk Kegiatan?</h2>
                            <p className="landing-cta-desc">
                                Ajukan reservasi sekarang sebagai Penanggung Jawab (PJ) kelas atau organisasi mahasiswa. Proses persetujuan otomatis &amp; tercatat transparan.
                            </p>
                        </div>
                    </div>

                    {/* Right: Big CTA Button */}
                    <div className="landing-cta-action-col">
                        <button
                            type="button"
                            className="landing-cta-button"
                            onClick={() => navigate('/register')}
                        >
                            <span>Pesan Ruangan</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </section>

            {/* 6. FOOTER (CUSTOM USER OVERRIDE) */}
            <footer className="landing-footer">
                <div className="landing-footer-container">
                    <p className="landing-footer-copy">
                        © 2026 Sikelas. All rights reserved
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;