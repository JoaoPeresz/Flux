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

  useEffect(() => { fetchUsers() }, [])

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
