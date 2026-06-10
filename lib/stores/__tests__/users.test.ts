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
}

const mockGet = vi.fn()

describe("user options store", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.doMock("@/lib/api-client", () => ({
      apiClient: { get: mockGet },
    }))
  })

  it("fetchUserOptionsFx populates $userOptions store", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockUser] } })

    const { fetchUserOptionsFx, $userOptions } = await import("../users")
    const scope = fork()

    await allSettled(fetchUserOptionsFx, { scope })

    expect(mockGet).toHaveBeenCalledWith("/api/v1/users")
    expect(scope.getState($userOptions)).toHaveLength(1)
    expect(scope.getState($userOptions)[0].email).toBe("alice@company.com")
  })
})
