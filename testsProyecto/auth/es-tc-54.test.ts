import { test, expect } from '@playwright/test';

test('@ES-TC-54 - Denegar acceso administrativo a un cliente', async ({ page }) => {
  process.loadEnvFile('.env.qa');

  await page.goto('/admin/login');

  await page.getByPlaceholder('Email').fill(process.env.CLIENTE_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.CLIENTE_PASSWORD!);

  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // El cliente debe permanecer fuera del panel administrativo
  await expect(page).toHaveURL(/\/admin\/login/, {
    timeout: 15000
  });

  // Verificar que se rechaza el acceso
  await expect(page.getByText(/invalid|incorrect|wrong|error|denied/i).first())
    .toBeVisible({ timeout: 15000 });
});
