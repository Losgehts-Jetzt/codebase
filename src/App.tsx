import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginScreen from './screens/LoginScreen'
import Home from './screens/Home'
import MathScreen from './screens/MathScreen'
import LanguageScreen from './screens/LanguageScreen'
import StoriesScreen from './screens/StoriesScreen'

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/" replace /> : <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/math" element={<PrivateRoute><MathScreen /></PrivateRoute>} />
          <Route path="/language" element={<PrivateRoute><LanguageScreen /></PrivateRoute>} />
          <Route path="/stories" element={<PrivateRoute><StoriesScreen /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
