const readOptionalEnv = (key: string): string | undefined => {
  const value = process.env[key]?.trim()

  return value && value.length > 0 ? value : undefined
}

const buildEphemeralSecret = (seed: string): string => {
  return `${seed}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

const resolveSecret = (envKey: string, seed: string, fallbackEnvKey?: string, fallbackValue?: string): string => {
  return readOptionalEnv(envKey) ?? readOptionalEnv(fallbackEnvKey ?? "") ?? fallbackValue ?? buildEphemeralSecret(seed)
}

export type TestUserCredentials = {
  email: string
  password: string
}

export const TEST_USERS: Record<"admin" | "initiator" | "pdManager", TestUserCredentials> = {
  admin: {
    email: readOptionalEnv("TEST_ADMIN_EMAIL") ?? "admin@company.com",
    password: resolveSecret("TEST_ADMIN_PASSWORD", "admin", "E2E_DEFAULT_PASSWORD"),
  },
  initiator: {
    email: readOptionalEnv("TEST_INITIATOR_EMAIL") ?? "viewer@company.com",
    password: resolveSecret("TEST_INITIATOR_PASSWORD", "initiator", "E2E_DEFAULT_PASSWORD"),
  },
  pdManager: {
    email: readOptionalEnv("TEST_PD_MANAGER_EMAIL") ?? "po@company.com",
    password: resolveSecret("TEST_PD_MANAGER_PASSWORD", "pd-manager", "E2E_DEFAULT_PASSWORD"),
  },
}

export const INVALID_AUTH_CREDENTIALS: TestUserCredentials = {
  email: readOptionalEnv("TEST_INVALID_EMAIL") ?? "wrong@example.com",
  password: resolveSecret("TEST_INVALID_PASSWORD", "invalid", "E2E_INVALID_PASSWORD"),
}

export const TEST_NEW_USER_PASSWORD = resolveSecret("TEST_NEW_USER_PASSWORD", "new-user", "E2E_DEFAULT_PASSWORD")
