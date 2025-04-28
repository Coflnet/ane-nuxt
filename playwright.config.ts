import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Directory where your tests are located
  testDir: './tests/e2e', // Adjust this path if your tests are elsewhere

  // Maximum time one test can run for.
  timeout: 30 * 1000,

  // Expect timeout
  expect: {
    timeout: 5000
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use. See https://playwright.dev/docs/reporters
  reporter: 'html',

  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    // This should match the URL where @nuxt/test-utils starts your Nuxt app.
    // The default is usually http://localhost:3000
    baseURL: 'http://localhost:3000', // Verify this matches your Nuxt dev server URL

    // Headless mode
    headless: false, // Set to false to watch the browser

    // Channel for browser (e.g., 'chrome', 'msedge')
    // channel: 'chrome',

    // Collect trace when retrying the first time.
    trace: 'on-first-retry',
  },

  // Configure projects for major browsers

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev', // Or the command to start your Nuxt dev server
  //   url: 'http://localhost:3000', // The URL your dev server runs on
  //   timeout: 120 * 1000, // Give it enough time to start
  //   reuseExistingServer: !process.env.CI, // Reuse server locally
  // },
});
