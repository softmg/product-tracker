import { combine, createEffect, createEvent, createStore, sample } from "effector"
import { apiClient } from "@/lib/api-client"
import { mockHypotheses, mockUsers } from "@/lib/mock-data"
import type {
  ApiHypothesisDetail,
  ApiHypothesisList,
  ApiPaginationMeta,
  ApiUserRef,
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

const parseMockNumericId = (id: string): number => {
  const parsed = Number.parseInt(id.replace(/^[a-z]+-/, ""), 10)

  return Number.isNaN(parsed) ? 0 : parsed
}

const mapMockUserToApiRef = (id: number | string | null | undefined): ApiUserRef | null => {
  if (id === null || id === undefined || id === "") {
    return null
  }

  const numericId = typeof id === "number" ? id : parseMockNumericId(id)

  if (numericId <= 0) {
    return null
  }

  const user = mockUsers.find((candidate) => parseMockNumericId(candidate.id) === numericId)

  return {
    id: numericId,
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "initiator",
  }
}

// Map mock hypothesis to API list shape
const mapMockToApiList = (h: (typeof mockHypotheses)[number]): ApiHypothesisList => ({
  id: Number.parseInt(h.id.replace("hyp-", ""), 10) || 0,
  code: h.code,
  title: h.title,
  status: h.status,
  priority: null,
  initiator: null,
  owner: mapMockUserToApiRef(h.ownerId),
  team: h.teamId
    ? { id: Number.parseInt(h.teamId.replace("team-", ""), 10) || 0, name: "" }
    : null,
  scoring_primary: h.scoring?.totalScore ?? null,
  scoring_deep: null,
  sla_deadline: h.deadline ?? null,
  created_at: h.createdAt,
  updated_at: h.updatedAt,
})

const mapDetailToApiList = (h: ApiHypothesisDetail): ApiHypothesisList => ({
  id: h.id,
  code: h.code,
  title: h.title,
  status: h.status,
  priority: h.priority,
  initiator: h.initiator,
  owner: h.owner,
  team: h.team,
  scoring_primary: h.scoring_primary,
  scoring_deep: h.scoring_deep,
  sla_deadline: h.sla_deadline,
  created_at: h.created_at,
  updated_at: h.updated_at,
})

const mockCreatedHypotheses: ApiHypothesisDetail[] = []

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
      const createdFiltered = mockCreatedHypotheses
        .filter((h) => !params.status || h.status === params.status)
        .filter(
          (h) =>
            !params.search ||
            h.title.toLowerCase().includes(params.search.toLowerCase()) ||
            h.code.toLowerCase().includes(params.search.toLowerCase()),
        )
      const mapped = [...filtered.map(mapMockToApiList), ...createdFiltered.map(mapDetailToApiList)]
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
    const created = mockCreatedHypotheses.find((m) => m.id === id)
    if (created) {
      return created
    }

    const h = mockHypotheses.find((m) => Number.parseInt(m.id.replace("hyp-", ""), 10) === id)
    if (!h) throw new Error(`Hypothesis ${id} not found`)
    return {
      ...mapMockToApiList(h),
      description: h.description ?? null,
      problem: null,
      solution: null,
      assumptions: null,
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
    const newId = mockHypotheses.length + mockCreatedHypotheses.length + 1
    const createdAt = new Date().toISOString()
    const owner = mapMockUserToApiRef(params.owner_id)
    const created: ApiHypothesisDetail = {
      id: newId,
      code: `HYP-${String(newId).padStart(3, "0")}`,
      title: params.title,
      status: "backlog",
      priority: params.priority ?? null,
      initiator: null,
      owner,
      team: null,
      scoring_primary: null,
      scoring_deep: null,
      sla_deadline: null,
      created_at: createdAt,
      updated_at: createdAt,
      description: params.description ?? null,
      problem: params.problem ?? null,
      solution: params.solution ?? null,
      assumptions: params.assumptions ?? null,
      target_audience: params.target_audience ?? null,
      initiator_id: null,
      owner_id: owner?.id ?? null,
      team_id: params.team_id ?? null,
    }

    mockCreatedHypotheses.push(created)
    return created
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
        assumptions: null,
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
  .on(createHypothesisFx.doneData, (list, hypothesis) => [...list, mapDetailToApiList(hypothesis)])
  .on(deleteHypothesisFx.done, (list, { params: id }) => list.filter((h) => h.id !== id))
  .reset(resetHypotheses)

export const $hypothesesMeta = createStore<ApiPaginationMeta | null>(null)
  .on(fetchHypothesesFx.doneData, (_, result) => result.meta)
  .reset(resetHypotheses)

export const $currentHypothesis = createStore<ApiHypothesisDetail | null>(null)
  .on(fetchHypothesisFx.doneData, (_, hypothesis) => hypothesis)
  .on(createHypothesisFx.doneData, (_, hypothesis) => hypothesis)
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
