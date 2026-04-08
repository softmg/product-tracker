import { describe, it, expect } from "vitest"
import { normalizeApiBaseUrl } from "@/lib/api-client"

describe("normalizeApiBaseUrl", () => {
  it("keeps plain host unchanged", () => {
    expect(normalizeApiBaseUrl("http://localhost:8000")).toBe("http://localhost:8000")
  })

  it("removes trailing slashes", () => {
    expect(normalizeApiBaseUrl("http://localhost:8000///")).toBe("http://localhost:8000")
  })

  it("strips /api suffix", () => {
    expect(normalizeApiBaseUrl("http://localhost:8000/api")).toBe("http://localhost:8000")
  })

  it("strips /api suffix with trailing slash", () => {
    expect(normalizeApiBaseUrl("http://localhost:8000/api/")).toBe("http://localhost:8000")
  })

  it("trims whitespace and strips /api", () => {
    expect(normalizeApiBaseUrl("  http://localhost:8000/api  ")).toBe("http://localhost:8000")
  })
})
