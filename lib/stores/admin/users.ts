import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"
import type { UserRole } from "@/lib/types"

export interface AdminUser {
  id: number
  name: string
  email: string
  role: UserRole
  team_id: number | null
  team: { id: number; name: string } | null
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

export interface CreateUserParams {
  name: string
  email: string
  password: string
  role: UserRole
  team_id?: number
}

export interface UpdateUserParams {
  id: number
  name?: string
  email?: string
  role?: UserRole
  team_id?: number | null
}

export const fetchUsersFx = createEffect(async (): Promise<AdminUser[]> => {
  const { data } = await apiClient.get<{ data: AdminUser[] }>("/api/v1/admin/users")
  return data.data
})

export const createUserFx = createEffect(async (params: CreateUserParams): Promise<AdminUser> => {
  const { data } = await apiClient.post<{ data: AdminUser }>("/api/v1/admin/users", params)
  return data.data
})

export const updateUserFx = createEffect(async ({ id, ...params }: UpdateUserParams): Promise<AdminUser> => {
  const { data } = await apiClient.put<{ data: AdminUser }>(`/api/v1/admin/users/${id}`, params)
  return data.data
})

export const toggleUserActiveFx = createEffect(async (id: number): Promise<AdminUser> => {
  const { data } = await apiClient.patch<{ data: AdminUser }>(`/api/v1/admin/users/${id}/toggle-active`)
  return data.data
})

export const $users = createStore<AdminUser[]>([])
  .on(fetchUsersFx.doneData, (_, users) => users)
  .on(createUserFx.doneData, (users, user) => [...users, user])
  .on(updateUserFx.doneData, (users, updated) => users.map((u) => (u.id === updated.id ? updated : u)))
  .on(toggleUserActiveFx.doneData, (users, updated) => users.map((u) => (u.id === updated.id ? updated : u)))

export const $usersLoading = fetchUsersFx.pending
