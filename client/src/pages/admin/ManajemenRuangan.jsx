import { useState, useEffect } from 'react'
import api from '../../api/axios'

function ManajemenRuangan() {
  const [rooms, setRooms] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  // NAVIGASI HIERARKI BERJENJANG:
  // selectedKampus: null (Level 1: Daftar Kampus), String (mis: "Kampus 3")
  // selectedGedung: null (Level 2: Daftar Gedung), String (mis: "Gedung Q")
  const [selectedKampus, setSelectedKampus] = useState(null)
  const [selectedGedung, setSelectedGedung] = useState(null)

  // Form Tambah Kampus / Gedung / Ruangan Baru
  const [newKampusInput, setNewKampusInput] = useState('')
  const [newGedungInput, setNewGedungInput] = useState('')
  
  const [formData, setFormData] = useState({
    nama: '',
    lantai: 1,
    kapasitas: 40
  })

  // Tambah Jadwal Pertama Sekaligus (Opsional)
  const [addWithSchedule, setAddWithSchedule] = useState(false)
  const [initialSched, setInitialSched] = useState({
    prodi: '',
    semester: '1',
    kelas: 'A',
    mata_kuliah: '',
    dosen: '',
    hari: 'Senin',
    waktu_mulai: '08:00',
    waktu_selesai: '10:30'
  })

  // State Modal Kelola Jadwal Ruangan
  const [selectedRoomModal, setSelectedRoomModal] = useState(null)
  const [roomSchedules, setRoomSchedules] = useState([])
  const [loadingSched, setLoadingSched] = useState(false)
  const [showFormSched, setShowFormSched] = useState(false)
  const [editingSchedId, setEditingSchedId] = useState(null)

  const [schedForm, setSchedForm] = useState({
    prodi: '',
    semester: '1',
    kelas: 'A',
    mata_kuliah: '',
    dosen: '',
    hari: 'Senin',
    waktu_mulai: '08:00',
    waktu_selesai: '10:30'
  })

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data.rooms || [])
    } catch (error) {
      console.error("Gagal mengambil data ruangan:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departemen')
      const deps = res.data.departemen || []
      setDepartments(deps)
      if (deps.length > 0) {
        setInitialSched(prev => ({ ...prev, prodi: prev.prodi || deps[0].nama_prodi }))
        setSchedForm(prev => ({ ...prev, prodi: prev.prodi || deps[0].nama_prodi }))
      }
    } catch (error) {
      console.error('Gagal mengambil data prodi:', error)
    }
  }

  useEffect(() => {
    fetchRooms()
    fetchDepartments()
  }, [])

  // Ekstrak Daftar Kampus Unik & Daftar Gedung Unik
  const kampusList = Array.from(new Set(rooms.map(r => r.kampus).filter(Boolean)))
  if (!kampusList.includes('Kampus 3') && kampusList.length === 0) kampusList.push('Kampus 3')

  const gedungListInSelectedKampus = selectedKampus
    ? Array.from(new Set(rooms.filter(r => r.kampus === selectedKampus).map(r => r.gedung).filter(Boolean)))
    : []

  // Filter Ruangan di Level 3 (Terkunci pada Kampus & Gedung Terpilih)
  const roomsInSelectedGedung = (selectedKampus && selectedGedung)
    ? rooms.filter(r => r.kampus === selectedKampus && r.gedung === selectedGedung)
    : []

  // Kelompokkan Ruangan berdasarkan Lantai
  const roomsByLantai = roomsInSelectedGedung.reduce((acc, room) => {
    const lt = room.lantai || 1
    if (!acc[lt]) acc[lt] = []
    acc[lt].push(room)
    return acc
  }, {})

  const handleAddKampus = (e) => {
    e.preventDefault()
    if (!newKampusInput.trim()) return
    setSelectedKampus(newKampusInput.trim())
    setNewKampusInput('')
  }

  const handleAddGedung = (e) => {
    e.preventDefault()
    if (!newGedungInput.trim()) return
    setSelectedGedung(newGedungInput.trim())
    setNewGedungInput('')
  }

  const handleAddRooms = async (e) => {
    e.preventDefault()
    if (!selectedKampus || !selectedGedung) return
    setActionLoading(true)
    setMessage({ text: '', type: '' })

    try {
      const payloadRoom = {
        ...formData,
        kampus: selectedKampus,
        gedung: selectedGedung
      }

      const resRoom = await api.post('/rooms', payloadRoom)
      const newRoom = resRoom.data.room

      if (addWithSchedule && newRoom) {
        await api.post('/schedules', {
          ...initialSched,
          room_id: newRoom.id
        })
      }

      setMessage({ text: `Ruangan ${formData.nama} berhasil ditambahkan ke ${selectedGedung}!`, type: 'success' })
      setFormData({ nama: '', lantai: 1, kapasitas: 40 })
      setAddWithSchedule(false)
      fetchRooms()
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || 'Gagal menambahkan ruangan baru.',
        type: 'error'
      })
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage({ text: '', type: '' }), 3000)
    }
  }

  const handleUppdateStatus = async (id, status) => {
    setActionLoading(true)
    try {
      await api.patch(`/rooms/${id}/status`, { status })
      fetchRooms()
    } catch (error) {
      alert('Gagal mengupdate status ruangan.')
    } finally {
      setActionLoading(false)
    }
  }

  const fetchRoomSchedules = async (roomId) => {
    try {
      setLoadingSched(true)
      const res = await api.get(`/schedules?room_id=${roomId}`)
      setRoomSchedules(res.data.schedules || [])
    } catch (error) {
      console.error("Gagal memuat jadwal ruangan:", error)
    } finally {
      setLoadingSched(false)
    }
  }

  const handleOpenRoomSchedules = (room) => {
    setSelectedRoomModal(room)
    setShowFormSched(false)
    setEditingSchedId(null)
    fetchRoomSchedules(room.id)
  }

  const handleSaveSchedule = async (e) => {
    e.preventDefault()
    if (!selectedRoomModal) return

    try {
      if (editingSchedId) {
        await api.put(`/schedules/${editingSchedId}`, {
          ...schedForm,
          room_id: selectedRoomModal.id
        })
      } else {
        await api.post('/schedules', {
          ...schedForm,
          room_id: selectedRoomModal.id
        })
      }

      setShowFormSched(false)
      setEditingSchedId(null)
      fetchRoomSchedules(selectedRoomModal.id)
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menyimpan jadwal perkuliahan.')
    }
  }

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Apakah anda yakin ingin menghapus jadwal perkuliahan ini?')) return
    try {
      await api.delete(`/schedules/${id}`)
      fetchRoomSchedules(selectedRoomModal.id)
    } catch (error) {
      alert('Gagal menghapus jadwal.')
    }
  }

  const handleEditScheduleClick = (sched) => {
    setEditingSchedId(sched.id)
    setSchedForm({
      prodi: sched.prodi || (departments.length > 0 ? departments[0].nama_prodi : ''),
      semester: sched.semester || '1',
      kelas: sched.kelas || 'A',
      mata_kuliah: sched.mata_kuliah || '',
      dosen: sched.dosen || '',
      hari: sched.hari || 'Senin',
      waktu_mulai: sched.waktu_mulai || '08:00',
      waktu_selesai: sched.waktu_selesai || '10:30'
    })
    setShowFormSched(true)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Manajemen Ruangan & Jadwal</h1>
        <p className="page-subtitle">Inventaris fisik teratur berbasis hierarki Kampus ➔ Gedung ➔ Ruangan Per Lantai.</p>
      </div>

      {message.text && (
        <div style={{
          background: message.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-error-bg)',
          color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
          padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500'
        }}>
          {message.text}
        </div>
      )}

      {/* BREADCRUMB NAVIGASI HIERARKI 3 LEVEL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: 'bold', flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary btn-sm"
          style={{ background: !selectedKampus ? '#059669' : '#e2e8f0', color: !selectedKampus ? '#fff' : '#475569' }}
          onClick={() => { setSelectedKampus(null); setSelectedGedung(null); }}
        >
          🏫 Level 1: Daftar Kampus
        </button>

        {selectedKampus && (
          <>
            <span>➔</span>
            <button
              className="btn btn-secondary btn-sm"
              style={{ background: selectedKampus && !selectedGedung ? '#059669' : '#e2e8f0', color: selectedKampus && !selectedGedung ? '#fff' : '#475569' }}
              onClick={() => setSelectedGedung(null)}
            >
              🏢 Level 2: Gedung ({selectedKampus})
            </button>
          </>
        )}

        {selectedKampus && selectedGedung && (
          <>
            <span>➔</span>
            <span style={{ color: '#059669', background: '#d1fae5', padding: '4px 12px', borderRadius: '6px' }}>
              📍 Level 3: {selectedGedung} ({selectedKampus}) - Ruangan Per Lantai
            </span>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* LEVEL 1: DAFTAR MASTER KAMPUS */}
      {/* ========================================================= */}
      {!selectedKampus && (
        <>
          <div className="card-flat" style={{ marginBottom: '24px', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>➕ Tambah Lokasi Kampus Baru</h3>
            <form onSubmit={handleAddKampus} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Kampus 3"
                value={newKampusInput}
                onChange={(e) => setNewKampusInput(e.target.value)}
                required
              />
              <button className="btn btn-primary" type="submit">Tambah</button>
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {kampusList.map((kam, idx) => {
              const totalRooms = rooms.filter(r => r.kampus === kam).length
              const totalGedung = new Set(rooms.filter(r => r.kampus === kam).map(r => r.gedung)).size
              return (
                <div
                  key={idx}
                  className="card-flat"
                  style={{ cursor: 'pointer', borderLeft: '4px solid #059669', background: '#fff' }}
                  onClick={() => setSelectedKampus(kam)}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏫</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px' }}>{kam}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>{totalGedung} Gedung • {totalRooms} Ruangan</p>
                  <span style={{ color: '#059669', fontSize: '13px', fontWeight: 'bold' }}>Kelola Gedung ➔</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* LEVEL 2: DAFTAR MASTER GEDUNG DALAM KAMPUS TERPILIH */}
      {/* ========================================================= */}
      {selectedKampus && !selectedGedung && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>🏢 Gedung di {selectedKampus}</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedKampus(null)}>⬅️ Kembali ke Kampus</button>
          </div>

          <div className="card-flat" style={{ marginBottom: '24px', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px' }}>➕ Tambah Gedung Baru di {selectedKampus}</h3>
            <form onSubmit={handleAddGedung} style={{ display: 'flex', gap: '12px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Gedung Q"
                value={newGedungInput}
                onChange={(e) => setNewGedungInput(e.target.value)}
                required
              />
              <button className="btn btn-primary" type="submit">Tambah Gedung</button>
            </form>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
            {gedungListInSelectedKampus.map((ged, idx) => {
              const countRooms = rooms.filter(r => r.kampus === selectedKampus && r.gedung === ged).length
              return (
                <div
                  key={idx}
                  className="card-flat"
                  style={{ cursor: 'pointer', borderLeft: '4px solid #2563eb', background: '#fff' }}
                  onClick={() => setSelectedGedung(ged)}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🏢</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px' }}>{ged}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>{countRooms} Ruangan Perkuliahan</p>
                  <span style={{ color: '#2563eb', fontSize: '13px', fontWeight: 'bold' }}>Lihat Ruangan Per Lantai ➔</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* LEVEL 3: RUANGAN PER LANTAI DI GEDUNG TERPILIH + JADWAL */}
      {/* ========================================================= */}
      {selectedKampus && selectedGedung && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>📍 Ruangan {selectedGedung} ({selectedKampus})</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Daftar inventaris ruang terbagi otomatis per lantai gedung.</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedGedung(null)}>⬅️ Kembali ke Daftar Gedung</button>
          </div>

          {/* Form Tambah Ruangan Baru di Gedung Terpilih */}
          <div className="card-flat" style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>➕ Tambah Ruangan Baru di {selectedGedung}</h3>
            <form onSubmit={handleAddRooms}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div style={{ flex: '2', minWidth: '160px' }}>
                  <label className="form-label">Nama Ruangan (Mis: Q.3.1)</label>
                  <input type="text" className="input-field" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} required />
                </div>
                <div style={{ flex: '1', minWidth: '100px' }}>
                  <label className="form-label">Lantai ke-</label>
                  <input type="number" className="input-field" value={formData.lantai} onChange={(e) => setFormData({ ...formData, lantai: Number(e.target.value) })} required />
                </div>
                <div style={{ flex: '1', minWidth: '120px' }}>
                  <label className="form-label">Kapasitas (Kursi)</label>
                  <input type="number" className="input-field" value={formData.kapasitas} onChange={(e) => setFormData({ ...formData, kapasitas: Number(e.target.value) })} required />
                </div>
              </div>

              {/* Tambah Jadwal Pertama Sekaligus (Prodi Dinamis) */}
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={addWithSchedule}
                    onChange={(e) => setAddWithSchedule(e.target.checked)}
                  />
                  ➕ Tambah Jadwal Perkuliahan Pertama Sekaligus (Opsional)
                </label>

                {addWithSchedule && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                    <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Program Studi</label>
                        <select className="input-field" value={initialSched.prodi} onChange={(e) => setInitialSched({ ...initialSched, prodi: e.target.value })} required={addWithSchedule}>
                          <option value="">-- Pilih Prodi --</option>
                          {departments.map(dep => (
                            <option key={dep.id} value={dep.nama_prodi}>
                              {dep.nama_prodi} ({dep.fakultas || 'Fakultas'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Semester</label>
                        <select className="input-field" value={initialSched.semester} onChange={(e) => setInitialSched({ ...initialSched, semester: e.target.value })} required={addWithSchedule}>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Kelas</label>
                        <select className="input-field" value={initialSched.kelas} onChange={(e) => setInitialSched({ ...initialSched, kelas: e.target.value })} required={addWithSchedule}>
                          {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(k => <option key={k} value={k}>Kelas {k}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Mata Kuliah</label>
                        <input type="text" className="input-field" value={initialSched.mata_kuliah} onChange={(e) => setInitialSched({ ...initialSched, mata_kuliah: e.target.value })} placeholder="Pemrograman Web" required={addWithSchedule} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Dosen Pengampu</label>
                        <input type="text" className="input-field" value={initialSched.dosen} onChange={(e) => setInitialSched({ ...initialSched, dosen: e.target.value })} placeholder="Dr. Ilham, M.Kom" required={addWithSchedule} />
                      </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Hari</label>
                        <select className="input-field" value={initialSched.hari} onChange={(e) => setInitialSched({ ...initialSched, hari: e.target.value })} required={addWithSchedule}>
                          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Jam Mulai</label>
                        <input type="time" className="input-field" value={initialSched.waktu_mulai} onChange={(e) => setInitialSched({ ...initialSched, waktu_mulai: e.target.value })} required={addWithSchedule} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Jam Selesai</label>
                        <input type="time" className="input-field" value={initialSched.waktu_selesai} onChange={(e) => setInitialSched({ ...initialSched, waktu_selesai: e.target.value })} required={addWithSchedule} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button className="btn btn-primary" disabled={actionLoading} type="submit">Simpan Ruangan Baru</button>
            </form>
          </div>

          {/* Pengelompokan Ruangan Berdasarkan Lantai */}
          {Object.keys(roomsByLantai).length === 0 ? (
            <div className="card-flat" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
              Belum ada ruangan yang terdaftar di {selectedGedung}. Silakan tambah ruangan baru di atas.
            </div>
          ) : (
            Object.keys(roomsByLantai).sort((a, b) => Number(a) - Number(b)).map(lantaiNum => (
              <div key={lantaiNum} className="card-flat" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#0f172a' }}>
                  🏢 Ruangan Lantai {lantaiNum}
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                      <th style={{ padding: '10px 12px' }}>Nama Ruang</th>
                      <th style={{ padding: '10px 12px' }}>Kapasitas</th>
                      <th style={{ padding: '10px 12px' }}>Status Saat Ini</th>
                      <th style={{ padding: '10px 12px' }}>Ubah Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Kelola Jadwal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomsByLantai[lantaiNum].map(room => (
                      <tr key={room.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#059669' }}>{room.nama}</td>
                        <td style={{ padding: '12px' }}>{room.kapasitas} kursi</td>
                        <td style={{ padding: '12px' }}>
                          {room.status === 'tersedia' && <span className="badge badge-success">Tersedia</span>}
                          {room.status === 'terkunci' && <span className="badge badge-error">Terkunci</span>}
                          {room.status === 'perbaikan' && <span className="badge badge-warning">Perbaikan</span>}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <select
                            className="input-field"
                            style={{ padding: '4px 8px', height: 'auto', width: 'auto', display: 'inline-block' }}
                            value={room.status}
                            onChange={(e) => handleUppdateStatus(room.id, e.target.value)}
                            disabled={actionLoading}
                          >
                            <option value="tersedia">Tersedia</option>
                            <option value="terkunci">Terkunci</option>
                            <option value="perbaikan">Perbaikan</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenRoomSchedules(room)}>
                            📅 Kelola Jadwal
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* MODAL KELOLA JADWAL SIAKAD (PRODI DINAMIS) */}
      {/* ========================================================= */}
      {selectedRoomModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card-flat" style={{ width: '100%', maxWidth: '680px', background: '#fff', padding: '24px', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>📅 Jadwal SIAKAD Ruang {selectedRoomModal.nama}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRoomModal(null)}>Tutup</button>
            </div>

            {!showFormSched && (
              <button className="btn btn-primary btn-sm" style={{ marginBottom: '16px' }} onClick={() => { setEditingSchedId(null); setShowFormSched(true); }}>
                ➕ Tambah Jadwal Perkuliahan
              </button>
            )}

            {/* FORM TAMBAH / EDIT JADWAL RUANGAN */}
            {showFormSched && (
              <form onSubmit={handleSaveSchedule} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
                  {editingSchedId ? '✏️ Edit Jadwal' : '➕ Tambah Jadwal Baru'}
                </h3>
                <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Program Studi</label>
                    <select className="input-field" value={schedForm.prodi} onChange={(e) => setSchedForm({ ...schedForm, prodi: e.target.value })} required>
                      <option value="">-- Pilih Prodi --</option>
                      {departments.map(dep => (
                        <option key={dep.id} value={dep.nama_prodi}>
                          {dep.nama_prodi} ({dep.fakultas || 'Fakultas'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Semester</label>
                    <select className="input-field" value={schedForm.semester} onChange={(e) => setSchedForm({ ...schedForm, semester: e.target.value })} required>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Kelas</label>
                    <select className="input-field" value={schedForm.kelas} onChange={(e) => setSchedForm({ ...schedForm, kelas: e.target.value })} required>
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(k => <option key={k} value={k}>Kelas {k}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Mata Kuliah</label>
                    <input type="text" className="input-field" value={schedForm.mata_kuliah} onChange={(e) => setSchedForm({ ...schedForm, mata_kuliah: e.target.value })} placeholder="Pemrograman Web" required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Dosen Pengampu</label>
                    <input type="text" className="input-field" value={schedForm.dosen} onChange={(e) => setSchedForm({ ...schedForm, dosen: e.target.value })} placeholder="Dr. Ilham, M.Kom" required />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Hari</label>
                    <select className="input-field" value={schedForm.hari} onChange={(e) => setSchedForm({ ...schedForm, hari: e.target.value })} required>
                      {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Jam Mulai</label>
                    <input type="time" className="input-field" value={schedForm.waktu_mulai} onChange={(e) => setSchedForm({ ...schedForm, waktu_mulai: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Jam Selesai</label>
                    <input type="time" className="input-field" value={schedForm.waktu_selesai} onChange={(e) => setSchedForm({ ...schedForm, waktu_selesai: e.target.value })} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowFormSched(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary btn-sm">Simpan Jadwal</button>
                </div>
              </form>
            )}

            {/* TABEL DAFTAR JADWAL HARIAN RUANGAN */}
            {loadingSched ? (
              <p>Memuat jadwal...</p>
            ) : roomSchedules.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Ruangan ini belum memiliki jadwal perkuliahan reguler.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={{ padding: '8px 12px' }}>Hari & Waktu</th>
                    <th style={{ padding: '8px 12px' }}>Mata Kuliah & Dosen</th>
                    <th style={{ padding: '8px 12px' }}>Kelas</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {roomSchedules.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <b>{s.hari}</b><br />
                        <span className="text-muted" style={{ fontSize: '12px' }}>{s.waktu_mulai.substring(0, 5)} - {s.waktu_selesai.substring(0, 5)}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <b>{s.mata_kuliah}</b><br />
                        <span className="text-muted" style={{ fontSize: '12px' }}>{s.dosen}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {s.prodi} (Smstr {s.semester} - {s.kelas})
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button className="btn btn-secondary btn-sm" style={{ marginRight: '4px' }} onClick={() => handleEditScheduleClick(s)}>✏️</button>
                        <button className="btn btn-secondary btn-sm" style={{ color: 'red' }} onClick={() => handleDeleteSchedule(s.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ManajemenRuangan
