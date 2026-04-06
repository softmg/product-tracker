"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User, UserRole } from './types'
import { mockUsers } from './mock-data'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchRole: (role: UserRole) => void
  hasPermission: (permission: Permission) => boolean
}

type Permission = 
  | 'hypothesis:create'
  | 'hypothesis:edit'
  | 'hypothesis:delete'
  | 'hypothesis:score'
  | 'hypothesis:change_status'
  | 'experiment:create'
  | 'experiment:edit'
  | 'experiment:delete'
  | 'admin:users'
  | 'admin:teams'
  | 'admin:settings'
  | 'admin:audit'

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'hypothesis:create',
    'hypothesis:edit',
    'hypothesis:delete',
    'hypothesis:score',
    'hypothesis:change_status',
    'experiment:create',
    'experiment:edit',
    'experiment:delete',
    'admin:users',
    'admin:teams',
    'admin:settings',
    'admin:audit',
  ],
  po: [
    'hypothesis:create',
    'hypothesis:edit',
    'hypothesis:score',
    'hypothesis:change_status',
    'experiment:create',
    'experiment:edit',
  ],
  viewer: [],
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    setIsLoading(true)
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mock login - find user by email
    const foundUser = mockUsers.find(u => u.email === email && u.isActive)
    
    if (foundUser) {
      setUser(foundUser)
      setIsLoading(false)
      return true
    }
    
    setIsLoading(false)
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const switchRole = useCallback((role: UserRole) => {
    if (user) {
      setUser({ ...user, role })
    }
  }, [user])

  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false
    return rolePermissions[user.role].includes(permission)
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        hasPermission,
      }}
    >
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

// Mock credentials for demo
export const mockCredentials = [
  { email: 'admin@company.com', password: 'admin123', role: 'admin' as const },
  { email: 'po@company.com', password: 'po123', role: 'po' as const },
  { email: 'viewer@company.com', password: 'viewer123', role: 'viewer' as const },
]
