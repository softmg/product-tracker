import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"

export interface DeepDiveStage {
  id: number
  name: string
  description: string | null
  order: number
  is_required: boolean
  responsible_role: string
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  comments: DeepDiveComment[]
}

export interface DeepDiveComment {
  id: number
  user_id: number
  user_name: string
  text: string
  created_at: string
}

export interface DeepDiveProgress {
  completed: number
  total: number
  percentage: number
}

export const fetchDeepDiveFx = createEffect(
  async (hypothesisId: number): Promise<{ stages: DeepDiveStage[]; progress: DeepDiveProgress }> => {
    const { data } = await apiClient.get<{ data: { stages: DeepDiveStage[]; progress: DeepDiveProgress } }>(
      `/api/v1/hypotheses/${hypothesisId}/deep-dive`,
    )
    return data.data
  },
)

export const toggleStageFx = createEffect(
  async ({
    hypothesisId,
    stageId,
    is_completed,
  }: {
    hypothesisId: number
    stageId: number
    is_completed: boolean
  }): Promise<DeepDiveStage> => {
    const { data } = await apiClient.patch<{ data: DeepDiveStage }>(
      `/api/v1/hypotheses/${hypothesisId}/deep-dive/stages/${stageId}`,
      { is_completed },
    )
    return data.data
  },
)

export const addCommentFx = createEffect(
  async ({
    hypothesisId,
    stageId,
    text,
  }: {
    hypothesisId: number
    stageId: number
    text: string
  }): Promise<DeepDiveComment> => {
    const { data } = await apiClient.post<{ data: DeepDiveComment }>(
      `/api/v1/hypotheses/${hypothesisId}/deep-dive/stages/${stageId}/comments`,
      { text },
    )
    return data.data
  },
)

export const $deepDiveStages = createStore<DeepDiveStage[]>([])
  .on(fetchDeepDiveFx.doneData, (_, result) => result.stages)
  .on(toggleStageFx.doneData, (stages, updated) =>
    stages.map((s) => (s.id === updated.id ? updated : s)),
  )

export const $deepDiveProgress = createStore<DeepDiveProgress | null>(null).on(
  fetchDeepDiveFx.doneData,
  (_, result) => result.progress,
)

export const $deepDiveLoading = fetchDeepDiveFx.pending
