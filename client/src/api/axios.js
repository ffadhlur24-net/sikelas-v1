import axios from 'axios'

// Instance axios khusus dengan URL backend
const api = axios.create({
    baseURL: 'http://127.0.0.1:5000/api', // URL Node.js Backend IPv4 Presisi
    headers: {
        'Content-Type': 'application/json'
    }
})

// Interceptor Request: Menambahkan Header Authorization (Bearer Token)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('sikelas_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}, (error) => {
    return Promise.reject(error)
})

// Interceptor Response: Mencegat status 401 Unauthorized (Token Sesi Expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('⚠️ Sesi login telah berakhir. Menghapus token & redirect ke login...')
            localStorage.removeItem('sikelas_token')
            localStorage.removeItem('sikelas_user')
            
            if (window.location.pathname !== '/login') {
                window.location.href = '/login?expired=true'
            }
        }
        return Promise.reject(error)
    }
)

export default api