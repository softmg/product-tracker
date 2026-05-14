import { defineProject } from "vitest/config"

const workspace = [
  defineProject({
    test: {
      name: "frontend",
      include: ["lib/**/__tests__/**/*.test.ts"],
      environment: "node",
    },
  }),
]

export default workspace
