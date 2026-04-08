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
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export { apiClient }
