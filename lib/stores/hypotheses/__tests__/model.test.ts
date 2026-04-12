import { describe, it, expect, vi, beforeEach } from "vitest"
import { allSettled, fork } from "effector"

const mockHypothesis = {
  id: 1,
  code: "HYP-001",
  title: "Test hypothesis",
  status: "backlog",
  priority: "medium" as const,
  initiator: { id: 1, name: "Alice", email: "alice@example.com", role: "initiator" as const },
  owner: null,
  team: null,
  scoring_primary: null,
  scoring_deep: null,
  sla_deadline: null,
  created_at: "2026-04-06T00:00:00Z",
  updated_at: "2026-04-06T00:00:00Z",
}

const mockMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 1,
  from: 1,
  to: 1,
}

const mockGet = vi.fn()
const mockPost = vi.fn()

describe("hypotheses store env resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    vi.doMock("@/lib/api-client", () => ({
      apiClient: { get: mockGet, post: mockPost, put: vi.fn(), delete: vi.fn() },
    }))
  })

  it("uses mocks when NEXT_PUBLIC_USE_MOCKS=true", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true")
    vi.stubEnv("NEXT_PUBLIC_API_URL", "")

    vi.doMock("@/lib/mock-data", () => ({
      mockHypotheses: [
        {
          id: "hyp-1",
          code: "HYP-001",
          title: "Mock hypothesis",
          status: "backlog",
          ownerId: null,
          teamId: null,
          scoring: null,
          deadline: null,
          createdAt: "2026-04-06T00:00:00Z",
          updatedAt: "2026-04-06T00:00:00Z",
          description: null,
        },
      ],
    }))

    const { fetchHypothesesFx, isHypothesisMockMode } = await import("../model")
    const scope = fork()

    const result = await allSettled(fetchHypothesesFx, {
      scope,
      params: {},
    })

    expect(isHypothesisMockMode).toBe(true)
    expect(result.status).toBe("done")
    expect(mockGet).not.toHaveBeenCalled()
  })

  it("uses API when NEXT_PUBLIC_USE_MOCKS=false and API URL exists", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false")
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000")

    vi.doMock("@/lib/mock-data", () => ({ mockHypotheses: [] }))
    mockGet.mockResolvedValueOnce({ data: { data: [mockHypothesis], meta: mockMeta } })

    const { fetchHypothesesFx, isHypothesisMockMode } = await import("../model")
    const scope = fork()

    const result = await allSettled(fetchHypothesesFx, {
      scope,
      params: {},
    })

    expect(isHypothesisMockMode).toBe(false)
    expect(result.status).toBe("done")
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it("throws when NEXT_PUBLIC_USE_MOCKS=false and API URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false")
    vi.stubEnv("NEXT_PUBLIC_API_URL", "")

    vi.doMock("@/lib/mock-data", () => ({ mockHypotheses: [] }))

    await expect(import("../model")).rejects.toThrow(
      "NEXT_PUBLIC_API_URL must be set when NEXT_PUBLIC_USE_MOCKS is false (hypotheses store)",
    )
  })
})

describe("hypotheses store", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false")

    vi.doMock("@/lib/api-client", () => ({
      apiClient: { get: mockGet, post: mockPost, put: vi.fn(), delete: vi.fn() },
    }))
    vi.doMock("@/lib/mock-data", () => ({
      mockHypotheses: [],
    }))
  })

  it("fetchHypothesesFx populates $hypotheses and $hypothesesMeta", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockHypothesis], meta: mockMeta } })

    const { fetchHypothesesFx, $hypotheses, $hypothesesMeta } = await import("../model")
    const scope = fork()

    await allSettled(fetchHypothesesFx, { scope, params: {} })

    expect(scope.getState($hypotheses)).toHaveLength(1)
    expect(scope.getState($hypotheses)[0].code).toBe("HYP-001")
    expect(scope.getState($hypothesesMeta)?.total).toBe(1)
  })

  it("fetchHypothesesFx passes filter params to API", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [], meta: { ...mockMeta, total: 0 } } })

    const { fetchHypothesesFx } = await import("../model")
    const scope = fork()

    await allSettled(fetchHypothesesFx, { scope, params: { status: "scoring", search: "test" } })

    expect(mockGet).toHaveBeenCalledWith("/api/v1/hypotheses", {
      params: { status: "scoring", search: "test" },
    })
  })

  it("createHypothesisFx posts to API and returns new hypothesis", async () => {
    const newHypothesis = {
      ...mockHypothesis,
      id: 2,
      code: "HYP-002",
      title: "New hypothesis",
      description: null,
      problem: null,
      solution: null,
      target_audience: null,
      initiator_id: 1,
      owner_id: null,
      team_id: null,
    }
    mockPost.mockResolvedValueOnce({ data: { data: newHypothesis } })

    const { createHypothesisFx } = await import("../model")
    const scope = fork()

    const result = await allSettled(createHypothesisFx, {
      scope,
      params: { title: "New hypothesis" },
    })

    expect(mockPost).toHaveBeenCalledWith("/api/v1/hypotheses", { title: "New hypothesis" })
    expect(result.status).toBe("done")
  })

  it("deleteHypothesisFx removes hypothesis from $hypotheses store", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockHypothesis], meta: mockMeta } })
    const mockDelete = vi.fn().mockResolvedValueOnce({})
    vi.doMock("@/lib/api-client", () => ({
      apiClient: { get: mockGet, post: mockPost, put: vi.fn(), delete: mockDelete },
    }))

    const { fetchHypothesesFx, deleteHypothesisFx, $hypotheses } = await import("../model")
    const scope = fork()

    await allSettled(fetchHypothesesFx, { scope, params: {} })
    expect(scope.getState($hypotheses)).toHaveLength(1)

    await allSettled(deleteHypothesisFx, { scope, params: 1 })
    expect(scope.getState($hypotheses)).toHaveLength(0)
  })

  it("resetHypotheses clears $hypotheses and $hypothesesMeta", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockHypothesis], meta: mockMeta } })

    const { fetchHypothesesFx, resetHypotheses, $hypotheses, $hypothesesMeta } = await import("../model")
    const scope = fork()

    await allSettled(fetchHypothesesFx, { scope, params: {} })
    expect(scope.getState($hypotheses)).toHaveLength(1)

    await allSettled(resetHypotheses, { scope, params: undefined })
    expect(scope.getState($hypotheses)).toHaveLength(0)
    expect(scope.getState($hypothesesMeta)).toBeNull()
  })
})
