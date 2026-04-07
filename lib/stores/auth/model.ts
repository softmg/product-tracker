import { combine, createEffect, createEvent, createStore } from "effector"
import { apiClient } from "@/lib/api-client"
import { mockUsers } from "@/lib/mock-data"
import type { AuthUser } from "@/lib/stores/auth/types"

type LoginParams = {
  email: string
  password: string
}

export const isAuthMockMode =
  process.env.NEXT_PUBLIC_USE_MOCKS === "true" || !process.env.NEXT_PUBLIC_API_URL

const parseMockId = (value: string, prefix: string): number | null => {
  if (!value.startsWith(prefix)) {
    return null
  }

  const parsed = Number.parseInt(value.slice(prefix.length), 10)

  return Number.isNaN(parsed) ? null : parsed
}

const mapMockUserToAuthUser = (user: (typeof mockUsers)[number]): AuthUser => ({
  id: parseMockId(user.id, "user-") ?? 0,
  email: user.email,
  name: user.name,
  role: user.role,
  team_id: parseMockId(user.teamId, "team-"),
  team: null,
  is_active: user.isActive,
  created_at: user.createdAt,
  last_login_at: user.lastLoginAt ?? null,
})

export const loginFx = createEffect(async ({ email, password }: LoginParams): Promise<AuthUser> => {
  if (isAuthMockMode) {
    await new Promise((resolve) => setTimeout(resolve, 300))

    const user = mockUsers.find((candidate) => candidate.email === email && candidate.isActive)

    if (!user || !password) {
      throw new Error("Invalid credentials")
    }

    return mapMockUserToAuthUser(user)
  }

  const { data } = await apiClient.post<{ user: AuthUser }>("/api/v1/auth/login", {
    email,
    password,
  })

  return data.user
})

export const logoutFx = createEffect(async (): Promise<void> => {
  if (isAuthMockMode) {
    return
  }

  await apiClient.post("/api/v1/auth/logout")
})

export const fetchMeFx = createEffect(async (): Promise<AuthUser> => {
  if (isAuthMockMode) {
    throw new Error("Mock mode has no persisted session")
  }

  const { data } = await apiClient.get<{ user: AuthUser }>("/api/v1/auth/me")

  return data.user
})

export const resetAuth = createEvent()
export const setUserRole = createEvent<AuthUser["role"]>()

export const $user = createStore<AuthUser | null>(null)
  .on(loginFx.doneData, (_, user) => user)
  .on(fetchMeFx.doneData, (_, user) => user)
  .on(logoutFx.done, () => null)
  .on(setUserRole, (user, role) => (user ? { ...user, role } : user))
  .reset(resetAuth)

export const $isAuthenticated = $user.map((user) => user !== null)
export const $isAuthLoading = combine(loginFx.pending, fetchMeFx.pending, (loginPending, fetchMePending) => {
  return loginPending || fetchMePending
})
