import { Page } from "@playwright/test"
import { TEST_USERS } from "../lib/test-credentials"

export async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login")
  await page.fill("#email", email)
  await page.fill("#password", password)
  await page.click('button[type="submit"]')
  await page.waitForURL("**/dashboard", { timeout: 15000 })
}

export const USERS = TEST_USERS
