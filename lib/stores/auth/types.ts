import type { UserRole } from "@/lib/types"

export interface AuthTeam {
  id: number
  name: string
}

export interface AuthUser {
  id: number
  email: string
  name: string
  role: UserRole
  team_id: number | null
  team: AuthTeam | null
  is_active: boolean
  created_at: string
  last_login_at: string | null
}
