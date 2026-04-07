import { createEffect, createEvent, createStore } from "effector"
import { apiClient } from "@/lib/api-client"

export interface Notification {
  id: number
  type: string
  title: string
  body: string
  is_read: boolean
  hypothesis_id: number | null
  created_at: string
}

export interface NotificationsMeta {
  total: number
  unread: number
}

export const fetchNotificationsFx = createEffect(
  async (params: { page?: number; per_page?: number; unread_only?: boolean } = {}): Promise<{
    data: Notification[]
    meta: NotificationsMeta
  }> => {
    const { data } = await apiClient.get<{ data: Notification[]; meta: NotificationsMeta }>(
      "/api/v1/notifications",
      { params },
    )
    return data
  },
)

export const fetchUnreadCountFx = createEffect(async (): Promise<number> => {
  const { data } = await apiClient.get<{ data: { count: number } }>("/api/v1/notifications/unread-count")
  return data.data.count
})

export const markReadFx = createEffect(async (id: number): Promise<Notification> => {
  const { data } = await apiClient.patch<{ data: Notification }>(`/api/v1/notifications/${id}/read`)
  return data.data
})

export const markAllReadFx = createEffect(async (): Promise<void> => {
  await apiClient.post("/api/v1/notifications/mark-all-read")
})

export const resetNotifications = createEvent()

export const $notifications = createStore<Notification[]>([])
  .on(fetchNotificationsFx.doneData, (_, result) => result.data)
  .on(markReadFx.doneData, (notifications, updated) =>
    notifications.map((n) => (n.id === updated.id ? updated : n)),
  )
  .on(markAllReadFx.done, (notifications) => notifications.map((n) => ({ ...n, is_read: true })))
  .reset(resetNotifications)

export const $unreadCount = createStore<number>(0)
  .on(fetchNotificationsFx.doneData, (_, result) => result.meta.unread)
  .on(fetchUnreadCountFx.doneData, (_, count) => count)
  .on(markReadFx.doneData, (count) => Math.max(0, count - 1))
  .on(markAllReadFx.done, () => 0)

export const $notificationsLoading = fetchNotificationsFx.pending
