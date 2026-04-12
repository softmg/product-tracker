import { combine, createEffect, createEvent, createStore, sample } from "effector"
import { apiClient } from "@/lib/api-client"
import { mockHypotheses } from "@/lib/mock-data"
import type {
  ApiHypothesisDetail,
  ApiHypothesisList,
  ApiPaginationMeta,
  CreateHypothesisParams,
  FetchHypothesesParams,
  TransitionHypothesisParams,
  UpdateHypothesisParams,
} from "./types"

const useHypothesisMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true"
const hypothesisApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

if (!useHypothesisMocks && !hypothesisApiUrl) {
  throw new Error("NEXT_PUBLIC_API_URL must be set when NEXT_PUBLIC_USE_MOCKS is false (hypotheses store)")
}

export const isHypothesisMockMode = useHypothesisMocks

// Map mock hypothesis to API list shape
const mapMockToApiList = (h: (typeof mockHypotheses)[number]): ApiHypothesisList => ({
  id: Number.parseInt(h.id.replace("hyp-", ""), 10) || 0,
  code: h.code,
  title: h.title,
  status: h.status,
  priority: null,
  initiator: null,
  owner: h.ownerId
    ? { id: Number.parseInt(h.ownerId.replace("user-", ""), 10) || 0, name: "", email: "", role: "initiator" as const }
    : null,
  team: h.teamId
    ? { id: Number.parseInt(h.teamId.replace("team-", ""), 10) || 0, name: "" }
    : null,
  scoring_primary: h.scoring?.totalScore ?? null,
  scoring_deep: null,
  sla_deadline: h.deadline ?? null,
  created_at: h.createdAt,
  updated_at: h.updatedAt,
})

// ─── Effects ────────────────────────────────────────────────────────────────

export const fetchHypothesesFx = createEffect(
  async (params: FetchHypothesesParams = {}): Promise<{ data: ApiHypothesisList[]; meta: ApiPaginationMeta }> => {
    if (isHypothesisMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      const filtered = mockHypotheses
        .filter((h) => !params.status || h.status === params.status)
        .filter(
          (h) =>
            !params.search ||
            h.title.toLowerCase().includes(params.search.toLowerCase()) ||
            h.code.toLowerCase().includes(params.search.toLowerCase()),
        )
      const mapped = filtered.map(mapMockToApiList)
      return {
        data: mapped,
        meta: { current_page: 1, last_page: 1, per_page: mapped.length, total: mapped.length, from: 1, to: mapped.length },
      }
    }

    const { data } = await apiClient.get<{ data: ApiHypothesisList[]; meta: ApiPaginationMeta }>(
      "/api/v1/hypotheses",
      { params },
    )
    return data
  },
)

export const fetchHypothesisFx = createEffect(async (id: number): Promise<ApiHypothesisDetail> => {
  if (isHypothesisMockMode) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const h = mockHypotheses.find((m) => Number.parseInt(m.id.replace("hyp-", ""), 10) === id)
    if (!h) throw new Error(`Hypothesis ${id} not found`)
    return {
      ...mapMockToApiList(h),
      description: h.description ?? null,
      problem: null,
      solution: null,
      target_audience: null,
      initiator_id: null,
      owner_id: h.ownerId ? Number.parseInt(h.ownerId.replace("user-", ""), 10) : null,
      team_id: h.teamId ? Number.parseInt(h.teamId.replace("team-", ""), 10) : null,
    }
  }

  const { data } = await apiClient.get<{ data: ApiHypothesisDetail }>(`/api/v1/hypotheses/${id}`)
  return data.data
})

