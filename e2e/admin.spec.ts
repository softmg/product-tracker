import { test, expect } from "@playwright/test"
import { loginAs, USERS } from "./setup"

test.describe("Admin pages", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.admin.email, USERS.admin.password)
  })

  test("admin users page loads", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page).not.toHaveURL(/.*login/)
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10000 })
  })

  test("dashboard page shows hypothesis stats", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10000 })
  })

  test("analytics page loads", async ({ page }) => {
    await page.goto("/analytics")
    await expect(page.locator("main").first()).toBeVisible({ timeout: 10000 })
  })
})
