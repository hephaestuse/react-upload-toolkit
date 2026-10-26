import { defineConfig } from 'playwright/test';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:3047',
    launchOptions: executablePath ? { executablePath } : {},
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -w react-free-upload-example',
    url: 'http://127.0.0.1:3047',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  reporter: [['list'], ['json', { outputFile: 'artifacts/e2e-results.json' }]],
});