export const createHypothesisFx = createEffect(async (params: CreateHypothesisParams): Promise<ApiHypothesisDetail> => {
  if (isHypothesisMockMode) {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const newId = mockHypotheses.length + 1
    return {
      id: newId,
      code: `HYP-${String(newId).padStart(3, "0")}`,
      title: params.title,
      status: "backlog",
      priority: params.priority ?? null,
      initiator: null,
      owner: null,
      team: null,
      scoring_primary: null,
      scoring_deep: null,
      sla_deadline: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      description: params.description ?? null,
      problem: params.problem ?? null,
      solution: params.solution ?? null,
      target_audience: params.target_audience ?? null,
      initiator_id: null,
      owner_id: null,
      team_id: params.team_id ?? null,
    }
  }

  const { data } = await apiClient.post<{ data: ApiHypothesisDetail }>("/api/v1/hypotheses", params)
  return data.data
})

export const updateHypothesisFx = createEffect(
  async ({ id, ...params }: UpdateHypothesisParams): Promise<ApiHypothesisDetail> => {
    const { data } = await apiClient.put<{ data: ApiHypothesisDetail }>(`/api/v1/hypotheses/${id}`, params)
    return data.data
  },
)

export const transitionHypothesisFx = createEffect(
  async ({ id, ...params }: TransitionHypothesisParams): Promise<ApiHypothesisDetail> => {
    if (isHypothesisMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      const h = mockHypotheses.find((m) => Number.parseInt(m.id.replace("hyp-", ""), 10) === id)
      if (!h) throw new Error(`Hypothesis ${id} not found`)
      return {
        ...mapMockToApiList(h),
        status: params.to_status,
        description: h.description ?? null,
        problem: null,
        solution: null,
        target_audience: null,
        initiator_id: null,
        owner_id: h.ownerId ? Number.parseInt(h.ownerId.replace("user-", ""), 10) : null,
        team_id: h.teamId ? Number.parseInt(h.teamId.replace("team-", ""), 10) : null,
      }
    }

    const { data } = await apiClient.post<{ data: ApiHypothesisDetail }>(
      `/api/v1/hypotheses/${id}/transition`,
      params,
    )
    return data.data
  },
)

export const deleteHypothesisFx = createEffect(async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/hypotheses/${id}`)
})

// ─── Events ─────────────────────────────────────────────────────────────────

export const resetHypotheses = createEvent()
export const resetCurrentHypothesis = createEvent()
export const setFilters = createEvent<FetchHypothesesParams>()

// ─── Stores ─────────────────────────────────────────────────────────────────

export const $hypotheses = createStore<ApiHypothesisList[]>([])
  .on(fetchHypothesesFx.doneData, (_, result) => result.data)
  .on(deleteHypothesisFx.done, (list, { params: id }) => list.filter((h) => h.id !== id))
  .reset(resetHypotheses)

export const $hypothesesMeta = createStore<ApiPaginationMeta | null>(null)
  .on(fetchHypothesesFx.doneData, (_, result) => result.meta)
  .reset(resetHypotheses)

export const $currentHypothesis = createStore<ApiHypothesisDetail | null>(null)
  .on(fetchHypothesisFx.doneData, (_, hypothesis) => hypothesis)
  .on(updateHypothesisFx.doneData, (_, hypothesis) => hypothesis)
  .on(transitionHypothesisFx.doneData, (_, hypothesis) => hypothesis)
  .reset(resetCurrentHypothesis)

export const $filters = createStore<FetchHypothesesParams>({})
  .on(setFilters, (_, filters) => filters)
  .reset(resetHypotheses)

export const $isLoading = combine(
  fetchHypothesesFx.pending,
  fetchHypothesisFx.pending,
  (listLoading, detailLoading) => listLoading || detailLoading,
)

export const $isMutating = combine(
  createHypothesisFx.pending,
  updateHypothesisFx.pending,
  transitionHypothesisFx.pending,
  deleteHypothesisFx.pending,
  (creating, updating, transitioning, deleting) => creating || updating || transitioning || deleting,
)

// Re-fetch list when filters change
sample({
  clock: setFilters,
  source: $filters,
  target: fetchHypothesesFx,
})
