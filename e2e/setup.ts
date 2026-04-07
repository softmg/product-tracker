import { Page } from "@playwright/test"

export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login")
  await page.fill('[name="email"]', email)
  await page.fill('[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard", { timeout: 10000 })
}

export const USERS = {
  admin: { email: "admin@company.com", password: "password" },
  initiator: { email: "initiator@company.com", password: "password" },
  pdManager: { email: "pd@company.com", password: "password" },
}
