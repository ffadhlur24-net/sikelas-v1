import { useState, useEffect } from 'react'
import api from '../../api/axios'

function ManajemenRuangan() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const [formData, setFormData] = useState({
    nama: '',
    kampus: '',
    gedung: '',
    lantai: '',
    kapasitas: ''
  })
  const [addWithSchedule, setAddWithSchedule] = useState(false);
  const [initialSched, setInitialSched] = useState({
    prodi: '',
    semester: '',
    kelas: '',
    mata_kuliah: '',
    dosen: '',
    hari: '',
    waktu_mulai: '',
    waktu_selesai: ''
  });
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [roomSchedules, setRoomSchedules] = useState([])
  const [loadingSched, setLoadingSched] = useState(false)
  // State Form Tambah/Edit Jadwal di dalam Modal
  const [showFormSched, setShowFormSched] = useState(false)
  const [editingSchedId, setEditingSchedId] = useState(null)
  const [schedForm, setSchedForm] = useState({
    prodi: '',
    semester: '',
    kelas: '',
    mata_kuliah: '',
    dosen: '',
    hari: '',
    waktu_mulai: '',
    waktu_selesai: ''
  })

  // 1. Ambil untuk semua ruangan
  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data.rooms)
    } catch (error) {
      console.error("Gagal mengambil ruangan:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleAddRooms = async (e) => {
    e.preventDefault()
    setActionLoading(true)
    setMessage({ text: '', type: '' })

    const payload = {
      ...formData,
      initial_schedule: addWithSchedule ? scheduleData : null
    }

    try {
      const response = await api.post('/rooms', payload)
      setMessage({ text: response.data.message, type: 'success' })

      // Kosongkan form
      setFormData({ nama: '', kampus: '', gedung: '', lantai: '', kapasitas: '' })
      setAddWithSchedule(false)
      setScheduleData({
        prodi: '', semester: '', kelas: '', mata_kuliah: '',
        dosen: '', hari: '', waktu_mulai: '', waktu_selesai: ''
      });

      // Refresh list
      fetchRooms()
    } catch (error) {
      if (error.response && error.response.data.error) {
        setMessage({ text: error.response.data.error, type: 'error' })
      } else {
        setMessage({ text: 'Gagal menambahka ruangan baru.', type: 'error' })
      }
    } finally {
      setActionLoading(false)
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  }

  // 3. Ubah Status Ruangan (Tersedua / Terkunci / Perbaikan)
  const handleUppdateStatus = async (id, newState) => {
    setActionLoading(true)
    try {
      await api.patch(`/rooms/${id}/status`, { status: newState })
      fetchRooms() // Refres daftar agar warnanya langsung berubah
    } catch (error) {
      alert('Gagal mengubah status ruangan')
    } finally {
      setActionLoading(false)
    }

  }
  const handleChange = (e) => {
    e.preventDefault()
    setFormData({ ...formData, [e.target.name]: e.target.value })

  }
  // 4. Ambil Jadwal Ruangan
  const fetchRoomSchedules = async (roomId) => {
    try {
      setLoadingSched(true)
      const res = await api.get(`/schedules?room_id=${roomId}`)
      setRoomSchedules(res.data.schedules || [])
    } catch (error) {
      console.error("Gagal mengambil jadwal ruangan:", error)
    } finally {
      setLoadingSched(false)
    }
  }
  const handleOpenRoomSchedules = (room) => {
    setSelectedRoom(room)
    setShowFormSched(false)
    setEditingSchedId(null)
    fetchRoomSchedules(room.id)
  }

  const handleSaveSchedule = async (e) => {
    e.preventDefault()
    try {
      if (editingSchedId) {
        await api.put(`/schedules/${editingSchedId}`, { ...schedForm, room_id: selectedRoom.id })
        alert('Jadwal perkuliahan berhasil diperbarui')
      } else {
        await api.post(`/schedules`, { ...schedForm, room_id: selectedRoom.id })
        alert('Jadwal perkuliahan berhasil ditambahkan')
      }
      setShowFormSched(false)
      setEditingSchedId(null)
      fetchRoomSchedules(selectedRoom.id)
    } catch (error) {
      alert(error.response?.data?.error || 'Gagal menyimpan jadwal.')
    }
  }
  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Apakah anda yakin ingin menghapus jadwal perkuliahan ini?')) return
    try {
      await api.delete(`/schedules/${id}`)
      fetchRoomSchedules(selectedRoom.id)
    } catch (error) {
      alert('Gagal menghapus jadwal.')
    }
  }

  const handleEditScheduleClick = (sched) => {
    setEditingSchedId(sched.id)
    setSchedForm({
      prodi: sched.prodi || '',
      semester: sched.semester || '',
      kelas: sched.kelas || '',
      mata_kuliah: sched.mata_kuliah || '',
      dosen: sched.dosen || '',
      hari: sched.hari || '',
      waktu_mulai: sched.waktu_mulai || '',
      waktu_selesai: sched.waktu_selesai || ''
    })
    setShowFormSched(true)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Manajemen Ruangan & Jadwal</h1>
        <p className="page-subtitle">Daftar Inventaris Ruang<br />Kelola ketersediaan, status, dan atur jadwal perkuliahan SIAKAD.</p>
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
      {/* FITUR 1: Form Tambah Ruangan Baru (+ Opsional Jadwal) */}
      <div className="card-flat" style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Tambah Ruangan Baru</h3>
        <form onSubmit={handleAddRooms}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label className="form-label">Nama (Mis: Q.3.1)</label>
              <input type="text" className="input-field" name="nama" value={formData.nama} onChange={handleChange} required />
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label className="form-label">Kampus</label>
              <input type="text" className="input-field" name="kampus" value={formData.kampus} onChange={handleChange} required />
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <label className="form-label">Gedung</label>
              <input type="text" className="input-field" name="gedung" value={formData.gedung} onChange={handleChange} required />
            </div>
            <div style={{ flex: '1', minWidth: '80px' }}>
              <label className="form-label">Lantai</label>
              <input type="number" className="input-field" name="lantai" value={formData.lantai} onChange={handleChange} required />
            </div>
            <div style={{ flex: '1', minWidth: '100px' }}>
              <label className="form-label">Kapasitas</label>
              <input type="number" className="input-field" name="kapasitas" value={formData.kapasitas} onChange={handleChange} required />
            </div>
          </div>
          {/* CHECKBOX DENGAN FITUR TAMBAH JADWAL OPSIONAL */}
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
                    <label className="form-label">Prodi</label>
                    <select className="input-field" value={initialSched.prodi} onChange={(e) => setInitialSched({ ...initialSched, prodi: e.target.value })} required={addWithSchedule}>
                      <option value="">-- Pilih Prodi --</option>
                      <option value="Teknik Informatika">Teknik Informatika</option>
                      <option value="Sistem Informasi">Sistem Informasi</option>
                      <option value="Teknik Komputer">Teknik Komputer</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Semester</label>
                    <select className="input-field" value={initialSched.semester} onChange={(e) => setInitialSched({ ...initialSched, semester: e.target.value })} required={addWithSchedule}>
                      <option value="">-- Pilih --</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Kelas</label>
                    <select className="input-field" value={initialSched.kelas} onChange={(e) => setInitialSched({ ...initialSched, kelas: e.target.value })} required={addWithSchedule}>
                      <option value="">-- Pilih --</option>
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
                      <option value="">-- Pilih Hari --</option>
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
          <div>
            <button className="btn btn-primary" disabled={actionLoading} type="submit">Simpan Ruangan Baru</button>
          </div>
        </form>
      </div>
      {/* FITUR 2: Tabel Ruangan + Ubah Status + Kelola Jadwal */}
      <div className="card-flat" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Memuat ruangan...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px' }}>Nama</th>
                <th style={{ padding: '12px' }}>Lokasi</th>
                <th style={{ padding: '12px' }}>Kapasitas</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Ubah Status</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Kelola Jadwal</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{room.nama}</td>
                  <td style={{ padding: '12px' }}>{room.kampus} - {room.gedung} Lt.{room.lantai}</td>
                  <td style={{ padding: '12px' }}>{room.kapasitas} kursi</td>
                  <td style={{ padding: '12px' }}>
                    {room.status === 'tersedia' && <span className="badge badge-success">Tersedia</span>}
                    {room.status === 'terkunci' && <span className="badge badge-error">Terkunci</span>}
                    {room.status === 'perbaikan' && <span className="badge badge-warning">Perbaikan</span>}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select className="input-field"
                      style={{ padding: '4px 8px', height: 'auto', width: 'auto', display: 'inline-block' }}
                      value={room.status}
                      onChange={(e) => handleUppdateStatus(room.id, e.target.value)}
                      disabled={actionLoading}>
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
        )}
      </div>
      {/* FITUR 3: MODAL KELOLA JADWAL SIAKAD PER RUANGAN */}
      {selectedRoom && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card-flat" style={{ width: '100%', maxWidth: '680px', background: '#fff', padding: '24px', borderRadius: '12px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>📅 Jadwal SIAKAD Ruang {selectedRoom.nama}</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedRoom(null)}>Tutup</button>
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
                    <label className="form-label">Prodi</label>
                    <select className="input-field" value={schedForm.prodi} onChange={(e) => setSchedForm({ ...schedForm, prodi: e.target.value })} required>
                      <option value="Teknik Informatika">Teknik Informatika</option>
                      <option value="Sistem Informasi">Sistem Informasi</option>
                      <option value="Teknik Komputer">Teknik Komputer</option>
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
