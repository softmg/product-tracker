import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"

export interface StatusDistribution {
  status: string
  count: number
}

export interface InitiatorStat {
  user_id: number
  name: string
  count: number
}

export interface TeamStat {
  team_id: number
  name: string
  count: number
}

export interface TimelinePoint {
  month: string
  count: number
}

export const fetchStatusDistributionFx = createEffect(async (): Promise<StatusDistribution[]> => {
  const { data } = await apiClient.get<{ data: StatusDistribution[] }>("/api/v1/analytics/status-distribution")
  return data.data
})

export const fetchInitiatorStatsFx = createEffect(async (): Promise<InitiatorStat[]> => {
  const { data } = await apiClient.get<{ data: InitiatorStat[] }>("/api/v1/analytics/initiator-stats")
  return data.data
})

export const fetchTeamStatsFx = createEffect(async (): Promise<TeamStat[]> => {
  const { data } = await apiClient.get<{ data: TeamStat[] }>("/api/v1/analytics/team-stats")
  return data.data
})

export const fetchTimelineStatsFx = createEffect(
  async (params: { from?: string; to?: string } = {}): Promise<TimelinePoint[]> => {
    const { data } = await apiClient.get<{ data: TimelinePoint[] }>("/api/v1/analytics/timeline", { params })
    return data.data
  },
)

export const $statusDistribution = createStore<StatusDistribution[]>([]).on(
  fetchStatusDistributionFx.doneData,
  (_, data) => data,
)

export const $initiatorStats = createStore<InitiatorStat[]>([]).on(
  fetchInitiatorStatsFx.doneData,
  (_, data) => data,
)

export const $teamStats = createStore<TeamStat[]>([]).on(fetchTeamStatsFx.doneData, (_, data) => data)

export const $timelineStats = createStore<TimelinePoint[]>([]).on(
  fetchTimelineStatsFx.doneData,
  (_, data) => data,
)

export const $analyticsLoading = fetchStatusDistributionFx.pending
