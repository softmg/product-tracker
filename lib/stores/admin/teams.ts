import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"
import { mockTeams } from "@/lib/mock-data"

export interface AdminTeam {
  id: number
  name: string
  description: string | null
  member_count: number
  hypotheses_count: number
  created_at: string
}

export interface CreateTeamParams {
  name: string
  description?: string | null
}

export interface UpdateTeamParams {
  id: number
  name?: string
  description?: string | null
}

const useTeamMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true"

const parseMockTeamId = (id: string): number => {
  const parsed = Number.parseInt(id.replace("team-", ""), 10)

  return Number.isNaN(parsed) ? 0 : parsed
}

const MOCK_ADMIN_TEAMS_KEY = "mock_admin_teams"

const initialMockAdminTeams: AdminTeam[] = mockTeams.map((team) => ({
  id: parseMockTeamId(team.id),
  name: team.name,
  description: team.description ?? null,
  member_count: team.memberCount,
  hypotheses_count: 0,
  created_at: new Date(team.createdAt).toISOString(),
}))

let mockAdminTeams: AdminTeam[] = [...initialMockAdminTeams]

const isAdminTeam = (value: unknown): value is AdminTeam => {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const team = value as Partial<AdminTeam>

  return (
    typeof team.id === "number" &&
    typeof team.name === "string" &&
    (typeof team.description === "string" || team.description === null) &&
    typeof team.member_count === "number" &&
    typeof team.hypotheses_count === "number" &&
    typeof team.created_at === "string"
  )
}

const readMockAdminTeams = (): AdminTeam[] => {
  if (typeof window === "undefined") {
    return [...mockAdminTeams]
  }

  const raw = window.localStorage.getItem(MOCK_ADMIN_TEAMS_KEY)

  if (!raw) {
    return [...mockAdminTeams]
  }

  try {
    const parsed = JSON.parse(raw) as unknown

    if (!Array.isArray(parsed) || !parsed.every(isAdminTeam)) {
      return [...mockAdminTeams]
    }

    mockAdminTeams = parsed
    return [...mockAdminTeams]
  } catch {
    return [...mockAdminTeams]
  }
}

const writeMockAdminTeams = (teams: AdminTeam[]) => {
  mockAdminTeams = [...teams]

  if (typeof window !== "undefined") {
    window.localStorage.setItem(MOCK_ADMIN_TEAMS_KEY, JSON.stringify(mockAdminTeams))
  }
}

const hasResponseStatus = (error: unknown, status: number): boolean => {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return false
  }

  const response = (error as { response?: { status?: number } }).response

  return response?.status === status
}

export const fetchTeamsFx = createEffect(async (): Promise<AdminTeam[]> => {
  if (useTeamMocks) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    return readMockAdminTeams()
  }

  try {
    const { data } = await apiClient.get<{ data: AdminTeam[] }>("/api/v1/teams")
    return data.data
  } catch (error: unknown) {
    if (!hasResponseStatus(error, 404)) {
      throw error
    }
  }

  const { data } = await apiClient.get<{ data: AdminTeam[] }>("/api/v1/admin/teams")
  return data.data
})

export const createTeamFx = createEffect(async (params: CreateTeamParams): Promise<AdminTeam> => {
  if (useTeamMocks) {
    await new Promise((resolve) => setTimeout(resolve, 100))

    const teams = readMockAdminTeams()
    const nextId = Math.max(0, ...teams.map((team) => team.id)) + 1
    const team: AdminTeam = {
      id: nextId,
      name: params.name,
      description: params.description ?? null,
      member_count: 0,
      hypotheses_count: 0,
      created_at: new Date().toISOString(),
    }

    writeMockAdminTeams([...teams, team])
    return team
  }

  const { data } = await apiClient.post<{ data: AdminTeam }>("/api/v1/admin/teams", params)
  return data.data
})

export const updateTeamFx = createEffect(async ({ id, ...params }: UpdateTeamParams): Promise<AdminTeam> => {
  if (useTeamMocks) {
    await new Promise((resolve) => setTimeout(resolve, 100))

    const teams = readMockAdminTeams()
    const index = teams.findIndex((team) => team.id === id)

    if (index === -1) {
      throw new Error(`Team ${id} not found`)
    }

    const updated: AdminTeam = {
      ...teams[index],
      name: params.name ?? teams[index].name,
      description: params.description === undefined ? teams[index].description : params.description,
    }

    writeMockAdminTeams(teams.map((team) => (team.id === id ? updated : team)))
    return updated
  }

  const { data } = await apiClient.put<{ data: AdminTeam }>(`/api/v1/admin/teams/${id}`, params)
  return data.data
})

export const deleteTeamFx = createEffect(async (id: number): Promise<void> => {
  if (useTeamMocks) {
    await new Promise((resolve) => setTimeout(resolve, 100))

    writeMockAdminTeams(readMockAdminTeams().filter((team) => team.id !== id))

    return
  }

  await apiClient.delete(`/api/v1/admin/teams/${id}`)
})

export const $teams = createStore<AdminTeam[]>([])
  .on(fetchTeamsFx.doneData, (_, teams) => teams)
  .on(createTeamFx.doneData, (teams, team) => [...teams, team])
  .on(updateTeamFx.doneData, (teams, updated) => teams.map((t) => (t.id === updated.id ? updated : t)))
  .on(deleteTeamFx.done, (teams, { params: id }) => teams.filter((t) => t.id !== id))

export const $teamsLoading = fetchTeamsFx.pending
