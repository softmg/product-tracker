"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useUnit } from "effector-react"
import type { User, UserRole } from "./types"
import { loginFx, logoutFx, fetchMeFx, restoreMockSessionFx, $user, $isAuthenticated, $isAuthLoading, isAuthMockMode, setUserRole } from "@/lib/stores/auth/model"
import type { AuthUser } from "@/lib/stores/auth/types"

type Permission =
  | "hypothesis:create"
  | "hypothesis:edit"
  | "hypothesis:delete"
  | "hypothesis:score"
  | "hypothesis:change_status"
  | "experiment:create"
  | "experiment:edit"
  | "experiment:delete"
  | "admin:users"
  | "admin:teams"
  | "admin:settings"
  | "admin:audit"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchRole: (role: UserRole) => void
  hasPermission: (permission: Permission) => boolean
}

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    "hypothesis:create",
    "hypothesis:edit",
    "hypothesis:delete",
    "hypothesis:score",
    "hypothesis:change_status",
    "experiment:create",
    "experiment:edit",
    "experiment:delete",
    "admin:users",
    "admin:teams",
    "admin:settings",
    "admin:audit",
  ],
  initiator: ["hypothesis:create"],
  pd_manager: [
    "hypothesis:create",
    "hypothesis:edit",
    "hypothesis:score",
    "hypothesis:change_status",
    "experiment:create",
    "experiment:edit",
  ],
  analyst: ["hypothesis:score", "experiment:create", "experiment:edit"],
  tech_lead: ["hypothesis:edit", "experiment:create", "experiment:edit"],
  bizdev: ["hypothesis:edit", "experiment:create", "experiment:edit"],
  committee: ["hypothesis:change_status"],
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const mapAuthUserToUser = (authUser: AuthUser): User => ({
  id: `user-${authUser.id}`,
  email: authUser.email,
  name: authUser.name,
  role: authUser.role,
  teamId: authUser.team_id ? `team-${authUser.team_id}` : "team-1",
  isActive: authUser.is_active,
  createdAt: authUser.created_at,
  lastLoginAt: authUser.last_login_at ?? undefined,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, isAuthenticated, isLoading, doLogin, doLogout, doFetchMe, doRestoreMockSession, updateRole] =
    useUnit([$user, $isAuthenticated, $isAuthLoading, loginFx, logoutFx, fetchMeFx, restoreMockSessionFx, setUserRole])
  const [isSessionCheckDone, setIsSessionCheckDone] = useState(false)

  useEffect(() => {
    if (authUser || isSessionCheckDone) {
      return
    }

    if (isAuthMockMode) {
      void doRestoreMockSession()
        .catch(() => {
          // no stored session — user needs to log in
        })
        .finally(() => {
          setIsSessionCheckDone(true)
        })
      return
    }

    void doFetchMe()
      .catch(() => {
        // handled by store + layout redirect
      })
      .finally(() => {
        setIsSessionCheckDone(true)
      })
  }, [authUser, doFetchMe, doRestoreMockSession, isSessionCheckDone])

  useEffect(() => {
    if (authUser && !isSessionCheckDone) {
      setIsSessionCheckDone(true)
    }
  }, [authUser, isSessionCheckDone])

  const effectiveLoading = isLoading || (!isSessionCheckDone && !authUser)

  const user = useMemo(() => (authUser ? mapAuthUserToUser(authUser) : null), [authUser])

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        await doLogin({ email, password })
        return true
      } catch {
        return false
      }
    },
    [doLogin]
  )

  const logout = useCallback(() => {
    setIsSessionCheckDone(false)
    void doLogout()
  }, [doLogout])

  const switchRole = useCallback(
    (role: UserRole) => {
      updateRole(role)
    },
    [updateRole]
  )

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) {
        return false
      }

      return rolePermissions[user.role].includes(permission)
    },
    [user]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading: effectiveLoading,
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
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}

