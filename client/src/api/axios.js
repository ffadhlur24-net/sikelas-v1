import axios from 'axios'


// insatance axios khusus dengan URL backend
const api = axios.create({
    baseURL: 'http://localhost:5000/api', // URL Node.js Backend
    headers: {
        'Content-Type': 'application/json'
    }
})

// Interceptor: Menjalankan kode ini sebelum request dikirim keserver

api.interceptors.request.use((config) => {
    // Cek apakah ada token di LocalStorage (disimpan saat user login)
    const token = localStorage.getItem('sikelas_token');

    if (token) {
        // Jika ada, tampilkan pada Header Authorization
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
}, (error) => {
    return Promise.reject(error)
})

export default api