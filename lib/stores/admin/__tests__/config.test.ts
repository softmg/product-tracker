import { describe, it, expect, vi, beforeEach } from "vitest"
import { allSettled, fork } from "effector"

const mockTransitions = [
  {
    id: 1,
    from_status: "backlog",
    to_status: "scoring",
    allowed_roles: ["admin", "initiator"],
    condition_type: "none",
    condition_value: null,
    is_active: true,
  },
  {
    id: 2,
    from_status: "scoring",
    to_status: "go_no_go",
    allowed_roles: ["admin"],
    condition_type: "scoring_threshold",
    condition_value: "7.5",
    is_active: true,
  },
]

const mockNotificationSettings = [
  {
    id: 1,
    event_type: "status_change",
    recipients: ["admin"],
    template: "Status changed",
    channel: "in_app",
    is_active: true,
  },
  {
    id: 2,
    event_type: "committee_decision",
    recipients: ["committee", "initiator"],
    template: "Decision is ready",
    channel: "email",
    is_active: false,
  },
]

const mockGet = vi.fn()
const mockPut = vi.fn()

describe("admin config store", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.doMock("@/lib/api-client", () => ({
      apiClient: { get: mockGet, put: mockPut, post: vi.fn(), delete: vi.fn() },
    }))
  })

  it("fetchTransitionsFx populates $transitions store", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockTransitions } })

    const { fetchTransitionsFx, $transitions } = await import("../config")
    const scope = fork()

    await allSettled(fetchTransitionsFx, { scope })

    expect(scope.getState($transitions)).toHaveLength(2)
    expect(scope.getState($transitions)[0].from_status).toBe("backlog")
    expect(scope.getState($transitions)[1].allowed_roles).toContain("admin")
  })

  it("fetchTransitionsFx calls correct API endpoint", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } })

    const { fetchTransitionsFx } = await import("../config")
    const scope = fork()

    await allSettled(fetchTransitionsFx, { scope })

    expect(mockGet).toHaveBeenCalledWith("/api/v1/admin/status-transitions")
  })

  it("fetchNotificationSettingsFx populates $notificationSettings store", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockNotificationSettings } })

    const { fetchNotificationSettingsFx, $notificationSettings } = await import("../config")
    const scope = fork()

    await allSettled(fetchNotificationSettingsFx, { scope })

    expect(scope.getState($notificationSettings)).toHaveLength(2)
    expect(scope.getState($notificationSettings)[0].event_type).toBe("status_change")
  })

  it("updateNotificationSettingFx updates setting in store", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockNotificationSettings } })
    const updatedSetting = { ...mockNotificationSettings[1], is_active: true }
    mockPut.mockResolvedValueOnce({ data: { data: updatedSetting } })

    const { fetchNotificationSettingsFx, updateNotificationSettingFx, $notificationSettings } = await import("../config")
    const scope = fork()

    await allSettled(fetchNotificationSettingsFx, { scope })
    await allSettled(updateNotificationSettingFx, {
      scope,
      params: { id: 2, event_type: "committee_decision", is_active: true },
    })

    expect(scope.getState($notificationSettings)[1].is_active).toBe(true)
    expect(mockPut).toHaveBeenCalledWith("/api/v1/admin/notification-events/2", {
      event_type: "committee_decision",
      is_active: true,
    })
  })
})
