// Gold Standard: Frontend API DTOs mirror backend payload shape instead of UI-friendly renaming
// Pay attention to: snake_case keys, explicit nullability, separate list/detail params, typed sort/filter params

import type { UserRole } from "@/lib/types"

export interface ApiUserRef {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface ApiHypothesisList {
  id: number
  code: string
  title: string
  status: string
  priority: "low" | "medium" | "high" | null
  initiator: ApiUserRef | null
  owner: ApiUserRef | null
  sla_deadline: string | null
  created_at: string
  updated_at: string
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
