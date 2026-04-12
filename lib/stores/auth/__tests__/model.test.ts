import { describe, it, expect, vi, beforeEach } from "vitest"
import { allSettled, fork } from "effector"
import { INVALID_AUTH_CREDENTIALS, TEST_USERS } from "@/lib/test-credentials"

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

describe("auth store env resolution", () => {
  const mockPost = vi.fn()
  const mockGet = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.doMock("@/lib/api-client", () => ({
      apiClient: { post: mockPost, get: mockGet },
    }))
  })

  it("uses mocks when NEXT_PUBLIC_USE_MOCKS=true", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true")
    vi.stubEnv("NEXT_PUBLIC_API_URL", "")

    vi.doMock("@/lib/mock-data", () => ({
      mockUsers: [
        {
          id: "user-1",
          email: "mock@company.com",
          name: "Mock User",
          role: "admin",
          teamId: "team-1",
          isActive: true,
          createdAt: "2026-04-06T00:00:00Z",
          lastLoginAt: null,
        },
      ],
    }))

    const { loginFx, isAuthMockMode } = await import("../model")
    const scope = fork()

    const result = await allSettled(loginFx, {
      scope,
      params: { email: "mock@company.com", password: TEST_USERS.admin.password }
    })

    expect(isAuthMockMode).toBe(true)
    expect(result.status).toBe("done")
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("uses API when NEXT_PUBLIC_USE_MOCKS=false and API URL exists", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false")
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000")

    vi.doMock("@/lib/mock-data", () => ({ mockUsers: [] }))
    mockPost.mockResolvedValueOnce({ data: { user: mockAuthUser } })

    const { loginFx, isAuthMockMode } = await import("../model")
    const scope = fork()

    const result = await allSettled(loginFx, {
      scope,
      params: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
    })

    expect(isAuthMockMode).toBe(false)
    expect(result.status).toBe("done")
    expect(mockPost).toHaveBeenCalledTimes(1)
  })

  it("throws when NEXT_PUBLIC_USE_MOCKS=false and API URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false")
    vi.stubEnv("NEXT_PUBLIC_API_URL", "")

    vi.doMock("@/lib/mock-data", () => ({ mockUsers: [] }))

    await expect(import("../model")).rejects.toThrow(
      "NEXT_PUBLIC_API_URL must be set when NEXT_PUBLIC_USE_MOCKS is false (auth store)",
    )
  })
})

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

    await allSettled(loginFx, {
      scope,
      params: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
    })

    expect(scope.getState($user)).toEqual(mockAuthUser)
    expect(scope.getState($isAuthenticated)).toBe(true)
  })

  it("loginFx leaves $user null when API returns error", async () => {
    mockPost.mockRejectedValueOnce(new Error("Unauthorized"))

    const { loginFx, $user, $isAuthenticated } = await import("../model")
    const scope = fork()

    await allSettled(loginFx, {
      scope,
      params: { email: INVALID_AUTH_CREDENTIALS.email, password: INVALID_AUTH_CREDENTIALS.password },
    })

    expect(scope.getState($user)).toBeNull()
    expect(scope.getState($isAuthenticated)).toBe(false)
  })

  it("logoutFx clears $user store", async () => {
    mockPost
      .mockResolvedValueOnce({ data: { user: mockAuthUser } })
      .mockResolvedValueOnce({})

    const { loginFx, logoutFx, $user, $isAuthenticated } = await import("../model")
    const scope = fork()

    await allSettled(loginFx, {
      scope,
      params: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
    })
    expect(scope.getState($user)).not.toBeNull()

    await allSettled(logoutFx, { scope, params: undefined })

    expect(scope.getState($user)).toBeNull()
    expect(scope.getState($isAuthenticated)).toBe(false)
  })

  it("resetAuth event clears $user store", async () => {
    mockPost.mockResolvedValueOnce({ data: { user: mockAuthUser } })

    const { loginFx, resetAuth, $user } = await import("../model")
    const scope = fork()

    await allSettled(loginFx, {
      scope,
      params: { email: TEST_USERS.admin.email, password: TEST_USERS.admin.password },
    })
    expect(scope.getState($user)).not.toBeNull()

    await allSettled(resetAuth, { scope, params: undefined })
    expect(scope.getState($user)).toBeNull()
  })
})
