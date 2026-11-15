import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken } from './api'
import type { User } from './types'

interface AuthState {
  user: User | null
  loading: boolean // true while we check a stored token with the server
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => getToken() !== null)

  // On page load, restore the session from the stored token (if any).
  useEffect(() => {
    if (!getToken()) return
    api<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setToken(null)) // expired or revoked token
      .finally(() => setLoading(false))
  }, [])

  async function authenticate(path: string, body: object) {
    const r = await api<{ user: User; token: string }>(path, { method: 'POST', body })
    setToken(r.token)
    setUser(r.user)
  }

  const value: AuthState = {
    user,
    loading,
    login: (email, password) => authenticate('/auth/login', { email, password }),
    register: (name, email, password) => authenticate('/auth/register', { name, email, password }),
    logout: async () => {
      try {
        await api('/auth/logout', { method: 'POST' })
      } catch {
        // even if the server call fails we still sign out locally
      }
      setToken(null)
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
