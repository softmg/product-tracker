import { describe, it, expect, vi, beforeEach } from "vitest"
import { allSettled, fork } from "effector"

const mockAuthUser = {
  id: 1,
  email: "admin@company.com",
  name: "Admin User",
  role: "admin" as const,
  team_id: 1,
  team: { id: 1, name: "Growth" },
  is_active: true,
  created_at: "2026-04-06T00:00:00Z",
  last_login_at: null,
}

describe("auth store (real API mode)", () => {
  const mockPost = vi.fn()
  const mockGet = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Stub env before module loads so isAuthMockMode evaluates to false
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false")

    vi.doMock("@/lib/api-client", () => ({
      apiClient: { post: mockPost, get: mockGet },
    }))

    vi.doMock("@/lib/mock-data", () => ({ mockUsers: [] }))
  })

  it("loginFx sets user in $user store on success", async () => {
    mockPost.mockResolvedValueOnce({ data: { user: mockAuthUser } })

    const { loginFx, $user, $isAuthenticated } = await import("../model")
    const scope = fork()

    await allSettled(loginFx, { scope, params: { email: "admin@company.com", password: "password" } })

    expect(scope.getState($user)).toEqual(mockAuthUser)
    expect(scope.getState($isAuthenticated)).toBe(true)
  })

  it("loginFx leaves $user null when API returns error", async () => {
    mockPost.mockRejectedValueOnce(new Error("Unauthorized"))

    const { loginFx, $user, $isAuthenticated } = await import("../model")
    const scope = fork()

    await allSettled(loginFx, { scope, params: { email: "bad@example.com", password: "wrong" } })

    expect(scope.getState($user)).toBeNull()
    expect(scope.getState($isAuthenticated)).toBe(false)
  })

  it("logoutFx clears $user store", async () => {
    mockPost
      .mockResolvedValueOnce({ data: { user: mockAuthUser } })
      .mockResolvedValueOnce({})

    const { loginFx, logoutFx, $user, $isAuthenticated } = await import("../model")
    const scope = fork()

    await allSettled(loginFx, { scope, params: { email: "admin@company.com", password: "password" } })
    expect(scope.getState($user)).not.toBeNull()

    await allSettled(logoutFx, { scope, params: undefined })

    expect(scope.getState($user)).toBeNull()
    expect(scope.getState($isAuthenticated)).toBe(false)
  })

  it("resetAuth event clears $user store", async () => {
    mockPost.mockResolvedValueOnce({ data: { user: mockAuthUser } })

    const { loginFx, resetAuth, $user } = await import("../model")
    const scope = fork()

    await allSettled(loginFx, { scope, params: { email: "admin@company.com", password: "password" } })
    expect(scope.getState($user)).not.toBeNull()

    await allSettled(resetAuth, { scope, params: undefined })
    expect(scope.getState($user)).toBeNull()
  })
})
