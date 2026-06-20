import { defineConfig } from "vitest/config";

// Integration tests run the real Drizzle query layer against an in-process
// PGlite Postgres (no Docker, no network) — runnable locally and in CI.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
