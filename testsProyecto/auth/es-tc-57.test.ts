import { test, expect } from '@playwright/test';

test('@ES-TC-57 - Cierre de sesión exitoso del cliente', async ({ page }) => {
  test.setTimeout(90000);
  process.loadEnvFile('.env.qa');

  await page.goto('/account/login');

  await page.getByPlaceholder('Email').fill(process.env.CLIENTE_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.CLIENTE_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).not.toHaveURL(/\/account\/login/, {
    timeout: 20000
  });

  // Acceder a la cuenta
  await page.goto('/account');

  // Cerrar sesión
  await page.getByRole('button', { name: /log out|logout|sign out/i }).click();
  await expect(page).toHaveURL('http://localhost:3000/', { timeout: 15000 });

  // Comprobar que la sesión quedó cerrada
  await page.goto('/account');
  await expect(page).toHaveURL(/\/account\/login/, {
    timeout: 15000
  });
});




