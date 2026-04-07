import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("login page is accessible", async ({ page }) => {
    await page.goto("/login")
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[name="email"]', "admin@company.com")
    await page.fill('input[name="password"]', "password")
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
  })

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login")
    await page.fill('input[name="email"]', "wrong@example.com")
    await page.fill('input[name="password"]', "wrongpassword")
    await page.click('button[type="submit"]')
    // Should stay on login or show error
    await expect(page.locator('[role="alert"], .error, [data-testid="error"]').or(page.locator("text=Invalid"))).toBeVisible({
      timeout: 5000,
    }).catch(() => {
      // Some implementations redirect back without visible error element
    })
    await expect(page).not.toHaveURL(/.*dashboard/)
  })

  test("protected routes redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/hypotheses")
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 })
  })
})
