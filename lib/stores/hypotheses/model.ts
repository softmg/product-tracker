import { combine, createEffect, createEvent, createStore, sample } from "effector"
import { apiClient } from "@/lib/api-client"
import type {
  ApiHypothesisDetail,
  ApiHypothesisList,
  ApiPaginationMeta,
  CreateHypothesisParams,
  FetchHypothesesParams,
  TransitionHypothesisParams,
  UpdateHypothesisParams,
} from "./types"

// ─── Effects ────────────────────────────────────────────────────────────────

export const fetchHypothesesFx = createEffect(
  async (params: FetchHypothesesParams = {}): Promise<{ data: ApiHypothesisList[]; meta: ApiPaginationMeta }> => {
    const { data } = await apiClient.get<{ data: ApiHypothesisList[]; meta: ApiPaginationMeta }>(
      "/api/v1/hypotheses",
      { params },
    )
    return data
  },
)

export const fetchHypothesisFx = createEffect(async (id: number): Promise<ApiHypothesisDetail> => {
  const { data } = await apiClient.get<{ data: ApiHypothesisDetail }>(`/api/v1/hypotheses/${id}`)
  return data.data
})

export const createHypothesisFx = createEffect(async (params: CreateHypothesisParams): Promise<ApiHypothesisDetail> => {
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
