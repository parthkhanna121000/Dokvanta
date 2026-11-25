import { defineConfig } from "vitest/config";

export default defineConfig({
  // One copy of mongoose for every importer, even if a stray install exists under src/node_modules.
  resolve: { dedupe: ["mongoose"] },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // First run downloads a mongod binary for mongodb-memory-server.
    hookTimeout: 180000,
    testTimeout: 30000,
  },
});