import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["lib/**/__tests__/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**", "backend/**"],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
})
