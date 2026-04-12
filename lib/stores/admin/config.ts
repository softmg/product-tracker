import { createEffect, createStore } from "effector"
import { apiClient } from "@/lib/api-client"

export interface StatusTransition {
  id: number
  from_status: string
  to_status: string
  allowed_roles: string[]
  condition_type: string
  condition_value: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface NotificationSetting {
  id: number
  event_type: string
  recipients: string[]
  template: string | null
  channel: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export const fetchTransitionsFx = createEffect(async (): Promise<StatusTransition[]> => {
  const { data } = await apiClient.get<{ data: StatusTransition[] }>("/api/v1/admin/status-transitions")
  return data.data
})

export const fetchNotificationSettingsFx = createEffect(async (): Promise<NotificationSetting[]> => {
  const { data } = await apiClient.get<{ data: NotificationSetting[] }>("/api/v1/admin/notification-events")
  return data.data
})

export const updateNotificationSettingFx = createEffect(
  async ({
    id,
    ...params
  }: {
    id: number
    recipients?: string[]
    template?: string | null
    channel?: string | null
    is_active?: boolean
    event_type?: string
  }): Promise<NotificationSetting> => {
    const { data } = await apiClient.put<{ data: NotificationSetting }>(
      `/api/v1/admin/notification-events/${id}`,
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
