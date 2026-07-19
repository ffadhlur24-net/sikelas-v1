import { useContext } from "react";
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'


function ProtectedRoute({ children, allowedRole }) {
    const { user } = useContext(AuthContext)

    // 1. Jika belum login sama sekali, usir ke halaman login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // 2. Jika sidah login, tapi Rolenya ngaco
    if (allowedRole && user.role !== allowedRole) {
        // Arahkan ke habitat asal
        if (user.role === 'admin') {
            return <Navigate to="/admin/profil" replace />
        } else {
            return <Navigate to="/pj/profil" replace />
        }
    }

    // 3. Jika manut, langusung masuk
    return children
}

export default ProtectedRoute