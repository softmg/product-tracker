import { expect, test, type Page, type Route } from "@playwright/test"

type TeamResponse = {
  id: number
  name: string
  description: string | null
  member_count: number
  hypotheses_count: number
  created_at: string
}

const adminUser = {
  id: 1,
  email: "admin@company.com",
  name: "Alexey Ivanov",
  role: "admin",
  team_id: 1,
  team: { id: 1, name: "Product" },
  is_active: true,
  sso_provider: null,
  sso_subject: null,
  created_at: "2026-05-15T00:00:00.000Z",
  last_login_at: null,
  sso_last_login_at: null,
}

const fulfillJson = async (route: Route, status: number, body: unknown) => {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  })
}

const mockApi = async (page: Page) => {
  const teams: TeamResponse[] = [
    {
      id: 1,
      name: "Product",
      description: "Existing product team",
      member_count: 0,
      hypotheses_count: 0,
      created_at: "2026-05-14T00:00:00.000Z",
    },
  ]

  await page.route("**/sanctum/csrf-cookie", (route) => route.fulfill({ status: 204 }))

  await page.route("**/api/v1/setup/status", (route) => fulfillJson(route, 200, { needs_setup: false }))
  await page.route("**/api/v1/auth/login", (route) => fulfillJson(route, 200, { user: adminUser }))
  await page.route("**/api/v1/auth/me", (route) => fulfillJson(route, 200, { user: adminUser }))

  await page.route("**/api/v1/teams", (route) => {
    return fulfillJson(route, 404, { message: "The route api/v1/teams could not be found." })
  })

  await page.route("**/api/v1/admin/teams", async (route, request) => {
    if (request.method() === "POST") {
      const payload = request.postDataJSON() as { name: string; description?: string | null }
      const team: TeamResponse = {
        id: teams.length + 1,
        name: payload.name,
        description: payload.description ?? null,
        member_count: 0,
        hypotheses_count: 0,
        created_at: "2026-05-15T00:00:00.000Z",
      }

      teams.push(team)
      await fulfillJson(route, 201, { data: team })
      return
    }

    await fulfillJson(route, 200, { data: teams })
  })

  await page.route("**/api/v1/hypotheses**", (route, request) => {
    if (request.method() !== "GET") {
      return route.continue()
    }

    return fulfillJson(route, 200, {
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 0,
        total: 0,
        from: null,
        to: null,
      },
    })
  })
}

test.describe("Hypothesis team selector", () => {
  test("can select an admin-created team when the public teams route is stale", async ({ page }) => {
    await mockApi(page)

    await page.goto("/login")
    await page.getByLabel("Email").fill(adminUser.email)
    await page.locator("#password").fill("password")
    await page.getByRole("button", { name: "Войти" }).click()
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 10000 })

    const teamName = `Discovery QA ${Date.now()}`

    await page.goto("/admin/teams")
    await expect(page.getByText("Product", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Add Team" }).click()
    await page.getByLabel("Name").fill(teamName)
    await page.getByLabel("Description").fill("Created from the teams admin page")
    await page.getByRole("button", { name: "Create Team" }).click()
    await expect(page.getByText(teamName, { exact: true })).toBeVisible()

    await page.goto("/hypotheses/new")
    await expect(page.getByRole("heading", { name: "Создать гипотезу" })).toBeVisible()

    const teamSelect = page.getByLabel("Команда *")

    await teamSelect.click()
    await page.getByRole("option", { name: teamName }).click()
    await expect(teamSelect).toContainText(teamName)
  })
})
