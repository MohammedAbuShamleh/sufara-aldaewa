import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from './api'

interface User {
  id: number
  name: string
  email?: string | null
  role?: string
  region?: string
  governorate?: string
  administrative_title?: string | null
  program_type?: string | null
  id_number?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<{ user: User; token: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    api.get('/user')
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem('token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (identifier: string, password: string) => {
    const payload = identifier.includes('@')
      ? { email: identifier.trim(), password }
      : { id_number: identifier.trim(), password }
    const response = await api.post('/login', payload)
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token)
      setUser(response.data.user)
      return response.data
    }
    throw new Error('Invalid response from server')
  }

  const logout = async () => {
    try {
      await api.post('/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
