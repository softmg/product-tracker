import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"
import { allSettled, fork } from "effector"

const mockTeam = {
  id: 1,
  name: "Research",
  description: "Research team",
  member_count: 2,
  hypotheses_count: 3,
  created_at: "2026-04-06T00:00:00Z",
}

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDelete = vi.fn()
const originalUseMocks = process.env.NEXT_PUBLIC_USE_MOCKS

describe("admin teams store", () => {
  beforeEach(async () => {
    process.env.NEXT_PUBLIC_USE_MOCKS = "false"

    vi.clearAllMocks()
    vi.resetModules()
    vi.doMock("@/lib/api-client", () => ({
      apiClient: { get: mockGet, post: mockPost, put: mockPut, delete: mockDelete },
    }))
  })

  afterAll(() => {
    if (originalUseMocks === undefined) {
      delete process.env.NEXT_PUBLIC_USE_MOCKS
    } else {
      process.env.NEXT_PUBLIC_USE_MOCKS = originalUseMocks
    }
  })

  it("fetchTeamsFx populates $teams store", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockTeam] } })

    const { fetchTeamsFx, $teams } = await import("../teams")
    const scope = fork()

    await allSettled(fetchTeamsFx, { scope })

    expect(mockGet).toHaveBeenCalledWith("/api/v1/teams")
    expect(scope.getState($teams)).toHaveLength(1)
    expect(scope.getState($teams)[0].member_count).toBe(2)
  })

  it("fetchTeamsFx uses mock teams when mock mode is enabled", async () => {
    process.env.NEXT_PUBLIC_USE_MOCKS = "true"

    const { fetchTeamsFx, $teams } = await import("../teams")
    const scope = fork()

    await allSettled(fetchTeamsFx, { scope })

    expect(mockGet).not.toHaveBeenCalled()
    expect(scope.getState($teams).length).toBeGreaterThan(0)
  })

  it("createTeamFx appends a new team to $teams", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockTeam] } })
    const newTeam = { ...mockTeam, id: 2, name: "Growth" }
    mockPost.mockResolvedValueOnce({ data: { data: newTeam } })

    const { fetchTeamsFx, createTeamFx, $teams } = await import("../teams")
    const scope = fork()

    await allSettled(fetchTeamsFx, { scope })
    await allSettled(createTeamFx, {
      scope,
      params: { name: "Growth", description: null },
    })

    expect(scope.getState($teams)).toHaveLength(2)
    expect(scope.getState($teams)[1].name).toBe("Growth")
  })

  it("updateTeamFx replaces an updated team in $teams", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockTeam] } })
    const updated = { ...mockTeam, name: "Research Ops" }
    mockPut.mockResolvedValueOnce({ data: { data: updated } })

    const { fetchTeamsFx, updateTeamFx, $teams } = await import("../teams")
    const scope = fork()

    await allSettled(fetchTeamsFx, { scope })
    await allSettled(updateTeamFx, {
      scope,
      params: { id: 1, name: "Research Ops" },
    })

    expect(scope.getState($teams)[0].name).toBe("Research Ops")
  })

  it("deleteTeamFx removes a team from $teams", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockTeam] } })
    mockDelete.mockResolvedValueOnce({})

    const { fetchTeamsFx, deleteTeamFx, $teams } = await import("../teams")
    const scope = fork()

    await allSettled(fetchTeamsFx, { scope })
    await allSettled(deleteTeamFx, { scope, params: 1 })

    expect(scope.getState($teams)).toHaveLength(0)
  })
})
