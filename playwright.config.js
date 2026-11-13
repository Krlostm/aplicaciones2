import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  reporter: [['list'], ['json', { outputFile: 'docs/evidencias/navegador.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    screenshot: 'only-on-failure',
    // Evitar que los informes conserven cuerpos de login o cookies de sesión.
    trace: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'movil-chromium', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
});
