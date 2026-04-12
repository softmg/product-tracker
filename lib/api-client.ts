import axios from "axios"

export const normalizeApiBaseUrl = (value: string): string => {
  const normalized = value.trim().replace(/\/+$/, "")

  if (normalized.endsWith("/api")) {
    return normalized.slice(0, -4)
  }

  return normalized
}

const backendBaseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || "")
const useMockFallback = process.env.NEXT_PUBLIC_USE_MOCKS === "true"

const getCookieValue = (name: string): string | null => {
  if (typeof document === "undefined") {
    return null
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))

  if (!cookie) {
    return null
  }

  return decodeURIComponent(cookie.split("=").slice(1).join("="))
}

const apiClient = axios.create({
  baseURL: backendBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

apiClient.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toLowerCase()
  const shouldAttachCsrf = ["post", "put", "patch", "delete"].includes(method)

  if (shouldAttachCsrf && backendBaseUrl && !useMockFallback) {
    await axios.get(`${backendBaseUrl}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: {
        Accept: "application/json",
      },
    })

    const xsrfToken = getCookieValue("XSRF-TOKEN")

    if (xsrfToken) {
      config.headers = config.headers ?? {}
      config.headers["X-XSRF-TOKEN"] = xsrfToken
    }
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const requestWithRetryFlag = error?.config as (typeof error.config & { _csrfRetried?: boolean }) | undefined

    if (status === 419 && requestWithRetryFlag && !requestWithRetryFlag._csrfRetried && backendBaseUrl && !useMockFallback) {
      requestWithRetryFlag._csrfRetried = true

      await axios.get(`${backendBaseUrl}/sanctum/csrf-cookie`, {
        withCredentials: true,
        headers: {
          Accept: "application/json",
        },
      })

      return apiClient.request(requestWithRetryFlag)
    }

    if (status === 401 && typeof window !== "undefined") {
      const pathname = window.location.pathname
      const isPublicAuthPage =
        pathname === "/login" ||
        pathname === "/setup" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password"

      if (!isPublicAuthPage) {
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)

export { apiClient }
