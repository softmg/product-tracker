import { Page } from "@playwright/test"
import { TEST_USERS } from "../lib/test-credentials"
import type { UserRole } from "../lib/types"
import type { AuthUser } from "../lib/stores/auth/types"

export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login")
  await page.fill("#email", email)
  await page.fill("#password", password)
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard", { timeout: 15000 })
}

export const USERS = TEST_USERS

export async function mockSessionAs(page: Page, role: UserRole): Promise<void> {
  const session: AuthUser = {
    id: role === "admin" ? 1 : role === "pd_manager" ? 2 : role === "initiator" ? 3 : 100,
    email: `${role}@company.test`,
    name: `Test ${role}`,
    role,
    team_id: 2,
    team: null,
    is_active: true,
    sso_provider: null,
    sso_subject: null,
    created_at: "2026-05-14T00:00:00.000Z",
    last_login_at: null,
    sso_last_login_at: null,
  }

  await page.addInitScript((mockSession) => {
    window.localStorage.setItem("mock_session", JSON.stringify(mockSession))
  }, session)
}
