import { test, expect } from '@playwright/test';

test('@ES-TC-47 - Inicio de sesión exitoso', async ({ page }) => {
  process.loadEnvFile('.env.qa');

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('HTTP ERROR:', response.status(), response.url());
    }
  });

  page.on('pageerror', error => {
    console.log('JS ERROR:', error.message);
  });

  await page.goto('/account/login');

  await page.getByPlaceholder('Email').fill(process.env.CLIENTE_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.CLIENTE_PASSWORD!);

  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).not.toHaveURL(/\/account\/login(?:[/?#]|$)/, {
    timeout: 15000
  });
});

