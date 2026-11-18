import { test, expect } from '@playwright/test';

test('@ES-TC-52 - Inicio de sesión exitoso del administrador', async ({ page }) => {
  process.loadEnvFile('.env.qa');

  await page.goto('/admin/login');

  await page.getByPlaceholder('Email').fill(process.env.ADMIN_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.ADMIN_PASSWORD!);

  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Verificar que accede al panel administrativo
  await expect(page).not.toHaveURL(/\/admin\/login(?:[/?#]|$)/, {
    timeout: 20000
  });

  await expect(page).toHaveURL(/\/admin(?:\/|$)/);
});
