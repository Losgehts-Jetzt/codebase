import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Persist session across browser restarts (remember me by default)
    setPersistence(auth, browserLocalPersistence).catch(() => {})

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email: string, password: string) => {
    await setPersistence(auth, browserLocalPersistence)
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = () => signOut(auth)

  const resetPassword = (email: string) =>
    sendPasswordResetEmail(auth, email)

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
