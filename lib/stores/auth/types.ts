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
  roles: UserRole[]
  team_id: number | null
  team: AuthTeam | null
  is_active: boolean
  sso_provider: string | null
  sso_subject: string | null
  created_at: string
  last_login_at: string | null
  sso_last_login_at: string | null
}
