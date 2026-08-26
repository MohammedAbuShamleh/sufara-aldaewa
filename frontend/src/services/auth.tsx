import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
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
  // القرار تجاه النسخة الحالية من عقد الكفالة (يأتي من /login و /user)
  contract_decision?: 'agreed' | 'declined' | 'pending'
  contract_agreed?: boolean
  contract_responded_at?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<{ user: User; token: string }>
  logout: () => void
  /** تحديث قرار العقد محلياً بعد توثيق الرد، دون إعادة جلب المستخدم. */
  setContractDecision: (decision: 'agreed' | 'declined', respondedAt?: string | null) => void
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

  const setContractDecision = useCallback(
    (decision: 'agreed' | 'declined', respondedAt?: string | null) => {
      setUser((current) => {
        if (!current || current.contract_decision === decision) return current
        return {
          ...current,
          contract_decision: decision,
          contract_agreed: decision === 'agreed',
          contract_responded_at: respondedAt ?? new Date().toISOString(),
        }
      })
    },
    [],
  )

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
    <AuthContext.Provider value={{ user, loading, login, logout, setContractDecision }}>
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
