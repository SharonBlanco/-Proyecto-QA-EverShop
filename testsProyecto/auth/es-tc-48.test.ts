import { test, expect } from '@playwright/test';

test('@ES-TC-48 - Contraseña incorrecta', async ({ page }) => {
  process.loadEnvFile('.env.qa');

  await page.goto('/account/login');

  await page.getByPlaceholder('Email').fill(process.env.CLIENTE_EMAIL!);
  await page.getByPlaceholder('Password').fill('PasswordIncorrecta987!');

  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByText(/invalid email or password/i))
    .toBeVisible({ timeout: 15000 });

  await expect(page).toHaveURL(/\/account\/login/);
});

