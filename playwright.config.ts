import { defineConfig } from '@playwright/test';

const base = process.env['VITE_BASE_PATH'] ?? '/';
const remote = process.env['PLAYWRIGHT_BASE_URL'];
const baseURL = remote ?? `http://127.0.0.1:4173${base}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: { baseURL, viewport: { width: 1440, height: 1000 } },
  ...(remote
    ? {}
    : {
        webServer: {
          command: 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort',
          url: baseURL,
          reuseExistingServer: !process.env['CI'],
        },
      }),
});
