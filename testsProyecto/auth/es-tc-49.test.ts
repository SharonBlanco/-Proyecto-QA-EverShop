import { test, expect } from '@playwright/test';

test('@ES-TC-49 - Correo no registrado', async ({ page }) => {
  process.loadEnvFile('.env.qa');

  await page.goto('/account/login');

  await page.getByPlaceholder('Email')
    .fill('usuario-inexistente-qa-987654@example.com');

  await page.getByPlaceholder('Password')
    .fill(process.env.CLIENTE_PASSWORD!);

  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByText(/invalid email or password/i))
    .toBeVisible({ timeout: 15000 });

  await expect(page).toHaveURL(/\/account\/login/);
});

