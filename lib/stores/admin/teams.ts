import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"

export interface AdminTeam {
  id: number
  name: string
  description: string | null
  members_count: number
  created_at: string
}

export interface CreateTeamParams {
  name: string
  description?: string
}

export interface UpdateTeamParams {
  id: number
  name?: string
  description?: string
}

export const fetchTeamsFx = createEffect(async (): Promise<AdminTeam[]> => {
  const { data } = await apiClient.get<{ data: AdminTeam[] }>("/api/v1/admin/teams")
  return data.data
})

export const createTeamFx = createEffect(async (params: CreateTeamParams): Promise<AdminTeam> => {
  const { data } = await apiClient.post<{ data: AdminTeam }>("/api/v1/admin/teams", params)
  return data.data
})

export const updateTeamFx = createEffect(async ({ id, ...params }: UpdateTeamParams): Promise<AdminTeam> => {
  const { data } = await apiClient.put<{ data: AdminTeam }>(`/api/v1/admin/teams/${id}`, params)
  return data.data
})

export const deleteTeamFx = createEffect(async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/admin/teams/${id}`)
})

export const $teams = createStore<AdminTeam[]>([])
  .on(fetchTeamsFx.doneData, (_, teams) => teams)
  .on(createTeamFx.doneData, (teams, team) => [...teams, team])
  .on(updateTeamFx.doneData, (teams, updated) => teams.map((t) => (t.id === updated.id ? updated : t)))
  .on(deleteTeamFx.done, (teams, { params: id }) => teams.filter((t) => t.id !== id))

export const $teamsLoading = fetchTeamsFx.pending
