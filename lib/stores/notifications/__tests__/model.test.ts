import { describe, it, expect, vi, beforeEach } from "vitest"
import { allSettled, fork } from "effector"

const mockNotification = {
  id: 1,
  type: "hypothesis.created",
  title: "New Hypothesis",
  body: "A new hypothesis was created",
  is_read: false,
  hypothesis_id: 1,
  created_at: "2026-04-06T00:00:00Z",
}

const mockMeta = { total: 1, unread: 1 }

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPatch = vi.fn()

describe("notifications store", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.doMock("@/lib/api-client", () => ({
      apiClient: { get: mockGet, post: mockPost, patch: mockPatch, put: vi.fn(), delete: vi.fn() },
    }))
  })

  it("fetchNotificationsFx populates $notifications and $unreadCount", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockNotification], meta: mockMeta } })

    const { fetchNotificationsFx, $notifications, $unreadCount } = await import("../model")
    const scope = fork()

    await allSettled(fetchNotificationsFx, { scope, params: {} })

    expect(scope.getState($notifications)).toHaveLength(1)
    expect(scope.getState($unreadCount)).toBe(1)
  })

  it("markReadFx updates notification is_read flag", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [mockNotification], meta: mockMeta } })
    const readNotification = { ...mockNotification, is_read: true }
    mockPatch.mockResolvedValueOnce({ data: { data: readNotification } })

    const { fetchNotificationsFx, markReadFx, $notifications, $unreadCount } = await import("../model")
    const scope = fork()

    await allSettled(fetchNotificationsFx, { scope, params: {} })
    await allSettled(markReadFx, { scope, params: 1 })

    expect(scope.getState($notifications)[0].is_read).toBe(true)
    expect(scope.getState($unreadCount)).toBe(0)
  })

  it("markAllReadFx marks all notifications as read and resets count", async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        data: [mockNotification, { ...mockNotification, id: 2 }],
        meta: { total: 2, unread: 2 },
      },
    })
    mockPost.mockResolvedValueOnce({})

    const { fetchNotificationsFx, markAllReadFx, $notifications, $unreadCount } = await import("../model")
    const scope = fork()

    await allSettled(fetchNotificationsFx, { scope, params: {} })
    await allSettled(markAllReadFx, { scope })

    expect(scope.getState($unreadCount)).toBe(0)
    expect(scope.getState($notifications).every((n) => n.is_read)).toBe(true)
  })

  it("fetchUnreadCountFx updates $unreadCount directly", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: { count: 7 } } })

    const { fetchUnreadCountFx, $unreadCount } = await import("../model")
    const scope = fork()

    await allSettled(fetchUnreadCountFx, { scope })

    expect(scope.getState($unreadCount)).toBe(7)
  })
})
