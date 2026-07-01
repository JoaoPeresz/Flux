'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { User } from '@/types'
import { userApi } from '@/services/api'

interface UserContextValue {
  users: User[]
  activeUser: User | null
  setActiveUser: (user: User) => void
  loading: boolean
  refetch: () => void
  logout: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [activeUser, setActiveUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [slowLoading, setSlowLoading] = useState(false)

  const fetchUsers = async () => {
    try {
      const data = await userApi.list()
      setUsers(data)
      const savedId = localStorage.getItem('flux_active_user')
      if (savedId) {
        const found = data.find(u => u.id === savedId)
        if (found) setActiveUserState(found)
      }
    } catch (err) {
      console.error('Failed to fetch users', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchUsers()
  }, [])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (loading) {
      timeout = setTimeout(() => setSlowLoading(true), 4000)
    }
    return () => clearTimeout(timeout)
  }, [loading])

  const setActiveUser = (user: User) => {
    setActiveUserState(user)
    localStorage.setItem('flux_active_user', user.id)
  }

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !activeUser && pathname !== '/login' && pathname !== '/register') {
      router.push('/login')
    }
  }, [loading, activeUser, pathname, router])

  const logout = () => {
    setActiveUserState(null)
    localStorage.removeItem('flux_active_user')
  }

  const isAuthRoute = pathname === '/login' || pathname === '/register'
  
  if (loading && !isAuthRoute) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        <div style={{ marginBottom: '16px' }}>Carregando...</div>
        {slowLoading && (
          <div style={{ fontSize: '13px', maxWidth: '400px', color: 'var(--color-warning)', background: 'var(--color-warning-bg)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
            ⏳ <strong>O servidor está acordando...</strong><br />
            Como a API está hospedada em um plano gratuito (Render), o primeiro acesso do dia pode levar até 1 minuto. Aguarde!
          </div>
        )}
      </div>
    )
  }

  if (!loading && !activeUser && !isAuthRoute) {
    return null // aguarda o redirect do useEffect
  }

  return (
    <UserContext.Provider value={{ users, activeUser, setActiveUser, loading, refetch: fetchUsers, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside UserProvider')
  return ctx
}
