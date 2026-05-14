import { test, expect } from "@playwright/test"
import { loginAs, mockSessionAs, USERS } from "./setup"
import type { UserRole } from "../lib/types"

const idea = {
  problem:
    "Идеи, скоринг, deep dive и решения продуктового комитета ведутся в разных местах, поэтому команда теряет статус, SLA и артефакты.",
  solution:
    "Мы верим, что единая воронка Product Tracker для идей, скоринга, исследований, экспериментов и решений ПК ускорит проверку гипотез.",
  assumptions:
    "Инициаторы готовы описывать идеи структурно; PD-менеджеры будут вести статус; комитету нужен единый паспорт перед Go/No-Go.",
  audience: "Продуктовые команды организаций: инициаторы, PD-менеджеры, аналитики, tech lead, bizdev и продуктовый комитет.",
}

const rolesWithCreatePermission: UserRole[] = ["admin", "initiator", "pd_manager"]
const rolesWithoutCreatePermission: UserRole[] = ["analyst", "tech_lead", "bizdev", "committee"]

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

  test("can create Product Tracker idea for creator roles", async ({ browser }) => {
    for (const role of rolesWithCreatePermission) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await mockSessionAs(page, role)

      const title = `Product Tracker as idea (${role})`
      await page.goto("/hypotheses/new")
      await expect(page.getByRole("heading", { name: "Создать гипотезу" })).toBeVisible()
      await page.fill("#title", title)
      await page.fill("#problem", idea.problem)
      await page.fill("#solution", idea.solution)
      await page.fill("#assumptions", idea.assumptions)
      await page.fill("#audience", idea.audience)
      await page.getByRole("button", { name: "Создать гипотезу" }).click()

      await expect(page).toHaveURL(/\/hypotheses\/\d+$/, { timeout: 10000 })
      await expect(page.getByRole("heading", { name: title })).toBeVisible({ timeout: 10000 })
      await context.close()
    }
  })

  test("blocks new idea form for non-creator roles", async ({ browser }) => {
    for (const role of rolesWithoutCreatePermission) {
      const context = await browser.newContext()
      const page = await context.newPage()
      await mockSessionAs(page, role)

      await page.goto("/hypotheses/new")
      await expect(page).toHaveURL(/\/hypotheses$/, { timeout: 10000 })
      await expect(page.getByRole("heading", { name: "Гипотезы" })).toBeVisible()
      await expect(page.getByRole("link", { name: /Новая гипотеза/ })).toHaveCount(0)
      await context.close()
    }
  })
})
