import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"

export interface StatusTransition {
  from_status: string
  to_status: string
  label: string
  required_role: string | null
  requires_comment: boolean
}

export interface NotificationSetting {
  id: number
  event: string
  channels: string[]
  is_active: boolean
}

export const fetchTransitionsFx = createEffect(async (): Promise<StatusTransition[]> => {
  const { data } = await apiClient.get<{ data: StatusTransition[] }>("/api/v1/admin/config/transitions")
  return data.data
})

export const fetchNotificationSettingsFx = createEffect(async (): Promise<NotificationSetting[]> => {
  const { data } = await apiClient.get<{ data: NotificationSetting[] }>("/api/v1/admin/config/notifications")
  return data.data
})

export const updateNotificationSettingFx = createEffect(
  async ({ id, ...params }: { id: number; channels?: string[]; is_active?: boolean }): Promise<NotificationSetting> => {
    const { data } = await apiClient.put<{ data: NotificationSetting }>(
      `/api/v1/admin/config/notifications/${id}`,
      params,
    )
    return data.data
  },
)

export const $transitions = createStore<StatusTransition[]>([]).on(
  fetchTransitionsFx.doneData,
  (_, transitions) => transitions,
)

export const $notificationSettings = createStore<NotificationSetting[]>([])
  .on(fetchNotificationSettingsFx.doneData, (_, settings) => settings)
  .on(updateNotificationSettingFx.doneData, (settings, updated) =>
    settings.map((s) => (s.id === updated.id ? updated : s)),
  )

export const $transitionsLoading = fetchTransitionsFx.pending
export const $notificationsLoading = fetchNotificationSettingsFx.pending
