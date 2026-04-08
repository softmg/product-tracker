import { describe, it, expect, vi, beforeEach } from "vitest"

const mockApiRequest = vi.fn()
const mockAxiosGet = vi.fn()

vi.mock("axios", () => {
  return {
    default: {
      create: () => ({
        request: mockApiRequest,
        interceptors: {
          request: { use: vi.fn() },
          response: {
            use: vi.fn((_, errorHandler) => {
              ;(globalThis as { __apiErrorHandler?: typeof errorHandler }).__apiErrorHandler = errorHandler
            }),
          },
        },
      }),
      get: mockAxiosGet,
    },
  }
})

describe("api-client helpers", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete (globalThis as { __apiErrorHandler?: unknown }).__apiErrorHandler
  })

  it("normalizes plain host unchanged", async () => {
    const { normalizeApiBaseUrl } = await import("@/lib/api-client")
    expect(normalizeApiBaseUrl("http://localhost:8000")).toBe("http://localhost:8000")
  })

  it("removes trailing slashes", async () => {
    const { normalizeApiBaseUrl } = await import("@/lib/api-client")
    expect(normalizeApiBaseUrl("http://localhost:8000///")).toBe("http://localhost:8000")
  })

  it("strips /api suffix", async () => {
    const { normalizeApiBaseUrl } = await import("@/lib/api-client")
    expect(normalizeApiBaseUrl("http://localhost:8000/api")).toBe("http://localhost:8000")
  })

  it("strips /api suffix with trailing slash", async () => {
    const { normalizeApiBaseUrl } = await import("@/lib/api-client")
    expect(normalizeApiBaseUrl("http://localhost:8000/api/")).toBe("http://localhost:8000")
  })

  it("trims whitespace and strips /api", async () => {
    const { normalizeApiBaseUrl } = await import("@/lib/api-client")
    expect(normalizeApiBaseUrl("  http://localhost:8000/api  ")).toBe("http://localhost:8000")
  })

  it("retries once after 419 by refreshing csrf cookie", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "false")

    await import("@/lib/api-client")

    const errorHandler = (globalThis as { __apiErrorHandler?: (error: unknown) => Promise<unknown> }).__apiErrorHandler

    expect(errorHandler).toBeTruthy()

    const error = {
      response: { status: 419 },
      config: { url: "/api/v1/auth/login", method: "post" },
    }

    mockApiRequest.mockResolvedValueOnce({ data: { ok: true } })

    const result = await errorHandler!(error)

    expect(mockAxiosGet).toHaveBeenCalledWith("http://localhost:8000/sanctum/csrf-cookie", {
      withCredentials: true,
      headers: { Accept: "application/json" },
    })
    expect(mockApiRequest).toHaveBeenCalledWith(expect.objectContaining({ _csrfRetried: true }))
    expect(result).toEqual({ data: { ok: true } })
  })
})
