import type { UserRole } from "@/lib/types"

export interface ApiUserRef {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface ApiTeamRef {
  id: number
  name: string
}

export interface ApiHypothesisList {
  id: number
  code: string
  title: string
  status: string
  priority: "low" | "medium" | "high" | null
  initiator: ApiUserRef | null
  owner: ApiUserRef | null
  team: ApiTeamRef | null
  scoring_primary: number | null
  scoring_deep: number | null
  sla_deadline: string | null
  created_at: string
  updated_at: string
}

export interface ApiHypothesisDetail extends ApiHypothesisList {
  description: string | null
  problem: string | null
  solution: string | null
  target_audience: string | null
  initiator_id: number | null
  owner_id: number | null
  team_id: number | null
}

export interface ApiPaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export interface FetchHypothesesParams {
  status?: string
  search?: string
  team_id?: number
  page?: number
  per_page?: number
  sort_by?: string
  sort_dir?: "asc" | "desc"
}

export interface CreateHypothesisParams {
  title: string
  description?: string
  problem?: string
  solution?: string
  target_audience?: string
  team_id?: number
  priority?: "low" | "medium" | "high"
}

export interface UpdateHypothesisParams {
  id: number
  title?: string
  description?: string
  problem?: string
  solution?: string
  target_audience?: string
  team_id?: number
  priority?: "low" | "medium" | "high"
}

export interface TransitionHypothesisParams {
  id: number
  to_status: string
  comment?: string
}
