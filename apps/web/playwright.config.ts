import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  retries: process.env.CI ? 2 : 0,
  reporter: [["html"], ["list"]],
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "cd ../.. && pnpm dev",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
