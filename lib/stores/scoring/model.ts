import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"

export interface ScoringCriteria {
  id: number
  name: string
  description: string | null
  stage: "primary" | "deep"
  weight: number
  min_value: number
  max_value: number
  order: number
}

export interface ScoringSubmission {
  hypothesis_id: number
  stage: "primary" | "deep"
  criteria_scores: Record<number, number>
  total_score: number | null
  submitted_at: string
}

export const fetchCriteriaFx = createEffect(async (stage: "primary" | "deep"): Promise<ScoringCriteria[]> => {
  const { data } = await apiClient.get<{ data: ScoringCriteria[] }>("/api/v1/scoring-criteria", {
    params: { stage },
  })
  return data.data
})

export const fetchScoringFx = createEffect(
  async ({
    hypothesisId,
    stage,
  }: {
    hypothesisId: number
    stage: "primary" | "deep"
  }): Promise<ScoringSubmission | null> => {
    const { data } = await apiClient.get<{ data: ScoringSubmission | null }>(
      `/api/v1/hypotheses/${hypothesisId}/scoring/${stage}`,
    )
    return data.data
  },
)

export const submitScoringFx = createEffect(
  async ({
    hypothesisId,
    stage,
    criteria_scores,
  }: {
    hypothesisId: number
    stage: "primary" | "deep"
    criteria_scores: Record<number, number>
  }): Promise<ScoringSubmission> => {
    const { data } = await apiClient.post<{ data: ScoringSubmission }>(
      `/api/v1/hypotheses/${hypothesisId}/scoring/${stage}`,
      { criteria_scores },
    )
    return data.data
  },
)

export const $criteria = createStore<ScoringCriteria[]>([]).on(
  fetchCriteriaFx.doneData,
  (_, criteria) => criteria,
)

export const $currentScoring = createStore<ScoringSubmission | null>(null)
  .on(fetchScoringFx.doneData, (_, scoring) => scoring)
  .on(submitScoringFx.doneData, (_, scoring) => scoring)

export const $scoringLoading = fetchScoringFx.pending
export const $scoringSubmitting = submitScoringFx.pending
