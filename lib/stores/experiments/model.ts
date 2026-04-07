import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"

export interface Experiment {
  id: number
  hypothesis_id: number
  title: string
  description: string | null
  status: "planned" | "running" | "completed" | "cancelled"
  result: "success" | "failure" | "inconclusive" | null
  result_notes: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateExperimentParams {
  hypothesis_id: number
  title: string
  description?: string
}

export interface UpdateExperimentParams {
  id: number
  title?: string
  description?: string
  status?: Experiment["status"]
}

export interface SetResultParams {
  id: number
  result: "success" | "failure" | "inconclusive"
  result_notes?: string
}

export const fetchExperimentsFx = createEffect(async (hypothesisId: number): Promise<Experiment[]> => {
  const { data } = await apiClient.get<{ data: Experiment[] }>(`/api/v1/hypotheses/${hypothesisId}/experiments`)
  return data.data
})

export const createExperimentFx = createEffect(async (params: CreateExperimentParams): Promise<Experiment> => {
  const { hypothesis_id, ...rest } = params
  const { data } = await apiClient.post<{ data: Experiment }>(
    `/api/v1/hypotheses/${hypothesis_id}/experiments`,
    rest,
  )
  return data.data
})

export const updateExperimentFx = createEffect(async ({ id, ...params }: UpdateExperimentParams): Promise<Experiment> => {
  const { data } = await apiClient.put<{ data: Experiment }>(`/api/v1/experiments/${id}`, params)
  return data.data
})

export const deleteExperimentFx = createEffect(async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/experiments/${id}`)
})

export const setExperimentResultFx = createEffect(async ({ id, ...params }: SetResultParams): Promise<Experiment> => {
  const { data } = await apiClient.patch<{ data: Experiment }>(`/api/v1/experiments/${id}/result`, params)
  return data.data
})

export const $experiments = createStore<Experiment[]>([])
  .on(fetchExperimentsFx.doneData, (_, experiments) => experiments)
  .on(createExperimentFx.doneData, (experiments, exp) => [...experiments, exp])
  .on(updateExperimentFx.doneData, (experiments, updated) =>
    experiments.map((e) => (e.id === updated.id ? updated : e)),
  )
  .on(setExperimentResultFx.doneData, (experiments, updated) =>
    experiments.map((e) => (e.id === updated.id ? updated : e)),
  )
  .on(deleteExperimentFx.done, (experiments, { params: id }) => experiments.filter((e) => e.id !== id))

export const $experimentsLoading = fetchExperimentsFx.pending
export const $experimentsMutating = createExperimentFx.pending
