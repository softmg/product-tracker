import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("login page is accessible", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator("#email")).toBeVisible()
    await expect(page.locator("#password")).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login")
    await page.fill("#email", "admin@company.com")
    await page.fill("#password", "password")
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 })
  })

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login")
    await page.fill("#email", "wrong@example.com")
    await page.fill("#password", "wrongpassword")
    await page.click('button[type="submit"]')
    await expect(page).not.toHaveURL(/.*dashboard/, { timeout: 5000 })
    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 })
  })

  test("protected routes redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/hypotheses")
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 })
  })
})
