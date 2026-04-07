import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
  {
    test: {
      name: "frontend",
      include: ["lib/**/__tests__/**/*.test.ts"],
      environment: "node",
    },
  },
])
