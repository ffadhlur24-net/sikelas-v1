import { createContext, useState, useEffect } from "react";

// 1. Buay Context
export const AuthContext = createContext();

// 2. Buat Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Effek ini berjalan sekali saat website pertama kali dibuka
    useEffect(() => {
        // Cet data user di LocalStorage
        const storedUser = localStorage.getItem('sikelas_user')
        const storedToken = localStorage.getItem('sikelas_token')

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser)) // Pulihkan data user
        }

        setLoading(false);
    }, [])

    // Fungsi Login (dipanggil setelah sukses dari API)
    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('sikelas_user', JSON.stringify(userData))
        localStorage.setItem('sikelas_token', token)
    }
    // Fungsi Logout
    const logout = () => {
        setUser(null);
        localStorage.removeItem('sikelas_user');
        localStorage.removeItem('sikelas_token');
    }

    // Fungsi Update User (digunakan saat edit profil)
    const updateUser = (updatedUserData) => {
        const newUserData = { ...user, ...updatedUserData }
        setUser(newUserData);
        localStorage.setItem('sikelas_user', JSON.stringify(newUserData))
    }

    // Data yang akan dibagikan ke seluruh komponen
    const contextValue = {
        user,
        login,
        logout,
        updateUser,
        loading
    }
    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    )
}