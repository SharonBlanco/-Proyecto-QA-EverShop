import { defineConfig, devices } from '@playwright/test';


process.loadEnvFile('.env'); 


const ADMIN_STATE = 'playwright/.auth/admin.json';
const CLIENTE_STATE = 'playwright/.auth/cliente.json';



export default defineConfig({
  testDir: './testsProyecto/',
  fullyParallel: true,          
  workers: 3,
  retries: 0,
  timeout: 30_000,
  reporter: [
    ['list'],
    ['./qatlas-reporter.cjs', { project: 'ES', createBugOnFailure: true, attachments: 'all'  }],   // el CÓDIGO de tu proyecto en QAtlas
  ],
  use: {
    baseURL: process.env.BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },




   projects: [
     { name: 'setup', testMatch: /.*\.setup\.ts/ },
     {
       name: 'evershop',
       testMatch: /.*\.test\.ts/,          // cualquier archivo .test.ts
       dependencies: ['setup'],            // primero inicia sesión
       use: { ...devices['Desktop Chrome'] },
     },
   ],
});
