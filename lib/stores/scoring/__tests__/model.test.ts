import { describe, it, expect, vi, beforeEach } from "vitest"
import { allSettled, fork } from "effector"

const mockCriteria = [
  { id: 1, name: "TAM", description: null, stage: "primary" as const, weight: 1, min_value: 0, max_value: 5, order: 1 },
  { id: 2, name: "SAM", description: null, stage: "primary" as const, weight: 1, min_value: 0, max_value: 5, order: 2 },
]

const mockScoring = {
  hypothesis_id: 1,
  stage: "primary" as const,
  criteria_scores: { 1: 4, 2: 3 },
  total_score: 35,
  submitted_at: "2026-04-06T00:00:00Z",
}

const mockGet = vi.fn()
const mockPost = vi.fn()

describe("scoring store", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.doMock("@/lib/api-client", () => ({
      apiClient: { get: mockGet, post: mockPost, put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
    }))
  })

  it("fetchCriteriaFx populates $criteria store", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockCriteria } })

    const { fetchCriteriaFx, $criteria } = await import("../model")
    const scope = fork()

    await allSettled(fetchCriteriaFx, { scope, params: "primary" })

    expect(scope.getState($criteria)).toHaveLength(2)
    expect(scope.getState($criteria)[0].name).toBe("TAM")
  })

  it("fetchCriteriaFx calls correct API endpoint", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } })

    const { fetchCriteriaFx } = await import("../model")
    const scope = fork()

    await allSettled(fetchCriteriaFx, { scope, params: "deep" })

    expect(mockGet).toHaveBeenCalledWith("/api/v1/scoring-criteria", { params: { stage: "deep" } })
  })

  it("submitScoringFx updates $currentScoring store", async () => {
    mockPost.mockResolvedValueOnce({ data: { data: mockScoring } })

    const { submitScoringFx, $currentScoring } = await import("../model")
    const scope = fork()

    await allSettled(submitScoringFx, {
      scope,
      params: { hypothesisId: 1, stage: "primary", criteria_scores: { 1: 4, 2: 3 } },
    })

    expect(scope.getState($currentScoring)?.total_score).toBe(35)
    expect(scope.getState($currentScoring)?.stage).toBe("primary")
  })

  it("fetchScoringFx populates $currentScoring when scoring exists", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockScoring } })

    const { fetchScoringFx, $currentScoring } = await import("../model")
    const scope = fork()

    await allSettled(fetchScoringFx, { scope, params: { hypothesisId: 1, stage: "primary" } })

    expect(scope.getState($currentScoring)).not.toBeNull()
    expect(scope.getState($currentScoring)?.hypothesis_id).toBe(1)
  })
})
