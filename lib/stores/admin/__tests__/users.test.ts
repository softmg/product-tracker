import { describe, it, expect, vi, beforeEach } from "vitest"
import { allSettled, fork } from "effector"

const mockUser = {
  id: 1,
  name: "Alice",
  email: "alice@company.com",
  role: "initiator" as const,
  team_id: null,
  team: null,
  is_active: true,
  created_at: "2026-04-06T00:00:00Z",
  last_login_at: null,
}

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockPatch = vi.fn()

describe("admin users store", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.doMock("@/lib/api-client", () => ({
      apiClient: { get: mockGet, post: mockPost, put: mockPut, patch: mockPatch, delete: vi.fn() },
    }))
  })

  it("fetchUsersFx populates $users store", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockUser] } })

    const { fetchUsersFx, $users } = await import("../users")
    const scope = fork()

    await allSettled(fetchUsersFx, { scope })

    expect(scope.getState($users)).toHaveLength(1)
    expect(scope.getState($users)[0].email).toBe("alice@company.com")
  })

  it("createUserFx appends new user to $users", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockUser] } })
    const newUser = { ...mockUser, id: 2, name: "Bob", email: "bob@company.com" }
    mockPost.mockResolvedValueOnce({ data: { data: newUser } })

    const { fetchUsersFx, createUserFx, $users } = await import("../users")
    const scope = fork()

    await allSettled(fetchUsersFx, { scope })
    await allSettled(createUserFx, {
      scope,
      params: { name: "Bob", email: "bob@company.com", password: "secret", role: "initiator" },
    })

    expect(scope.getState($users)).toHaveLength(2)
    expect(scope.getState($users)[1].email).toBe("bob@company.com")
  })

  it("updateUserFx replaces updated user in $users", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockUser] } })
    const updated = { ...mockUser, name: "Alice Updated" }
    mockPut.mockResolvedValueOnce({ data: { data: updated } })

    const { fetchUsersFx, updateUserFx, $users } = await import("../users")
    const scope = fork()

    await allSettled(fetchUsersFx, { scope })
    await allSettled(updateUserFx, { scope, params: { id: 1, name: "Alice Updated" } })

    expect(scope.getState($users)[0].name).toBe("Alice Updated")
  })

  it("toggleUserActiveFx updates is_active flag", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockUser] } })
    const deactivated = { ...mockUser, is_active: false }
    mockPatch.mockResolvedValueOnce({ data: { data: deactivated } })

    const { fetchUsersFx, toggleUserActiveFx, $users } = await import("../users")
    const scope = fork()

    await allSettled(fetchUsersFx, { scope })
    await allSettled(toggleUserActiveFx, { scope, params: 1 })

    expect(scope.getState($users)[0].is_active).toBe(false)
  })
})
