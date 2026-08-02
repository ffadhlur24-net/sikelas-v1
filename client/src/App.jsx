import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import HalamanLogin from './pages/HalamanLogin'
import DashboardPJ from './pages/DashboardPJ'
import DashboardAdmin from './pages/DashboardAdmin'
import ProtectedRoute from './components/ProtectedRoute'
import Register from './pages/auth/Register'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<HalamanLogin />} />
        <Route path='/register' element={<Register />} />

        {/* PJ Routes */}
        <Route path="/pj/*"
          element={
            <ProtectedRoute allowedRole="pj">
              <DashboardPJ />
            </ProtectedRoute>
          } />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRole="admin">
              <DashboardAdmin />
            </ProtectedRoute>
          } />
      </Routes>
    </Router>
  )
}

export default App
