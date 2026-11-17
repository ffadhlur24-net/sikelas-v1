import { useState, useEffect } from "react";
import api from '../../api/axios'
import './ManajemenProdi.css'
import { useToast } from '../../context/ToastContext'
import ConfirmModal from '../../components/Modal/ConfirmModal'
import {
  Building,
  GeoAltFill,
  ArrowRight,
  PlusLg,
  MortarboardFill,
  PencilSquare,
  TrashFill,
  Search
} from 'react-bootstrap-icons'

function ManajemenProdi() {
  const { showSuccess, showError } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [prodiSearch, setProdiSearch] = useState('')

  // Navigasi Level: null = Level 1 (Daftar Fakultas), String = Level 2 (Prodi dalam Fakultas Terpilih)
  const [selectedFakultas, setSelectedFakultas] = useState(null);

  // Form Fakultas / Prodi
  const [formFakultas, setFormFakultas] = useState({ fakultas: '' });
  const [formProdi, setFormProdi] = useState({ nama_prodi: '', kode_prodi: '' });
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, prodiName: '', loading: false });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departemen')
      setDepartments(res.data.departemen || [])
    } catch (error) {
      console.error('Gagal mengambil data departemen:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  // Ekstrak Daftar Fakultas Unik dari Database
  const fakultasSet = new Set(departments.map(d => d.fakultas).filter(Boolean))
  const listFakultas = Array.from(fakultasSet)

  // 1. Tambah / Edit Fakultas Baru
  const handleSaveFakultas = async (e) => {
    e.preventDefault()
    if (!formFakultas.fakultas.trim()) return
    setActionLoading(true)
    try {
      // Buat 1 prodi contoh/placeholder untuk mendaftarkan nama fakultas jika baru
      await api.post('/departemen', {
        fakultas: formFakultas.fakultas.trim(),
        nama_prodi: `${formFakultas.fakultas.trim()} (Umum)`,
        kode_prodi: 'UMUM'
      })
      showSuccess(`Fakultas "${formFakultas.fakultas}" berhasil ditambahkan!`, 'FAKULTAS')
      setFormFakultas({ fakultas: '' })
      fetchDepartments()
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal menyimpan fakultas.', 'FAKULTAS')
    } finally {
      setActionLoading(false)
    }
  }

  // 2. Tambah / Edit Prodi dalam Fakultas Terpilih
  const handleSaveProdi = async (e) => {
    e.preventDefault()
    if (!selectedFakultas || !formProdi.nama_prodi.trim()) return
    setActionLoading(true)
    try {
      const payload = {
        fakultas: selectedFakultas,
        nama_prodi: formProdi.nama_prodi.trim(),
        kode_prodi: formProdi.kode_prodi.trim() || 'PRODI'
      }

      if (editingId) {
        await api.put(`/departemen/${editingId}`, payload)
        showSuccess('Program Studi berhasil diperbarui!', 'PROGRAM STUDI')
      } else {
        await api.post('/departemen', payload)
        showSuccess('Program Studi baru berhasil ditambahkan!', 'PROGRAM STUDI')
      }

      setFormProdi({ nama_prodi: '', kode_prodi: '' })
      setEditingId(null)
      fetchDepartments()
    } catch (error) {
      showError(error.response?.data?.error || 'Gagal menyimpan Program Studi.', 'PROGRAM STUDI')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditProdi = (dep) => {
    setEditingId(dep.id)
    setFormProdi({
      nama_prodi: dep.nama_prodi || '',
      kode_prodi: dep.kode_prodi || ''
    })
  }

  const handleDeleteProdi = (id, prodiName) => {
    setConfirmDelete({ open: true, id, prodiName: prodiName || 'ini', loading: false })
  }

  const handleConfirmDeleteProdi = async () => {
    const { id, prodiName } = confirmDelete
    setConfirmDelete(prev => ({ ...prev, loading: true }))
    try {
      await api.delete(`/departemen/${id}`)
      showSuccess(`Program Studi "${prodiName}" berhasil dihapus!`, 'PROGRAM STUDI')
      setConfirmDelete({ open: false, id: null, prodiName: '', loading: false })
      fetchDepartments()
    } catch (error) {
      showError('Gagal menghapus Program Studi.', 'PROGRAM STUDI')
      setConfirmDelete(prev => ({ ...prev, loading: false }))
    }
  }

  // Filter prodi berdasarkan Fakultas terpilih
  const prodiInSelectedFakultas = selectedFakultas
    ? departments.filter(d => d.fakultas === selectedFakultas && !d.nama_prodi.includes('(Umum)'))
    : []
  const filteredProdi = prodiInSelectedFakultas.filter(dep => {
    const query = prodiSearch.trim().toLowerCase()
    if (!query) return true
    return [dep.nama_prodi, dep.kode_prodi, dep.fakultas]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(query))
  })
  const totalProdi = departments.filter(d => !d.nama_prodi.includes('(Umum)')).length
  const totalFakultas = listFakultas.length
  const fakultasWithProdi = listFakultas.filter(fakultas => departments.some(d => d.fakultas === fakultas && !d.nama_prodi.includes('(Umum)'))).length

  return (
    <div className="faculty-management-page animate-fade-in">
      <section className="faculty-stats-grid" aria-label="Ringkasan fakultas dan program studi">
        <article className="faculty-stat stat-navy"><span>Total Fakultas</span><strong>{totalFakultas}</strong></article>
        <article className="faculty-stat stat-blue"><span>Total Program Studi</span><strong>{totalProdi}</strong></article>
        <article className="faculty-stat stat-green"><span>Fakultas Terisi</span><strong>{fakultasWithProdi}</strong></article>
        <article className="faculty-stat stat-orange"><span>Data Akademik</span><strong>{departments.length}</strong></article>
      </section>

      <div className="faculty-page-heading">
        <p className="faculty-eyebrow">ADMINISTRATOR / ACADEMIC STRUCTURE</p>
        <h1>Manajemen Fakultas & Program Studi</h1>
        <p>Kelola struktur Fakultas dan Program Studi akademik secara teratur dan konsisten.</p>
      </div>

      {/* NAVIGASI BREADCRUMB LEVEL */}
      <div className="faculty-breadcrumb">
        <button
          type="button"
          className={`faculty-breadcrumb-btn ${!selectedFakultas ? 'active' : ''}`}
          onClick={() => { setSelectedFakultas(null); setEditingId(null); }}
          title={selectedFakultas ? "Klik untuk kembali ke Daftar Fakultas" : "Level 1: Daftar Fakultas"}
        >
          <Building size={15} /> <span>Daftar Fakultas (Level 1)</span>
        </button>
        {selectedFakultas && (
          <>
            <span className="faculty-breadcrumb-separator"><ArrowRight size={14} /></span>
            <span className="faculty-breadcrumb-active">
              <GeoAltFill size={15} /> <span>{selectedFakultas} (Level 2: Sub-Prodi)</span>
            </span>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* LEVEL 1: DAFTAR KARTU FAKULTAS MASTER */}
      {/* ========================================================= */}
      {!selectedFakultas && (
        <>
          {/* Form Tambah Fakultas Baru */}
          <div className="card-flat faculty-add-card">
            <h3 className="faculty-add-title"><PlusLg size={16} /> Tambah Master Fakultas Baru</h3>
            <form onSubmit={handleSaveFakultas} className="faculty-add-form">
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Fakultas Sains dan Teknologi"
                value={formFakultas.fakultas}
                onChange={(e) => setFormFakultas({ fakultas: e.target.value })}
                required
              />
              <button className="btn btn-primary" disabled={actionLoading} type="submit">Tambah</button>
            </form>
          </div>

          {/* Grid Kartu Fakultas */}
          <div className="faculty-grid">
            {listFakultas.map((fakName, idx) => {
              const count = departments.filter(d => d.fakultas === fakName && !d.nama_prodi.includes('(Umum)')).length
              return (
                <div
                  key={idx}
                  className="card-flat faculty-card-item"
                  onClick={() => setSelectedFakultas(fakName)}
                >
                  <div className="faculty-card-top">
                    <div className="faculty-card-icon"><Building size={28} /></div>
                    <span className="badge badge-success">{count} Program Studi</span>
                  </div>
                  <h3 className="faculty-card-title">{fakName}</h3>
                  <p className="faculty-card-action">
                    Klik untuk kelola daftar prodi <ArrowRight size={13} />
                  </p>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* LEVEL 2: KELOLA PROGRAM STUDI DALAM FAKULTAS TERPILIH */}
      {/* ========================================================= */}
      {selectedFakultas && (
        <div className="faculty-detail-card card-flat">
          <div className="faculty-detail-heading">
            <div>
              <h2><MortarboardFill size={20} /> Program Studi di {selectedFakultas}</h2>
              <p>Tambah dan edit nama program studi terikat tanpa pengetikan manual.</p>
            </div>
          </div>

          {/* Form Tambah / Edit Prodi */}
          <form className="faculty-prodi-form" onSubmit={handleSaveProdi}>
            <h4>
              {editingId ? (
                <><PencilSquare size={14} /> Edit Program Studi</>
              ) : (
                <><PlusLg size={14} /> Tambah Program Studi Baru</>
              )}
            </h4>
            <div className="faculty-prodi-form-grid">
              <div className="faculty-form-group prodi-name-group">
                <label className="form-label">Nama Program Studi</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: Teknik Informatika"
                  value={formProdi.nama_prodi}
                  onChange={(e) => setFormProdi({ ...formProdi, nama_prodi: e.target.value })}
                  required
                />
              </div>
              <div className="faculty-form-group prodi-code-group">
                <label className="form-label">Kode Prodi</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: TIF"
                  value={formProdi.kode_prodi}
                  onChange={(e) => setFormProdi({ ...formProdi, kode_prodi: e.target.value })}
                />
              </div>
              <div className="faculty-form-actions">
                <button className="btn btn-primary" disabled={actionLoading} type="submit">
                  {editingId ? 'Simpan Perubahan' : 'Tambah Prodi'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setEditingId(null); setFormProdi({ nama_prodi: '', kode_prodi: '' }); }}
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>
          </form>

          <section className="faculty-prodi-search">
            <div className="faculty-search-title">
              <span aria-hidden="true" style={{ display: 'inline-flex' }}><Search size={16} /></span>
              <h3>PENELUSURAN PROGRAM STUDI</h3>
            </div>
            <div className="faculty-search-row">
              <input type="search" className="faculty-search-input" value={prodiSearch} onChange={(e) => setProdiSearch(e.target.value)} placeholder="Masukkan Nama Program Studi untuk mencari..." aria-label="Cari program studi" />
              <button
                type="button"
                className="faculty-search-button"
                onClick={() => setProdiSearch(prodiSearch.trim())}
              >
                <Search size={15} /> CARI
              </button>
            </div>
          </section>

          {/* Desktop Table View (> 768px) */}
          <div className="faculty-prodi-table-wrapper">
            <table className="faculty-prodi-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '12px 16px' }}>Kode</th>
                  <th style={{ padding: '12px 16px' }}>Nama Program Studi</th>
                  <th style={{ padding: '12px 16px' }}>Fakultas Terikat</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProdi.length > 0 ? filteredProdi.map((dep) => (
                  <tr key={dep.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#059669' }}>{dep.kode_prodi || '-'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{dep.nama_prodi}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{dep.fakultas}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button className="btn btn-secondary btn-sm faculty-action-edit" style={{ marginRight: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px' }} onClick={() => handleEditProdi(dep)}><PencilSquare size={13} /> Edit</button>
                      <button className="btn btn-secondary btn-sm faculty-action-delete" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} onClick={() => handleDeleteProdi(dep.id, dep.nama_prodi)}><TrashFill size={13} /> Hapus</button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      {prodiSearch ? 'Program studi tidak ditemukan.' : `Belum ada Program Studi yang terdaftar di ${selectedFakultas}. Silakan tambah prodi di atas.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Entity Cards View (<= 768px) */}
          <div className="faculty-prodi-mobile-cards">
            {filteredProdi.length > 0 ? (
              filteredProdi.map((dep) => (
                <div key={`m-dep-${dep.id}`} className="prodi-mobile-item">
                  <div className="prodi-mobile-header">
                    <div>
                      <span className="prodi-mobile-code-badge">{dep.kode_prodi || 'PRODI'}</span>
                      <h4 className="prodi-mobile-title">{dep.nama_prodi}</h4>
                      <span className="prodi-mobile-faculty">{dep.fakultas}</span>
                    </div>
                  </div>
                  <div className="prodi-mobile-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm faculty-action-edit prodi-mobile-btn"
                      onClick={() => handleEditProdi(dep)}
                    >
                      <PencilSquare size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm faculty-action-delete prodi-mobile-btn"
                      onClick={() => handleDeleteProdi(dep.id, dep.nama_prodi)}
                    >
                      <TrashFill size={13} /> Hapus
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="prodi-mobile-empty">
                {prodiSearch ? 'Program studi tidak ditemukan.' : `Belum ada Program Studi yang terdaftar di ${selectedFakultas}. Silakan tambah prodi di atas.`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PRODI */}
      <ConfirmModal
        isOpen={confirmDelete.open}
        title="Hapus Program Studi"
        message={`Apakah Anda yakin ingin menghapus Program Studi "${confirmDelete.prodiName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Prodi"
        cancelText="Batal"
        variant="danger"
        loading={confirmDelete.loading}
        onConfirm={handleConfirmDeleteProdi}
        onCancel={() => !confirmDelete.loading && setConfirmDelete({ open: false, id: null, prodiName: '', loading: false })}
      />
    </div>
  )
}

export default ManajemenProdi