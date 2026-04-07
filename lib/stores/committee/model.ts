import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"

export interface CommitteeVote {
  id: number
  hypothesis_id: number
  user_id: number
  user_name: string
  vote: "go" | "no_go" | "abstain"
  comment: string | null
  created_at: string
}

export interface CommitteeDecision {
  hypothesis_id: number
  result: "go" | "no_go" | "pivot" | null
  votes_go: number
  votes_no_go: number
  votes_abstain: number
  finalized_at: string | null
}

export const fetchVotesFx = createEffect(
  async (hypothesisId: number): Promise<{ votes: CommitteeVote[]; decision: CommitteeDecision }> => {
    const { data } = await apiClient.get<{ data: { votes: CommitteeVote[]; decision: CommitteeDecision } }>(
      `/api/v1/hypotheses/${hypothesisId}/committee`,
    )
    return data.data
  },
)

export const castVoteFx = createEffect(
  async ({
    hypothesisId,
    vote,
    comment,
  }: {
    hypothesisId: number
    vote: "go" | "no_go" | "abstain"
    comment?: string
  }): Promise<CommitteeVote> => {
    const { data } = await apiClient.post<{ data: CommitteeVote }>(
      `/api/v1/hypotheses/${hypothesisId}/committee/vote`,
      { vote, comment },
    )
    return data.data
  },
)

export const finalizeDecisionFx = createEffect(async (hypothesisId: number): Promise<CommitteeDecision> => {
  const { data } = await apiClient.post<{ data: CommitteeDecision }>(
    `/api/v1/hypotheses/${hypothesisId}/committee/finalize`,
  )
  return data.data
})

export const $votes = createStore<CommitteeVote[]>([])
  .on(fetchVotesFx.doneData, (_, result) => result.votes)
  .on(castVoteFx.doneData, (votes, newVote) => {
    const exists = votes.find((v) => v.user_id === newVote.user_id)
    if (exists) return votes.map((v) => (v.user_id === newVote.user_id ? newVote : v))
    return [...votes, newVote]
  })

export const $committeeDecision = createStore<CommitteeDecision | null>(null)
  .on(fetchVotesFx.doneData, (_, result) => result.decision)
  .on(finalizeDecisionFx.doneData, (_, decision) => decision)

export const $committeeLoading = fetchVotesFx.pending
