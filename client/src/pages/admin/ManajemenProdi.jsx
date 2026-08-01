import { useState, useEffect } from "react";
import api from '../../api/axios'

function ManajemenProdi() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Navigasi Level: null = Level 1 (Daftar Fakultas), String = Level 2 (Prodi dalam Fakultas Terpilih)
  const [selectedFakultas, setSelectedFakultas] = useState(null);

  // Form Fakultas / Prodi
  const [formFakultas, setFormFakultas] = useState({ fakultas: '' });
  const [formProdi, setFormProdi] = useState({ nama_prodi: '', kode_prodi: '' });
  const [editingId, setEditingId] = useState(null);

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
      setMessage(`Fakultas "${formFakultas.fakultas}" berhasil ditambahkan!`)
      setFormFakultas({ fakultas: '' })
      fetchDepartments()
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menyimpan fakultas.')
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(''), 3000)
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
        setMessage('Program Studi berhasil diperbarui!')
      } else {
        await api.post('/departemen', payload)
        setMessage('Program Studi baru berhasil ditambahkan!')
      }

      setFormProdi({ nama_prodi: '', kode_prodi: '' })
      setEditingId(null)
      fetchDepartments()
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menyimpan Program Studi.')
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleEditProdi = (dep) => {
    setEditingId(dep.id)
    setFormProdi({
      nama_prodi: dep.nama_prodi || '',
      kode_prodi: dep.kode_prodi || ''
    })
  }

  const handleDeleteProdi = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus Program Studi ini?')) return
    setActionLoading(true)
    try {
      await api.delete(`/departemen/${id}`)
      setMessage('Program Studi berhasil dihapus!')
      fetchDepartments()
    } catch (error) {
      alert('Gagal menghapus Program Studi.')
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // Filter prodi berdasarkan Fakultas terpilih
  const prodiInSelectedFakultas = selectedFakultas
    ? departments.filter(d => d.fakultas === selectedFakultas && !d.nama_prodi.includes('(Umum)'))
    : []

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Manajemen Fakultas & Program Studi</h1>
        <p className="page-subtitle">Kelola struktur Fakultas dan Program Studi akademik secara teratur dan konsisten.</p>
      </div>

      {message && (
        <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500' }}>
          {message}
        </div>
      )}

      {/* NAVIGASI BREADCRUMB LEVEL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: 'bold' }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: !selectedFakultas ? '#059669' : '#e2e8f0', color: !selectedFakultas ? '#fff' : '#475569' }}
          onClick={() => { setSelectedFakultas(null); setEditingId(null); }}
        >
          🏛️ Daftar Fakultas (Level 1)
        </button>
        {selectedFakultas && (
          <>
            <span>➔</span>
            <span style={{ color: '#059669', background: '#d1fae5', padding: '4px 12px', borderRadius: '6px' }}>
              📍 {selectedFakultas} (Level 2: Sub-Prodi)
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
          <div className="card-flat" style={{ marginBottom: '24px', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>➕ Tambah Master Fakultas Baru</h3>
            <form onSubmit={handleSaveFakultas} style={{ display: 'flex', gap: '12px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {listFakultas.map((fakName, idx) => {
              const count = departments.filter(d => d.fakultas === fakName && !d.nama_prodi.includes('(Umum)')).length
              return (
                <div
                  key={idx}
                  className="card-flat"
                  style={{ cursor: 'pointer', borderLeft: '4px solid #059669', transition: 'transform 0.2s', background: '#fff' }}
                  onClick={() => setSelectedFakultas(fakName)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ fontSize: '28px' }}>🏛️</div>
                    <span className="badge badge-success">{count} Program Studi</span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px', color: '#0f172a' }}>{fakName}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#059669', fontWeight: '500' }}>Klik untuk kelola daftar prodi ➔</p>
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
        <div className="card-flat">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>📚 Program Studi di {selectedFakultas}</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Tambah dan edit nama program studi terikat tanpa pengetikan manual.</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedFakultas(null); setEditingId(null); }}>
              ⬅️ Kembali ke Daftar Fakultas
            </button>
          </div>

          {/* Form Tambah / Edit Prodi */}
          <form onSubmit={handleSaveProdi} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>{editingId ? '✏️ Edit Program Studi' : '➕ Tambah Program Studi Baru'}</h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 2, minWidth: '200px' }}>
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
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label className="form-label">Kode Prodi</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Contoh: TIF"
                  value={formProdi.kode_prodi}
                  onChange={(e) => setFormProdi({ ...formProdi, kode_prodi: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <button className="btn btn-primary" disabled={actionLoading} type="submit">
                  {editingId ? 'Simpan Perubahan' : 'Tambah Prodi'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setFormProdi({ nama_prodi: '', kode_prodi: '' }); }}>
                    Batal
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Tabel Daftar Prodi */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px' }}>Kode</th>
                <th style={{ padding: '12px 16px' }}>Nama Program Studi</th>
                <th style={{ padding: '12px 16px' }}>Fakultas Terikat</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {prodiInSelectedFakultas.length > 0 ? prodiInSelectedFakultas.map((dep) => (
                <tr key={dep.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#059669' }}>{dep.kode_prodi || '-'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{dep.nama_prodi}</td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{dep.fakultas}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm" style={{ marginRight: '6px' }} onClick={() => handleEditProdi(dep)}>✏️ Edit</button>
                    <button className="btn btn-secondary btn-sm" style={{ color: '#dc2626' }} onClick={() => handleDeleteProdi(dep.id)}>🗑️ Hapus</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Belum ada Program Studi yang terdaftar di {selectedFakultas}. Silakan tambah prodi di atas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ManajemenProdi