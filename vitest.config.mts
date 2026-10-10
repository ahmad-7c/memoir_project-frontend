import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // `forks`, not `threads`. Both are documented as correct here, but threads
    // share a process and each worker startup has to load Vite's transform
    // graph from disk. In a OneDrive-synced directory that read is slow enough
    // to blow the pool's startup timeout, and the failure is
    // "Failed to start threads worker" with no indication that disk latency is
    // the cause. Forks pay the load cost per process instead of contending for
    // it, and the isolation is a better fit for tests that stub globals anyway.
    pool: "forks",
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}"],
    },
  },
});
