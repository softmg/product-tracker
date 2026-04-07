import { Page } from "@playwright/test"

export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login")
  await page.fill("#email", email)
  await page.fill("#password", password)
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard", { timeout: 15000 })
}

export const USERS = {
  admin: { email: "admin@company.com", password: "password" },
  initiator: { email: "viewer@company.com", password: "password" },
  pdManager: { email: "po@company.com", password: "password" },
}
