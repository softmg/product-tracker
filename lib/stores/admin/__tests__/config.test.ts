import { describe, it, expect, vi, beforeEach } from "vitest"
import { allSettled, fork } from "effector"

const mockTransitions = [
  { from_status: "backlog", to_status: "scoring", label: "Send to Scoring", required_role: null, requires_comment: false },
  { from_status: "scoring", to_status: "approved", label: "Approve", required_role: "admin", requires_comment: true },
]

const mockNotificationSettings = [
  { id: 1, event: "hypothesis.created", channels: ["email"], is_active: true },
  { id: 2, event: "hypothesis.approved", channels: ["email", "slack"], is_active: false },
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
    expect(scope.getState($transitions)[1].required_role).toBe("admin")
  })

  it("fetchTransitionsFx calls correct API endpoint", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } })

    const { fetchTransitionsFx } = await import("../config")
    const scope = fork()

    await allSettled(fetchTransitionsFx, { scope })

    expect(mockGet).toHaveBeenCalledWith("/api/v1/admin/config/transitions")
  })

  it("fetchNotificationSettingsFx populates $notificationSettings store", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockNotificationSettings } })

    const { fetchNotificationSettingsFx, $notificationSettings } = await import("../config")
    const scope = fork()

    await allSettled(fetchNotificationSettingsFx, { scope })

    expect(scope.getState($notificationSettings)).toHaveLength(2)
    expect(scope.getState($notificationSettings)[0].event).toBe("hypothesis.created")
  })

  it("updateNotificationSettingFx updates setting in store", async () => {
    mockGet.mockResolvedValueOnce({ data: { data: mockNotificationSettings } })
    const updatedSetting = { ...mockNotificationSettings[1], is_active: true }
    mockPut.mockResolvedValueOnce({ data: { data: updatedSetting } })

    const { fetchNotificationSettingsFx, updateNotificationSettingFx, $notificationSettings } = await import("../config")
    const scope = fork()

    await allSettled(fetchNotificationSettingsFx, { scope })
    await allSettled(updateNotificationSettingFx, { scope, params: { id: 2, is_active: true } })

    expect(scope.getState($notificationSettings)[1].is_active).toBe(true)
  })
})
