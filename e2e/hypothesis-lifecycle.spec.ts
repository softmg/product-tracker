import { test, expect } from "@playwright/test"
import { loginAs, USERS } from "./setup"

test.describe("Hypothesis lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.admin.email, USERS.admin.password)
  })

  test("hypothesis list page loads", async ({ page }) => {
    await page.goto("/hypotheses")
    await expect(page.locator("h1")).toContainText("Гипотезы")
  })

  test("hypothesis list shows table or kanban view", async ({ page }) => {
    await page.goto("/hypotheses")
    // Either table or kanban should be visible
    const table = page.locator("table, [data-testid='kanban']")
    await expect(table.first()).toBeVisible({ timeout: 10000 })
  })

  test("can navigate to new hypothesis form", async ({ page }) => {
    await page.goto("/hypotheses")
    const newButton = page.locator("text=Новая гипотеза")
    await expect(newButton).toBeVisible()
    await newButton.click()
    await expect(page).toHaveURL(/.*hypotheses\/new/)
  })

  test("new hypothesis form has required fields", async ({ page }) => {
    await page.goto("/hypotheses/new")
    await expect(page.locator('input[name="title"]')).toBeVisible()
    await expect(page.locator('textarea[name="problem"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("hypothesis search filter works", async ({ page }) => {
    await page.goto("/hypotheses")
    const searchInput = page.locator('input[placeholder="Поиск гипотез..."]')
    await expect(searchInput).toBeVisible()
    await searchInput.fill("test search query")
    // Page should update (results may be 0 or not, but no crash)
    await page.waitForTimeout(500)
    await expect(page).not.toHaveURL(/.*error/)
  })
})
